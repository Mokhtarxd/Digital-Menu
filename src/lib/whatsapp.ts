import axios from 'axios';

interface OrderItem {
  id: string;
  name: string;
  qty: number;
  price?: number;
}

interface WhatsAppOrderData {
  orderType: string;
  tableNumber: string | null;
  items: OrderItem[];
  subtotal: number;
  loyaltyPointsUsed?: number;
  loyaltyDiscount?: number;
  total: number;
  contact_phone?: string | null;
  reservationId?: string;
}

// WhatsApp Business API configuration
const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const WHATSAPP_PHONE_NUMBER_ID = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN;
const RESTAURANT_PHONE = import.meta.env.VITE_RESTAURANT_PHONE || '+212612345678'; // Your WhatsApp number

// Fallback to simple WhatsApp Web API if Business API is not configured
const USE_WHATSAPP_WEB = !WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN;

/**
 * Format order details for WhatsApp message
 */
function formatOrderMessage(data: WhatsAppOrderData, isNew: boolean = true): string {
  const emoji = isNew ? '🍽️' : '❌';
  const title = isNew ? 'NEW ORDER RECEIVED' : 'ORDER CANCELLED';
  
  let message = `${emoji} *${title}*\n\n`;
  
  // Order type and table
  message += `📍 *Type:* ${data.orderType === 'dine-in' ? 'Dine-in' : 'Takeout'}\n`;
  if (data.tableNumber) {
    message += `🪑 *Table:* ${data.tableNumber}\n`;
  }
  
  // Customer contact
  if (data.contact_phone) {
    message += `📞 *Contact:* ${data.contact_phone}\n`;
  }
  
  message += '\n*ITEMS:*\n';
  
  // List items
  data.items.forEach((item, index) => {
    message += `${index + 1}. ${item.name}`;
    if (item.qty > 1) {
      message += ` ×${item.qty}`;
    }
    if (item.price) {
      message += ` - ${(item.price * item.qty).toFixed(2)} MAD`;
    }
    message += '\n';
  });
  
  // Pricing
  message += `\n💰 *PRICING:*\n`;
  message += `Subtotal: ${data.subtotal.toFixed(2)} MAD\n`;
  
  if (data.loyaltyPointsUsed && data.loyaltyDiscount) {
    message += `Loyalty Discount (${data.loyaltyPointsUsed} pts): -${data.loyaltyDiscount.toFixed(2)} MAD\n`;
  }
  
  message += `*Total: ${data.total.toFixed(2)} MAD*\n`;
  
  if (data.reservationId) {
    message += `\n🆔 Order ID: ${data.reservationId.substring(0, 8)}\n`;
  }
  
  message += `\n⏰ ${new Date().toLocaleString('en-GB', { timeZone: 'Africa/Casablanca' })}`;
  
  return message;
}

/**
 * Send message via WhatsApp Business API
 */
async function sendBusinessAPIMessage(message: string): Promise<boolean> {
  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: RESTAURANT_PHONE.replace('+', ''),
        type: 'text',
        text: {
          body: message
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('WhatsApp message sent successfully:', response.data);
    return true;
  } catch (error) {
    console.error('Failed to send WhatsApp Business API message:', error);
    return false;
  }
}

/**
 * Send message via Webhook (simplest free solution)
 */
async function sendWebhookMessage(message: string, orderData: WhatsAppOrderData): Promise<boolean> {
  const webhookURL = import.meta.env.VITE_WEBHOOK_URL;
  
  if (!webhookURL) {
    console.log('📱 WhatsApp Message (Copy this text and send manually):');
    console.log('─'.repeat(60));
    console.log(message);
    console.log('─'.repeat(60));
    console.log(`📞 Send to: ${RESTAURANT_PHONE}`);
    console.log('🔗 WhatsApp Web URL:', `https://wa.me/${RESTAURANT_PHONE.replace('+', '')}?text=${encodeURIComponent(message)}`);
    return true;
  }

  try {
    const response = await axios.post(webhookURL, {
      message,
      orderData,
      timestamp: new Date().toISOString(),
      restaurant_phone: RESTAURANT_PHONE,
      whatsapp_url: `https://wa.me/${RESTAURANT_PHONE.replace('+', '')}?text=${encodeURIComponent(message)}`
    });
    
    console.log('✅ Webhook sent successfully:', response.status);
    console.log('📱 Message preview:', message);
    return true;
  } catch (error) {
    console.error('❌ Webhook failed, falling back to console:', error);
    // Fallback to console log
    console.log('📱 WhatsApp Message:');
    console.log(message);
    return false;
  }
}

/**
 * Send order notification via WhatsApp
 */
export async function sendOrderNotification(orderData: WhatsAppOrderData): Promise<boolean> {
  try {
    const message = formatOrderMessage(orderData, true);
    
    if (USE_WHATSAPP_WEB) {
      return await sendWebhookMessage(message, orderData);
    } else {
      return await sendBusinessAPIMessage(message);
    }
  } catch (error) {
    console.error('Error sending order notification:', error);
    return false;
  }
}

/**
 * Send cancellation notification via WhatsApp
 */
export async function sendCancellationNotification(orderData: WhatsAppOrderData): Promise<boolean> {
  try {
    const message = formatOrderMessage(orderData, false);
    
    if (USE_WHATSAPP_WEB) {
      return await sendWebhookMessage(message, orderData);
    } else {
      return await sendBusinessAPIMessage(message);
    }
  } catch (error) {
    console.error('Error sending cancellation notification:', error);
    return false;
  }
}

/**
 * Test function to verify WhatsApp integration
 */
export async function testWhatsAppIntegration(): Promise<boolean> {
  const testData: WhatsAppOrderData = {
    orderType: 'dine-in',
    tableNumber: 'T5',
    items: [
      { id: '1', name: 'Margherita Pizza', qty: 2 },
      { id: '2', name: 'Caesar Salad', qty: 1 }
    ],
    subtotal: 45.00,
    total: 45.00,
    contact_phone: '+212612345678',
    reservationId: 'test-123'
  };
  
  console.log('Testing WhatsApp integration...');
  return await sendOrderNotification(testData);
}
