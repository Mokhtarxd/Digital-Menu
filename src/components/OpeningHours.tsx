import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

export const defaultOpeningHours: Record<string, string[]> = {
  en: ['Open daily · 12:00 – 23:00'],
  fr: ['Ouvert tous les jours · 12h00 – 23h00'],
  es: ['Abierto todos los días · 12:00 – 23:00'],
  ar: ['مفتوح يوميًا · 12:00 – 23:00'],
};

type OpeningHoursVariant = 'desktop' | 'mobile';

interface OpeningHoursProps {
  variant?: OpeningHoursVariant;
  className?: string;
}

export type OpeningHoursConfig = Record<string, unknown>;

type ExtractableValue = string | string[] | undefined;

export const resolveLanguage = (language: string | undefined): string => {
  if (!language) return 'en';
  const lower = language.toLowerCase();
  const parts = lower.split('-');
  return parts[0] || 'en';
};

const asLines = (value: ExtractableValue): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }
  return String(value)
    .split(/[|\n\r]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const extractFromConfig = (
  config: OpeningHoursConfig,
  language: string,
  fullLanguage: string
): string[] => {
  const normalized = resolveLanguage(language);
  const entries = Object.entries(config);

  const directMatch = entries.find(([key]) => resolveLanguage(key) === normalized);
  if (directMatch) {
    return asLines(directMatch[1] as ExtractableValue);
  }

  const fullMatch = entries.find(([key]) => key.toLowerCase() === fullLanguage.toLowerCase());
  if (fullMatch) {
    return asLines(fullMatch[1] as ExtractableValue);
  }

  const defaultMatch =
    entries.find(([key]) => key.toLowerCase() === 'default') ??
    entries.find(([key]) => key.toLowerCase() === 'en');
  if (defaultMatch) {
    return asLines(defaultMatch[1] as ExtractableValue);
  }

  return [];
};

export const resolveOpeningHours = (raw: unknown, language: string): string[] => {
  const normalized = resolveLanguage(language);
  const fallback = defaultOpeningHours[normalized] ?? defaultOpeningHours.en;

  if (!raw) {
    return fallback;
  }

  let lines: string[] = [];

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) || typeof parsed === 'string') {
        lines = asLines(parsed as ExtractableValue);
      } else if (parsed && typeof parsed === 'object') {
        lines = extractFromConfig(parsed as OpeningHoursConfig, normalized, language);
      }
    } catch {
      // Treat as plain string fallback
    }
  } else if (Array.isArray(raw) || typeof raw === 'string') {
    lines = asLines(raw as ExtractableValue);
  } else if (raw && typeof raw === 'object') {
    lines = extractFromConfig(raw as OpeningHoursConfig, normalized, language);
  }

  if (!lines.length && (typeof raw === 'string' || Array.isArray(raw))) {
    lines = asLines(raw as ExtractableValue);
  }

  return lines.length ? lines : fallback;
};

const variantClasses: Record<OpeningHoursVariant, { container: string; item: string }> = {
  desktop: {
    container: 'text-xs sm:text-sm leading-relaxed text-muted-foreground',
    item: 'text-xs sm:text-sm',
  },
  mobile: {
    container: 'text-[11px] leading-tight text-muted-foreground',
    item: 'text-[11px]',
  },
};

export const OpeningHours = ({ variant = 'desktop', className }: OpeningHoursProps) => {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || 'en';
  const [customValue, setCustomValue] = useState<unknown>(undefined);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'opening_hours')
          .maybeSingle<{ value: unknown }>();

        if (!isMounted) return;
        setCustomValue(data?.value ?? null);
      } catch (error) {
        if (isMounted) {
          setCustomValue((prev) => (prev === undefined ? null : prev));
        }
        console.error('Failed to load opening hours', error);
      }
    };

    load();

    const channel = supabase
      .channel('public:site_settings:opening_hours')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings',
          filter: 'key=eq.opening_hours',
        },
        (payload) => {
          if (!isMounted) return;
          const next = (payload.new as { value?: unknown } | null)?.value;
          setCustomValue(next ?? null);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const lines = useMemo(
    () => {
      const source = customValue !== undefined ? customValue : import.meta.env.VITE_OPENING_HOURS;
      return resolveOpeningHours(source, language);
    },
    [customValue, language]
  );

  if (!lines.length) {
    return null;
  }

  const styles = variantClasses[variant];

  return (
    <div className={cn('flex flex-col', styles.container, className)}>
      <ul className="mt-0.5 space-y-0.5 list-none pl-0">
        {lines.map((line, index) => (
          <li key={index} className={styles.item}>
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OpeningHours;
