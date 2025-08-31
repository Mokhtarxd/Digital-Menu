import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MapPin, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TableSelectionProps {
  onTableSelected: (tableNumber: string | null, orderType: 'dine-in' | 'takeout') => void;
}

export const TableSelection = ({ onTableSelected }: TableSelectionProps) => {
  const [orderType, setOrderType] = useState<'dine-in' | 'takeout'>('dine-in');
  const [tableNumber, setTableNumber] = useState('');
  const [detectedTable, setDetectedTable] = useState<string | null>(null);
  const { toast } = useToast();

  // Simulate QR code detection from URL
  useEffect(() => {
    const path = window.location.pathname;
    const tableMatch = path.match(/\/table\/(\d+)/);
    if (tableMatch) {
      const table = tableMatch[1];
      setDetectedTable(table);
      setTableNumber(table);
      toast({
        title: "Table Detected",
        description: `Welcome to Table ${table}!`,
      });
    }
  }, [toast]);

  const handleConfirm = () => {
    if (orderType === 'dine-in' && !tableNumber) {
      toast({
        title: "Table Required",
        description: "Please enter your table number for dine-in orders.",
        variant: "destructive",
      });
      return;
    }

    onTableSelected(
      orderType === 'dine-in' ? tableNumber : null,
      orderType
    );
  };

  return (
    <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Welcome to Our Restaurant
          </CardTitle>
          <p className="text-muted-foreground">Let's start your order</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base font-semibold">Order Type</Label>
            <RadioGroup
              value={orderType}
              onValueChange={(value) => setOrderType(value as 'dine-in' | 'takeout')}
              className="mt-2"
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="dine-in" id="dine-in" />
                <Label htmlFor="dine-in" className="flex items-center gap-2 cursor-pointer flex-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  Dine In
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="takeout" id="takeout" />
                <Label htmlFor="takeout" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Package className="h-4 w-4 text-primary" />
                  Takeout
                </Label>
              </div>
            </RadioGroup>
          </div>

          {orderType === 'dine-in' && (
            <div className="space-y-2">
              <Label htmlFor="table">Table Number</Label>
              <Input
                id="table"
                type="number"
                placeholder="Enter your table number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className={detectedTable ? 'border-success' : ''}
              />
              {detectedTable && (
                <p className="text-sm text-success flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Table {detectedTable} detected from QR code
                </p>
              )}
            </div>
          )}

          <Button 
            onClick={handleConfirm}
            className="w-full bg-gradient-primary hover:opacity-90 transition-smooth"
            size="lg"
          >
            Start Ordering
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};