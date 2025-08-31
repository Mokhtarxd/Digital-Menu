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
    <Card className="overflow-hidden shadow-card hover:shadow-glow transition-all duration-300 hover:scale-[1.02]">
      <div className="relative">
        <img 
          src={item.image} 
          alt={item.name}
          className="w-full h-48 object-cover"
        />
        <Badge 
          variant={item.available ? "default" : "destructive"}
          className="absolute top-2 right-2"
        >
          {item.available ? "Available" : "Out of Stock"}
        </Badge>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg text-foreground">{item.name}</h3>
          <p className="text-muted-foreground text-sm line-clamp-2">{item.description}</p>
          
          <div className="flex items-center justify-between pt-2">
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {item.price.toFixed(2)} MAD
            </span>
            
            {item.available && (
              <div className="flex items-center gap-2">
                {quantity > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveFromCart}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="font-semibold min-w-[20px] text-center">{quantity}</span>
                  </>
                )}
                
                <Button
                  onClick={handleAddToCart}
                  size="sm"
                  className="bg-gradient-primary hover:opacity-90 transition-smooth"
                >
                  <Plus className="h-4 w-4" />
                  {quantity === 0 && <span className="ml-1">Add</span>}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};