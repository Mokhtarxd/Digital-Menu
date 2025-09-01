import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart as CartIcon, Plus, Minus, X, CheckCircle } from 'lucide-react';
import { MenuItem } from './MenuCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface CartItem extends MenuItem {
  quantity: number;
}

interface ShoppingCartProps {
  items: CartItem[];
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout: (contactPhone?: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  isLoggedIn?: boolean;
  extraFields?: React.ReactNode;
  canProceed?: boolean;
}

export const ShoppingCart = ({ 
  items, 
  onUpdateQuantity, 
  onRemoveItem, 
  onCheckout,
  isOpen,
  onToggle,
  isLoggedIn = false,
  extraFields,
  canProceed = true,
}: ShoppingCartProps) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState(false);
  const digitsCount = useMemo(() => (phone.replace(/\D/g, '').length), [phone]);
  const phoneValid = useMemo(() => digitsCount >= 8 && digitsCount <= 15, [digitsCount]);

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onToggle}
          className="bg-gradient-primary hover:opacity-90 shadow-glow rounded-full p-4"
          size="lg"
        >
          <CartIcon className="h-6 w-6" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground">
              {totalItems}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed bottom-0 right-0 top-0 w-full max-w-md bg-background shadow-xl">
        <Card className="h-full flex flex-col border-0">
          <CardHeader className="bg-gradient-warm">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CartIcon className="h-5 w-5" />
                Your Order ({totalItems} items)
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onToggle}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-auto p-4 space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <CartIcon className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Your cart is empty</p>
                <p className="text-sm text-muted-foreground">Add some delicious items to get started!</p>
              </div>
            ) : (
              <>
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.price.toFixed(2)} MAD each
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <span className="font-semibold min-w-[24px] text-center">
                        {item.quantity}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(item.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{totalPrice.toFixed(2)} MAD</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="bg-gradient-primary bg-clip-text text-transparent">
                      {totalPrice.toFixed(2)} MAD
                    </span>
                  </div>
                  {extraFields && (
                    <div className="mt-4 space-y-2">
                      {extraFields}
                    </div>
                  )}
                  {!isLoggedIn && items.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="contact-phone">Phone number (required)</Label>
                      <Input
                        id="contact-phone"
                        type="tel"
                        placeholder="e.g., +212 6 12 34 56 78"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onBlur={() => setTouched(true)}
                      />
                      {touched && !phoneValid && (
                        <p className="text-xs text-destructive">Please enter a valid phone number (8–15 digits).</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>

          {items.length > 0 && (
            <div className="p-4 border-t">
              <Button 
                onClick={() => onCheckout(isLoggedIn ? undefined : phone.trim())}
                className="w-full bg-gradient-primary hover:opacity-90 transition-smooth"
                size="lg"
                disabled={(!isLoggedIn && !phoneValid) || !canProceed}
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                Proceed to Checkout
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};