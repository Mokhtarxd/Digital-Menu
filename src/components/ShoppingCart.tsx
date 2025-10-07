import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart as CartIcon, Plus, Minus, X, CheckCircle } from 'lucide-react';
import { MenuItem } from './MenuCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoyaltyRedemption } from './LoyaltyRedemption';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface CartItem extends MenuItem {
  quantity: number;
}

interface ShoppingCartProps {
  items: CartItem[];
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout: (contactPhone?: string, loyaltyPointsUsed?: number) => void;
  isOpen: boolean;
  onToggle: () => void;
  isLoggedIn?: boolean;
  loyaltyPoints?: number;
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
  loyaltyPoints = 0,
  extraFields,
  canProceed = true,
}: ShoppingCartProps) => {
  const { t, i18n } = useTranslation();
  const direction = useMemo(
    () => i18n.dir(i18n.resolvedLanguage || i18n.language),
    [i18n.language, i18n.resolvedLanguage]
  );
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState(false);
  const [loyaltyPointsUsed, setLoyaltyPointsUsed] = useState(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  
  const digitsCount = useMemo(() => (phone.replace(/\D/g, '').length), [phone]);
  const phoneValid = useMemo(() => digitsCount >= 8 && digitsCount <= 15, [digitsCount]);
  const finalTotal = useMemo(() => Math.max(0, totalPrice - loyaltyDiscount), [totalPrice, loyaltyDiscount]);

  const handleLoyaltyRedemption = (pointsToUse: number, discountAmount: number) => {
    setLoyaltyPointsUsed(pointsToUse);
    setLoyaltyDiscount(discountAmount);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onToggle}
          className="bg-gradient-primary hover:opacity-90 shadow-glow rounded-full p-3 sm:p-4"
          size="lg"
        >
          <CartIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground text-xs">
              {totalItems}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" dir={direction}>
      <div className="fixed bottom-0 left-0 right-0 top-0 sm:right-0 sm:left-auto w-full sm:max-w-md bg-background shadow-xl">
        <Card className="h-full flex flex-col border-0">
          <CardHeader className="bg-gradient-warm">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <CartIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                {t('cart.title', { count: totalItems })}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onToggle}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-auto p-3 sm:p-4 space-y-3 sm:space-y-4">{items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <CartIcon className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-sm sm:text-base">{t('cart.emptyTitle')}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('cart.emptySubtitle')}</p>
              </div>
            ) : (
              <>
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 sm:gap-3 bg-muted/50 p-2 sm:p-3 rounded-lg">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-md"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-xs sm:text-sm truncate">{item.name}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {t('cart.each', { price: item.price.toFixed(2) })}
                      </p>
                      {typeof item.stock === 'number' && (
                        <p
                          className={`text-[10px] sm:text-xs ${
                            item.quantity > item.stock ? 'text-destructive' : 'text-muted-foreground'
                          }`}
                        >
                          {t('cart.stockStatus', {
                            remaining: Math.max(item.stock - item.quantity, 0),
                          })}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                      >
                        <Minus className="h-2 w-2 sm:h-3 sm:w-3" />
                      </Button>
                      
                      <span className="font-semibold min-w-[16px] sm:min-w-[24px] text-center text-xs sm:text-sm">
                        {item.quantity}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={typeof item.stock === 'number' && item.quantity >= item.stock}
                        className="h-6 w-6 sm:h-8 sm:w-8 p-0 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-2 w-2 sm:h-3 sm:w-3" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(item.id)}
                        className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <X className="h-2 w-2 sm:h-3 sm:w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>{t('cart.subtotal')}</span>
                    <span>{totalPrice.toFixed(2)} MAD</span>
                  </div>
                  {loyaltyDiscount > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm text-green-600">
                      <span>{t('cart.loyaltyDiscount', { points: loyaltyPointsUsed })}</span>
                      <span>-{loyaltyDiscount.toFixed(2)} MAD</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base sm:text-lg">
                    <span>{t('cart.total')}</span>
                    <span className="bg-gradient-primary bg-clip-text text-transparent">
                      {finalTotal.toFixed(2)} MAD
                    </span>
                  </div>

                  {!canProceed && (
                    <Alert variant="destructive">
                      <AlertDescription className="text-xs sm:text-sm">
                        {t('cart.stockWarning')}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Loyalty Points Redemption */}
                  <LoyaltyRedemption
                    totalAmount={totalPrice}
                    onPointsRedemption={handleLoyaltyRedemption}
                    isLoggedIn={isLoggedIn}
                  />
                  
                  {extraFields && (
                    <div className="mt-3 sm:mt-4 space-y-2">
                      {extraFields}
                    </div>
                  )}
                  {items.length > 0 && (
                    <div className="mt-3 sm:mt-4 space-y-2">
                      <Label htmlFor="contact-phone" className="text-xs sm:text-sm">{t('cart.phoneLabel')}</Label>
                      <Input
                        id="contact-phone"
                        type="tel"
                        placeholder={t('cart.phonePlaceholder')}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onBlur={() => setTouched(true)}
                        className="text-sm"
                      />
                      {touched && phone && !phoneValid && (
                        <p className="text-xs text-destructive">{t('cart.phoneInvalid')}</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>

          {items.length > 0 && (
            <div className="p-3 sm:p-4 border-t">
              <Button 
                onClick={() => onCheckout(phone.trim() || undefined, loyaltyPointsUsed)}
                className="w-full bg-gradient-primary hover:opacity-90 transition-smooth text-sm sm:text-base"
                size="lg"
                disabled={!canProceed || (phone && !phoneValid)}
              >
                <CheckCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                {t('cart.checkout')}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};