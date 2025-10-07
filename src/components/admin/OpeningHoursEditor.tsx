import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { defaultOpeningHours, resolveOpeningHours } from '@/components/OpeningHours';
import type { Database } from '@/integrations/supabase/types';

type OpeningHoursEditorProps = {
  className?: string;
};

const languages = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'ar', label: 'العربية' },
] as const;

type LanguageCode = (typeof languages)[number]['code'];

type FormState = Record<string, string>;

type OpeningHoursPayload = Record<string, string[]>;

type SiteSettingsInsert = Database['public']['Tables']['site_settings']['Insert'];
type SiteSettingsValue = Database['public']['Tables']['site_settings']['Row']['value'];

const textareaToLines = (input: string): string[] =>
  input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const mapValueToState = (value: unknown): FormState => {
  const source = value ?? defaultOpeningHours;
  return languages.reduce<FormState>((acc, { code }) => {
    acc[code] = resolveOpeningHours(source, code).join('\n');
    return acc;
  }, {});
};

const ensurePayload = (state: FormState): OpeningHoursPayload => {
  const payload = languages.reduce<OpeningHoursPayload>((acc, { code }) => {
    const lines = textareaToLines(state[code] ?? '');
    if (lines.length) {
      acc[code] = lines;
    }
    return acc;
  }, {} as OpeningHoursPayload);

  if (!Object.keys(payload).length) {
    payload.en = [...defaultOpeningHours.en];
  }

  if (!payload.default) {
    const fallback =
      payload.en ??
      payload.fr ??
      payload.es ??
      payload.ar ??
      [...defaultOpeningHours.en];
    payload.default = Array.isArray(fallback) ? [...fallback] : [...defaultOpeningHours.en];
  }

  return payload;
};

export const OpeningHoursEditor = ({ className }: OpeningHoursEditorProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<LanguageCode>('en');
  const [formValues, setFormValues] = useState<FormState>(mapValueToState(defaultOpeningHours));
  const [lastSavedState, setLastSavedState] = useState<FormState>(mapValueToState(defaultOpeningHours));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'opening_hours')
          .maybeSingle<{ value: unknown }>();

        if (!isMounted) {
          return;
        }

        if (error) {
          throw error;
        }

        const value = data?.value ?? defaultOpeningHours;
        const state = mapValueToState(value);
        setFormValues(state);
        setLastSavedState(state);
        setErrorMessage(null);
      } catch (error) {
        console.error('Failed to load opening hours settings', error);
        if (isMounted) {
          const fallbackState = mapValueToState(defaultOpeningHours);
          setFormValues(fallbackState);
          setLastSavedState(fallbackState);
          setErrorMessage('Unable to load saved hours. Showing defaults.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    const channel = supabase
      .channel('admin:site_settings:opening_hours')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings',
          filter: 'key=eq.opening_hours',
        },
        (payload) => {
          if (!isMounted) {
            return;
          }
          const nextValue = (payload.new as { value?: unknown } | null)?.value ?? defaultOpeningHours;
          const state = mapValueToState(nextValue);
          setFormValues(state);
          setLastSavedState(state);
          setErrorMessage(null);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const isDirty = useMemo(
    () =>
      languages.some(({ code }) => (formValues[code] ?? '') !== (lastSavedState[code] ?? '')),
    [formValues, lastSavedState]
  );

  const handleChange = (code: LanguageCode) =>
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const { value } = event.target;
      setFormValues((prev) => ({ ...prev, [code]: value }));
    };

  const handleSave = async () => {
    setSaving(true);
    setErrorMessage(null);
    try {
      const payload = ensurePayload(formValues);
      const update: SiteSettingsInsert = {
        key: 'opening_hours',
        value: payload as SiteSettingsValue,
      };
      const { error } = await supabase.from('site_settings').upsert(update);

      if (error) {
        throw error;
      }

      const nextState = mapValueToState(payload);
      setFormValues(nextState);
      setLastSavedState(nextState);

      toast({
        title: 'Opening hours updated',
        description: 'The public banner will refresh automatically.',
      });
    } catch (error) {
      console.error('Failed to save opening hours', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(message);
      toast({
        variant: 'destructive',
        title: 'Could not save opening hours',
        description: message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    setFormValues(mapValueToState(defaultOpeningHours));
  };

  const handleRevertChanges = () => {
    setFormValues(lastSavedState);
  };

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader>
        <CardTitle>Opening hours</CardTitle>
        <CardDescription>
          Update the text displayed under the restaurant name. Use separate lines for split schedules.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading opening hours…
          </div>
        ) : (
          <>
            {errorMessage ? (
              <p className="text-sm text-destructive">{errorMessage}</p>
            ) : null}

            <Tabs
              value={activeTab}
              onValueChange={(next) => setActiveTab(next as LanguageCode)}
              className="space-y-4"
            >
              <TabsList className="grid w-full grid-cols-4">
                {languages.map(({ code, label }) => (
                  <TabsTrigger key={code} value={code}>
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {languages.map(({ code, label }) => (
                <TabsContent key={code} value={code} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      {label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      One line per row. Leave blank to fall back to default.
                    </span>
                  </div>
                  <Textarea
                    value={formValues[code] ?? ''}
                    onChange={handleChange(code)}
                    placeholder={'Lunch 12:00 – 15:30\nDinner 19:00 – 23:30'}
                    className="min-h-[120px]"
                  />
                </TabsContent>
              ))}
            </Tabs>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleSave} disabled={!isDirty || saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save changes
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleRevertChanges}
                disabled={!isDirty || saving}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Revert edits
              </Button>
              <Button type="button" variant="ghost" onClick={handleResetToDefaults} disabled={saving}>
                Reset to defaults
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
