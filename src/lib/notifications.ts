import axios from 'axios';

interface NotificationData {
  orderType: string;
  tableNumber: string | null;
  items: Array<{ id: string; name: string; qty: number; price?: number }>;
  subtotal: number;
  loyaltyPointsUsed?: number;
  loyaltyDiscount?: number;
  total: number;
  contact_phone?: string | null;
  reservationId?: string;
}

/**
 * Send notification to Telegram Bot (100% automatic, free)
 */
export async function sendTelegramNotification(message: string, isNewOrder: boolean = true): Promise<boolean> {
  const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;
  
  if (!botToken || !chatId) {
    console.log('Telegram not configured');
    return false;
  }

  try {
    const emoji = isNewOrder ? '🍽️' : '❌';
    const formattedMessage = `${emoji} *Dar Lmeknessiya*\n\n${message}`;
    
    const response = await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: formattedMessage,
      parse_mode: 'Markdown'
    });
    
    console.log('✅ Telegram message sent successfully');
    return response.data.ok;
  } catch (error) {
    console.error('❌ Failed to send Telegram message:', error);
    return false;
  }
}

/**
 * Send notification to Discord webhook (100% automatic, free)
 */
export async function sendDiscordNotification(message: string, isNewOrder: boolean = true): Promise<boolean> {
  const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK;
  
  if (!webhookUrl) {
    console.log('Discord not configured');
    return false;
  }

  try {
    const emoji = isNewOrder ? '🍽️' : '❌';
    const color = isNewOrder ? 0x00ff00 : 0xff0000; // Green for new, red for cancelled
    
    const response = await axios.post(webhookUrl, {
      embeds: [{
        title: `${emoji} ${isNewOrder ? 'New Order' : 'Order Cancelled'} - Dar Lmeknessiya`,
        description: message,
        color: color,
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Restaurant Digital Menu System'
        }
      }]
    });
    
    console.log('✅ Discord notification sent successfully');
    return response.status === 204;
  } catch (error) {
    console.error('❌ Failed to send Discord notification:', error);
    return false;
  }
}

/**
 * Send notification via email (using a free email service)
 */
export async function sendEmailNotification(message: string, isNewOrder: boolean = true): Promise<boolean> {
  const emailWebhook = import.meta.env.VITE_EMAIL_WEBHOOK;
  
  if (!emailWebhook) {
    console.log('Email not configured');
    return false;
  }

  try {
    const subject = isNewOrder ? 'New Order - Dar Lmeknessiya' : 'Order Cancelled - Dar Lmeknessiya';
    
    const response = await axios.post(emailWebhook, {
      to: import.meta.env.VITE_RESTAURANT_EMAIL || 'restaurant@example.com',
      subject: subject,
      body: message,
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Email notification sent successfully');
    return response.status === 200;
  } catch (error) {
    console.error('❌ Failed to send email notification:', error);
    return false;
  }
}

/**
 * Send notifications via multiple channels automatically
 */
export async function sendMultiChannelNotification(data: NotificationData, isNewOrder: boolean = true): Promise<void> {
  const emoji = isNewOrder ? '🍽️' : '❌';
  const title = isNewOrder ? 'NEW ORDER RECEIVED' : 'ORDER CANCELLED';
  
  let message = `${emoji} *${title}*\n\n`;
  message += `📍 *Type:* ${data.orderType === 'dine-in' ? 'Dine-in' : 'Takeout'}\n`;
  
  if (data.tableNumber) {
    message += `🪑 *Table:* ${data.tableNumber}\n`;
  }
  
  if (data.contact_phone) {
    message += `📞 *Contact:* ${data.contact_phone}\n`;
  }
  
  message += '\n*ITEMS:*\n';
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

  // Try all configured notification methods
  const notifications = [
    sendTelegramNotification(message, isNewOrder),
    sendDiscordNotification(message, isNewOrder),
    sendEmailNotification(message, isNewOrder)
  ];

  // Wait for all notifications to complete (don't block on failures)
  const results = await Promise.allSettled(notifications);
  
  const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
  console.log(`📢 Sent ${successCount}/${results.length} notifications successfully`);
}
