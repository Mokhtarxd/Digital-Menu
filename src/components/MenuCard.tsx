import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus } from 'lucide-react';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  is_hidden?: boolean;
  loyalty_points?: number | null;
  wait_time?: number | null;
}

interface MenuCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, quantity: number) => void;
  cartQuantity?: number;
}

export const MenuCard = ({ item, onAddToCart, cartQuantity = 0 }: MenuCardProps) => {
  const [quantity, setQuantity] = useState(cartQuantity);

  const handleAddToCart = () => {
    const newQuantity = quantity + 1;
    setQuantity(newQuantity);
    onAddToCart(item, 1);
  };

  const handleRemoveFromCart = () => {
    if (quantity > 0) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      onAddToCart(item, -1);
    }
  };

  return (
    <Card className={`overflow-hidden shadow-card hover:shadow-glow transition-all duration-300 hover:scale-[1.02] ${!item.available ? 'opacity-60 grayscale' : ''}`}>
      <div className="relative">
        <img 
          src={item.image} 
          alt={item.name}
          className={`w-full h-28 sm:h-36 object-cover ${!item.available ? 'grayscale' : ''}`}
        />
        <Badge 
          variant={item.available ? "default" : "destructive"}
          className="absolute top-1 sm:top-2 right-1 sm:right-2 text-xs"
        >
          {item.available ? "Available" : "Out of Stock"}
        </Badge>
        {!item.available && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <span className="text-white text-sm sm:text-lg font-bold bg-red-600 px-2 sm:px-3 py-1 rounded-md">
              OUT OF STOCK
            </span>
          </div>
        )}
      </div>
      
      <CardContent className="p-2 sm:p-3">
        <div className="space-y-1">
          <h3 className={`font-semibold text-xs sm:text-sm ${item.available ? 'text-foreground' : 'text-muted-foreground'}`}>
            {item.name}
          </h3>
          <p className="text-muted-foreground text-xs line-clamp-1 hidden sm:block">{item.description}</p>
          
          <div className="flex items-center justify-between pt-1">
            <div className="flex flex-col">
              <span className={`text-sm sm:text-base font-bold ${item.available ? 'bg-gradient-primary bg-clip-text text-transparent' : 'text-muted-foreground'}`}>
                {item.price.toFixed(2)} MAD
              </span>
              {item.available && (
                <span className="text-xs text-gray-500 hidden sm:block">
                  {item.loyalty_points !== null && item.loyalty_points !== undefined 
                    ? item.loyalty_points 
                    : Math.floor(item.price / 10)
                  } fidelity points
                </span>
              )}
            </div>
            
            {item.available ? (
              <div className="flex items-center gap-1">
                {quantity > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveFromCart}
                      className="h-6 w-6 sm:h-7 sm:w-7 p-0 rounded-full border-2 hover:bg-accent hover:text-accent-foreground transition-all duration-300"
                    >
                      <Minus className="h-2 w-2 sm:h-3 sm:w-3" />
                    </Button>
                    <span className="font-bold min-w-[16px] sm:min-w-[20px] text-center text-xs sm:text-sm bg-accent rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1">{quantity}</span>
                  </>
                )}
                
                <Button
                  onClick={handleAddToCart}
                  size="sm"
                  className="h-6 sm:h-7 px-2 sm:px-3 text-xs rounded-full bg-gradient-primary hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                >
                  <Plus className="h-2 w-2 sm:h-3 sm:w-3" />
                  {quantity === 0 && <span className="ml-1 font-semibold hidden sm:inline">Add</span>}
                </Button>
              </div>
            ) : (
              <Button
                disabled
                size="sm"
                className="h-6 sm:h-7 px-2 sm:px-3 text-xs rounded-full bg-muted text-muted-foreground cursor-not-allowed"
              >
                <span className="hidden sm:inline">Unavailable</span>
                <span className="sm:hidden">N/A</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};