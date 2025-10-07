import axios from 'axios';

interface GoogleSheetsOrderItem {
  id: string;
  name: string;
  qty: number;
  price?: number;
}

export interface GoogleSheetsOrderPayload {
  orderType: string;
  tableNumber: string | null;
  items: GoogleSheetsOrderItem[];
  subtotal: number;
  loyaltyPointsUsed?: number;
  loyaltyDiscount?: number;
  total: number;
  contact_phone?: string | null;
  reservationId?: string;
  status: 'received' | 'cancelled';
  createdAt?: string;
}

export async function exportOrderToGoogleSheets(payload: GoogleSheetsOrderPayload): Promise<boolean> {
  const webhookUrl = import.meta.env.VITE_GOOGLE_SHEETS_WEBAPP_URL;

  if (!webhookUrl) {
    console.log('Google Sheets export skipped: VITE_GOOGLE_SHEETS_WEBAPP_URL is not set.');
    return false;
  }

  try {
    const body = {
      ...payload,
      createdAt: payload.createdAt ?? new Date().toISOString(),
    };

    const response = await axios.post(
      webhookUrl,
      JSON.stringify(body),
      {
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8',
        },
      }
    );

    console.log('🗒️ Google Sheets response', response.status, response.data);

    console.log('✅ Order exported to Google Sheets', response.status);
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    console.error('❌ Failed to export order to Google Sheets:', error);
    return false;
  }
}
