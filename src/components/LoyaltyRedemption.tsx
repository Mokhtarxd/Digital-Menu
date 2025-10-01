import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, Minus, Plus } from 'lucide-react';
import { useLoyaltyPoints } from '@/hooks/useLoyaltyPoints';

interface LoyaltyRedemptionProps {
  totalAmount: number;
  onPointsRedemption: (pointsToUse: number, discountAmount: number) => void;
  isLoggedIn: boolean;
}

export const LoyaltyRedemption = ({ 
  totalAmount, 
  onPointsRedemption, 
  isLoggedIn 
}: LoyaltyRedemptionProps) => {
  const { points, loading } = useLoyaltyPoints();
  const [pointsToUse, setPointsToUse] = useState(0);
  const { t, i18n } = useTranslation();
  const direction = useMemo(
    () => i18n.dir(i18n.resolvedLanguage || i18n.language),
    [i18n.language, i18n.resolvedLanguage]
  );

  // Conversion rate: 1 MAD = 1 point, so 1 point = 1 MAD discount
  const pointsToMadRate = 1; // 1 point = 1 MAD
  const madToPointsRate = 1; // 1 MAD = 1 point

  const maxPointsUsable = useMemo(() => {
    const maxFromTotal = Math.floor(totalAmount * madToPointsRate);
    return Math.min(points, maxFromTotal);
  }, [points, totalAmount, madToPointsRate]);

  const discountAmount = useMemo(() => {
    return pointsToUse * pointsToMadRate;
  }, [pointsToUse, pointsToMadRate]);

  const handlePointsChange = (newPoints: number) => {
    const validPoints = Math.max(0, Math.min(newPoints, maxPointsUsable));
    setPointsToUse(validPoints);
    onPointsRedemption(validPoints, validPoints * pointsToMadRate);
  };

  const quickSelect = (percentage: number) => {
    const targetPoints = Math.floor(maxPointsUsable * percentage);
    handlePointsChange(targetPoints);
  };

  if (!isLoggedIn) {
    return (
      <Card className="border-orange-200 bg-orange-50" dir={direction}>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-sm text-orange-700">
            <Coins className="h-4 w-4" />
            <span>{t('loyalty.signInPrompt')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="border-orange-200 bg-orange-50" dir={direction}>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-sm text-orange-700">
            <Coins className="h-4 w-4 animate-spin" />
            <span>{t('loyalty.loading')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (points === 0) {
    return (
      <Card className="border-gray-200 bg-gray-50" dir={direction}>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Coins className="h-4 w-4" />
            <span>{t('loyalty.none')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50" dir={direction}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Coins className="h-4 w-4 text-orange-600" />
          {t('loyalty.use')}
          <Badge variant="secondary" className="ml-auto">
            {t('loyalty.available', { points })}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-orange-700">
          {t('loyalty.conversion', { value: pointsToMadRate, max: maxPointsUsable })}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="points-input" className="text-sm">
            {t('loyalty.pointsLabel')}
          </Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handlePointsChange(pointsToUse - 1)}
              disabled={pointsToUse <= 0}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Input
              id="points-input"
              type="number"
              min="0"
              max={maxPointsUsable}
              value={pointsToUse}
              onChange={(e) => handlePointsChange(parseInt(e.target.value) || 0)}
              className="text-center"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handlePointsChange(pointsToUse + 1)}
              disabled={pointsToUse >= maxPointsUsable}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {maxPointsUsable > 0 && (
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => quickSelect(0.25)}
              className="flex-1 text-xs"
            >
              {t('loyalty.quickSelect.quarter')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => quickSelect(0.5)}
              className="flex-1 text-xs"
            >
              {t('loyalty.quickSelect.half')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => quickSelect(1)}
              className="flex-1 text-xs"
            >
              {t('loyalty.quickSelect.max')}
            </Button>
          </div>
        )}

        {pointsToUse > 0 && (
          <div className="bg-white p-2 rounded border border-orange-200">
            <div className="flex justify-between text-sm">
              <span>{t('loyalty.summaryPoints')}</span>
              <span className="font-medium">{pointsToUse}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600 font-medium">
              <span>{t('loyalty.summaryDiscount')}</span>
              <span>{t('loyalty.discountValue', { amount: discountAmount.toFixed(2) })}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
