import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useTranslation } from 'react-i18next';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryFilter = ({ 
  categories, 
  selectedCategory, 
  onCategoryChange 
}: CategoryFilterProps) => {
  const { t } = useTranslation();
  return (
    <div className="sticky top-0 z-40 px-3 sm:px-4 py-2 sm:py-3">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => onCategoryChange('all')}
            className={selectedCategory === 'all' 
              ? 'rounded-full px-4 sm:px-6 py-2 border-2 bg-background text-primary font-semibold text-xs sm:text-sm' 
              : 'rounded-full px-4 sm:px-6 py-2 border-2 hover:bg-gray-100 hover:text-gray-700 font-medium transition-all duration-300 text-xs sm:text-sm'
            }
          >
            {t('categoryFilter.all')}
          </Button>
          
          {categories.map((category) => (
            <Button
              key={category}
              variant="outline"
              onClick={() => onCategoryChange(category)}
              className={selectedCategory === category 
                ? 'rounded-full px-4 sm:px-6 py-2 border-2 bg-background text-primary font-semibold text-xs sm:text-sm' 
                : 'rounded-full px-4 sm:px-6 py-2 border-2 hover:bg-gray-100 hover:text-gray-700 font-medium transition-all duration-300 text-xs sm:text-sm'
              }
            >
              {category}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};