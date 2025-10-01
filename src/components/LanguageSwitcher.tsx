import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';

import { SUPPORTED_LANGUAGES } from '@/i18n';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type LanguageSwitcherProps = {
  className?: string;
  align?: 'start' | 'center' | 'end';
  size?: 'sm' | 'default';
};

const normalizeLanguage = (language?: string) =>
  (language ?? 'en').split('-')[0];

export const LanguageSwitcher = ({
  className,
  align = 'end',
  size = 'default',
}: LanguageSwitcherProps) => {
  const { i18n, t } = useTranslation();
  const currentLanguage = normalizeLanguage(i18n.resolvedLanguage || i18n.language);

  const items = useMemo(
    () =>
      SUPPORTED_LANGUAGES.map((lang) => ({
        value: lang.value,
        label: t(lang.labelKey),
      })),
    [t]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size === 'sm' ? 'sm' : 'default'}
          className={cn('flex items-center gap-2 rounded-full px-3', className)}
          aria-label={t('languageSwitcher.label')}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline text-sm font-medium">
            {items.find((item) => item.value === currentLanguage)?.label ?? t('language.en')}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}
        className="min-w-[160px]"
      >
        {items.map((item) => (
          <DropdownMenuItem
            key={item.value}
            onClick={() => i18n.changeLanguage(item.value)}
            className="flex items-center justify-between gap-2"
          >
            <span>{item.label}</span>
            {item.value === currentLanguage && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
