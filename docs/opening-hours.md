# Opening Hours Banner

The line(s) shown beneath the "Dar Lmeknessiya" title are fully configurable without touching the code.

## Quick start

1. Open your `.env` file.
2. Set the `VITE_OPENING_HOURS` variable.
3. Restart the Vite dev server so the new value is loaded.

## Formatting options

| Format | Example | Result |
| --- | --- | --- |
| Single line | `VITE_OPENING_HOURS="Monday – Sunday · 12:00 – 23:00"` | Shows one line exactly as typed. |
| Multiple lines (pipe) | `VITE_OPENING_HOURS="Lunch 12:00 – 15:30|Dinner 19:00 – 23:30"` | Splits on the `|` character and shows each entry on its own line. |
| JSON array | `VITE_OPENING_HOURS='["Lunch 12:00 – 15:30", "Dinner 19:00 – 23:30"]'` | Same as above but using JSON. |
| JSON per language | `VITE_OPENING_HOURS='{"en":["Open daily 12:00 – 23:00"],"fr":["Ouvert tous les jours 12h00 – 23h00"]}'` | Picks the array (or string) that matches the active language, then falls back to `default` or `en`. |

### Language fallbacks

- The resolver looks for an exact match of the current i18n language (e.g. `fr`) or the base language (e.g. `fr-CA` → `fr`).
- If nothing matches, it tries `default`, then `en`.
- When the variable is not set, the UI falls back to pre-defined defaults for each language.

## Previewing changes

Because Vite only reads environment variables at startup, run:

```powershell
npm run dev
```

again after editing `.env` so the updated value is visible in the browser.
