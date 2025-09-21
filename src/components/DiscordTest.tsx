import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { sendDiscordNotification } from '@/lib/notifications';
import { useToast } from '@/hooks/use-toast';

export const DiscordTest = () => {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);

  const testDiscordWebhook = async () => {
    setTesting(true);
    
    try {
      const testMessage = `🧪 **Test Order Notification - Dar Lmeknessiya**

📍 **Type:** Dine-in  
🪑 **Table:** T5
📞 **Contact:** +212646412087

**ITEMS:**
1. Margherita Pizza ×2 - 60.00 MAD
2. Caesar Salad ×1 - 25.00 MAD

💰 **PRICING:**
Subtotal: 85.00 MAD
**Total: 85.00 MAD**

🆔 Order ID: test-123
⏰ ${new Date().toLocaleString('en-GB', { timeZone: 'Africa/Casablanca' })}

✅ **Discord integration is working perfectly!**`;

      const success = await sendDiscordNotification(testMessage, true);
      
      if (success) {
        toast({
          title: "Discord Test Successful! 🎉",
          description: "Check your Discord channel - you should see a test order notification with professional formatting!",
        });
      } else {
        toast({
          title: "Discord Test Failed ❌",
          description: "Please check your webhook URL in the .env file.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Discord test error:', error);
      toast({
        title: "Discord Test Error ❌",
        description: "Something went wrong. Check the console for details.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>💬 Discord Integration Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This will send a test order notification to your Discord channel to verify 
          the automatic integration is working correctly.
        </p>
        
        <Button 
          onClick={testDiscordWebhook} 
          disabled={testing}
          className="w-full"
        >
          {testing ? 'Sending Test Message...' : 'Test Discord Webhook'}
        </Button>
        
        <div className="bg-muted p-3 rounded-lg text-sm">
          <p><strong>What to expect:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Professional embedded message in Discord</li>
            <li>Green color indicator (new order)</li>
            <li>Complete order details formatted nicely</li>
            <li>Restaurant branding and timestamp</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
