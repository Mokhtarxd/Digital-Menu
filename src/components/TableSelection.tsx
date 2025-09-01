import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TableSelectionProps {
  onTableSelected: (tableNumber: string | null, orderType: 'dine-in' | 'takeout') => void;
}

export const TableSelection = ({ onTableSelected }: TableSelectionProps) => {
  const [orderType, setOrderType] = useState<'dine-in' | 'takeout'>('dine-in');
  const [tableNumber, setTableNumber] = useState('');
  const [detectedTable, setDetectedTable] = useState<string | null>(null);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [tableOptions, setTableOptions] = useState<{ label: string }[]>([]);
  type TableRow = { label: string; is_available: boolean | null };
  const { toast } = useToast();

  // QR code detection from URL path: supports /table/3 or /table/T3
  useEffect(() => {
    const path = window.location.pathname;
    const tableMatch = path.match(/\/table\/([A-Za-z0-9-]+)/i);
    if (tableMatch) {
      const raw = tableMatch[1];
      const numericForMsg = raw.replace(/^T/i, '');
      setDetectedTable(numericForMsg);
      setTableNumber(raw);
      toast({
        title: "Table Detected",
        description: `Welcome to Table ${numericForMsg}!`,
      });
    }
  }, [toast]);

  // Load available table labels from Supabase
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoadingTables(true);
      try {
        const { data, error } = await supabase
          .from('tables')
          .select('label, is_available')
          .order('label', { ascending: true });
        if (!mounted) return;
        if (error) {
          return;
        }
        const opts = (data as TableRow[] | null || [])
          .filter((t) => t.is_available !== false)
          .map((t) => ({ label: String(t.label) }));
        setTableOptions(opts);
        // If QR detected, align the selection to an exact label and auto-continue
        if (detectedTable) {
          const match = opts.find(o => o.label === detectedTable || o.label === `T${detectedTable}`)?.label || tableNumber;
          if (match) setTableNumber(match);
          if (!autoSubmitted && match) {
            setOrderType('dine-in');
            onTableSelected(match, 'dine-in');
            setAutoSubmitted(true);
          }
        }
      } finally {
        if (mounted) setLoadingTables(false);
      }
    };
    load();
    return () => { mounted = false };
  }, [detectedTable, autoSubmitted, onTableSelected, tableNumber]);

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
              <Label>Table</Label>
              <Select
                value={tableNumber}
                onValueChange={(val) => setTableNumber(val)}
                disabled={loadingTables}
              >
                <SelectTrigger className={detectedTable ? 'border-success' : ''}>
                  <SelectValue placeholder={loadingTables ? 'Loading tables…' : 'Select your table'} />
                </SelectTrigger>
                <SelectContent>
                  {tableOptions.map((t) => (
                    <SelectItem key={t.label} value={t.label}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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