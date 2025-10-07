# Google Sheets Export (Free)

Follow these steps to append every order to a Google Sheet without any paid service:

1. **Create the Google Sheet**
   - In Google Drive create a Spreadsheet (e.g. `Restaurant Orders`).
   - Add a header row (Date, Status, Order Type, Table, Contact, Subtotal, Discount, Total, Loyalty Points, Items, Reservation ID, Raw JSON).

2. **Create an Apps Script Web App**
   - In the sheet open **Extensions → Apps Script**.
   - Replace the default code with the script below and save.

```javascript
const SHEET_NAME = 'Sheet1';

function doPost(e) {
   if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(
         JSON.stringify({ ok: false, error: 'Missing body' })
      )
         .setMimeType(ContentService.MimeType.JSON)
         .setHeader('Access-Control-Allow-Origin', '*')
         .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
         .setHeader('Access-Control-Allow-Headers', 'Content-Type');
   }

   const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);

   if (!sheet) {
      throw new Error(`Sheet "${SHEET_NAME}" not found. Create it or update SHEET_NAME.`);
   }

   const body = JSON.parse(e.postData.contents);

  const itemsText = (body.items || [])
    .map(item => `${item.qty}× ${item.name}${item.price ? ` (${item.price})` : ''}`)
    .join(', ');

  sheet.appendRow([
    body.createdAt || new Date().toISOString(),
    body.status || 'received',
    body.orderType || '',
    body.tableNumber || '',
    body.contact_phone || '',
    body.subtotal || 0,
    body.loyaltyDiscount || 0,
    body.total || 0,
    body.loyaltyPointsUsed || 0,
    itemsText,
    body.reservationId || '',
    JSON.stringify(body)
  ]);

   return ContentService.createTextOutput(
      JSON.stringify({ ok: true })
   )
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
```

3. **Deploy the Web App**
   - Click **Deploy → Test deployments → Select type → Web app**.
   - Choose *Execute as*: **Me**, and *Who has access*: **Anyone**.
   - Deploy and copy the Web App URL.
   - Anytime you change the script, redeploy a **new version** so the web app picks up your updates.

## Troubleshooting

- **No rows appear but the frontend shows “✅ Order exported”**
   1. In Apps Script open **Executions** to confirm the web app is receiving requests and check for thrown errors (for example, a missing sheet name).
   2. Make sure the sheet tab name matches `SHEET_NAME` exactly or update the constant accordingly.
   3. After editing the script, redeploy a new version; otherwise, the published `/exec` URL keeps the old code.
   4. Use the logged response (`🗒️ Google Sheets response …`) in your browser console to see the HTTP status and body returned by the script.

4. **Configure the Frontend**
   - Add the URL to your `.env` (or environment settings) as:

```
VITE_GOOGLE_SHEETS_WEBAPP_URL="https://script.google.com/macros/s/.../exec"
```

   - Restart the dev server so Vite picks up the new variable.

When `VITE_GOOGLE_SHEETS_WEBAPP_URL` is set, every new order or cancellation will POST a JSON payload to the Apps Script, which appends an entry to your sheet.
