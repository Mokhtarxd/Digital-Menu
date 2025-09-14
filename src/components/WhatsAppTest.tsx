import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { testWhatsAppIntegration } from '@/lib/whatsapp';
import { useToast } from '@/hooks/use-toast';

export const WhatsAppTest = () => {
  const { toast } = useToast();

  const handleTest = async () => {
    const success = await testWhatsAppIntegration();
    
    if (success) {
      toast({
        title: "WhatsApp Test Successful!",
        description: "Check the console for the WhatsApp message URL and format.",
      });
    } else {
      toast({
        title: "WhatsApp Test Failed",
        description: "Check the console for error details.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>WhatsApp Integration Test</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleTest} className="w-full">
          Test WhatsApp Notification
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          This will generate a test order notification and show how the WhatsApp integration works.
          Check the browser console for the WhatsApp URL.
        </p>
      </CardContent>
    </Card>
  );
};
