import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { sendTelegramNotification, sendDiscordNotification } from '@/lib/notifications';
import { testWhatsAppIntegration } from '@/lib/whatsapp';
import { useToast } from '@/hooks/use-toast';

export const NotificationSetup = () => {
  const { toast } = useToast();
  const [telegramBot, setTelegramBot] = useState('');
  const [telegramChat, setTelegramChat] = useState('');
  const [discordWebhook, setDiscordWebhook] = useState('');
  const [testing, setTesting] = useState(false);

  const testTelegram = async () => {
    if (!telegramBot || !telegramChat) {
      toast({
        title: "Missing Configuration",
        description: "Please enter both bot token and chat ID",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    
    // Temporarily set env vars for testing
    const originalBot = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const originalChat = import.meta.env.VITE_TELEGRAM_CHAT_ID;
    
    (import.meta.env as any).VITE_TELEGRAM_BOT_TOKEN = telegramBot;
    (import.meta.env as any).VITE_TELEGRAM_CHAT_ID = telegramChat;
    
    const success = await sendTelegramNotification(
      "🧪 Test notification from Dar Lmeknessiya!\n\nIf you received this, your Telegram integration is working perfectly! 🎉",
      true
    );
    
    // Restore original env vars
    (import.meta.env as any).VITE_TELEGRAM_BOT_TOKEN = originalBot;
    (import.meta.env as any).VITE_TELEGRAM_CHAT_ID = originalChat;
    
    setTesting(false);
    
    if (success) {
      toast({
        title: "Telegram Test Successful! ✅",
        description: "Check your Telegram for the test message. Your automatic notifications are ready!",
      });
    } else {
      toast({
        title: "Telegram Test Failed ❌",
        description: "Please check your bot token and chat ID.",
        variant: "destructive",
      });
    }
  };

  const testDiscord = async () => {
    if (!discordWebhook) {
      toast({
        title: "Missing Webhook URL",
        description: "Please enter your Discord webhook URL",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    
    const originalWebhook = import.meta.env.VITE_DISCORD_WEBHOOK;
    (import.meta.env as any).VITE_DISCORD_WEBHOOK = discordWebhook;
    
    const success = await sendDiscordNotification(
      "🧪 **Test notification from Dar Lmeknessiya!**\n\nIf you received this, your Discord integration is working perfectly! 🎉",
      true
    );
    
    (import.meta.env as any).VITE_DISCORD_WEBHOOK = originalWebhook;
    
    setTesting(false);
    
    if (success) {
      toast({
        title: "Discord Test Successful! ✅",
        description: "Check your Discord channel for the test message. Your automatic notifications are ready!",
      });
    } else {
      toast({
        title: "Discord Test Failed ❌",
        description: "Please check your webhook URL.",
        variant: "destructive",
      });
    }
  };

  const testWhatsApp = async () => {
    setTesting(true);
    const success = await testWhatsAppIntegration();
    setTesting(false);
    
    toast({
      title: success ? "WhatsApp Test Started! 📱" : "WhatsApp Test Failed ❌",
      description: success 
        ? "WhatsApp should open automatically with a test message. Just click Send!"
        : "Check the console for error details.",
      variant: success ? "default" : "destructive",
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">🔔 Automatic Notification Setup</h1>
        <p className="text-muted-foreground">
          Choose how you want to receive order notifications automatically
        </p>
      </div>

      <Tabs defaultValue="telegram" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="telegram">
            📱 Telegram <Badge variant="secondary" className="ml-1">Recommended</Badge>
          </TabsTrigger>
          <TabsTrigger value="discord">💬 Discord</TabsTrigger>
          <TabsTrigger value="whatsapp">📞 WhatsApp</TabsTrigger>
        </TabsList>

        <TabsContent value="telegram" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📱 Telegram Bot Setup (FREE & INSTANT)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Get instant order notifications in Telegram - 100% automatic, no limits!
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="telegram-bot">Bot Token</Label>
                <Input
                  id="telegram-bot"
                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  value={telegramBot}
                  onChange={(e) => setTelegramBot(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  1. Message @BotFather on Telegram → /newbot → follow instructions
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telegram-chat">Chat ID</Label>
                <Input
                  id="telegram-chat"
                  placeholder="123456789"
                  value={telegramChat}
                  onChange={(e) => setTelegramChat(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  2. Message @userinfobot on Telegram to get your Chat ID
                </p>
              </div>
              
              <Button 
                onClick={testTelegram} 
                disabled={testing || !telegramBot || !telegramChat}
                className="w-full"
              >
                {testing ? 'Testing...' : 'Test Telegram Integration'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discord" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>💬 Discord Webhook Setup (FREE & INSTANT)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Get order notifications in your Discord server - unlimited and free!
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="discord-webhook">Webhook URL</Label>
                <Input
                  id="discord-webhook"
                  placeholder="https://discord.com/api/webhooks/123456789/abc-xyz123"
                  value={discordWebhook}
                  onChange={(e) => setDiscordWebhook(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  1. Go to your Discord server → Channel Settings → Integrations → Create Webhook
                </p>
              </div>
              
              <Button 
                onClick={testDiscord} 
                disabled={testing || !discordWebhook}
                className="w-full"
              >
                {testing ? 'Testing...' : 'Test Discord Integration'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📞 WhatsApp Integration (SEMI-AUTOMATIC)</CardTitle>
              <p className="text-sm text-muted-foreground">
                WhatsApp opens automatically with pre-filled messages - just click Send!
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Current setup:</strong> When orders come in, WhatsApp will automatically open 
                  in a new tab with the complete order message already typed. You just need to click "Send"!
                </p>
              </div>
              
              <Button onClick={testWhatsApp} disabled={testing} className="w-full">
                {testing ? 'Testing...' : 'Test WhatsApp Integration'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-center p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Pro Tip:</strong> You can use multiple notification methods at the same time! 
          Set up Telegram for instant notifications and WhatsApp as backup.
        </p>
      </div>
    </div>
  );
};
