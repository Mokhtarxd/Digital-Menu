import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

const defaultOpeningHours: Record<string, string[]> = {
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

type OpeningHoursConfig = Record<string, unknown>;

type ExtractableValue = string | string[] | undefined;

const resolveLanguage = (language: string | undefined): string => {
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

const resolveOpeningHours = (raw: string | undefined, language: string): string[] => {
  const normalized = resolveLanguage(language);
  const fallback = defaultOpeningHours[normalized] ?? defaultOpeningHours.en;

  if (!raw) {
    return fallback;
  }

  let lines: string[] = [];

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

  if (!lines.length) {
    lines = asLines(raw);
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

  const lines = useMemo(
    () => resolveOpeningHours(import.meta.env.VITE_OPENING_HOURS, language),
    [language]
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
