import { useState } from 'react';
import { SlidersHorizontal, X, Star, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
}

export interface FilterState {
  category: string | null;
  priceRange: [number, number];
  rating: number | null;
  sortBy: 'popularity' | 'price-low' | 'price-high' | 'newest';
}

interface SearchFiltersProps {
  categories: Category[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  maxPrice?: number;
}

export const SearchFilters = ({ 
  categories, 
  filters, 
  onFiltersChange,
  maxPrice = 10000 
}: SearchFiltersProps) => {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  const activeFiltersCount = [
    filters.category,
    filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice,
    filters.rating,
    filters.sortBy !== 'popularity'
  ].filter(Boolean).length;

  const handleApply = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const handleClearAll = () => {
    const cleared: FilterState = {
      category: null,
      priceRange: [0, maxPrice],
      rating: null,
      sortBy: 'popularity'
    };
    setLocalFilters(cleared);
    onFiltersChange(cleared);
  };

  const ratingOptions = [
    { value: 4, label: '4★ & above' },
    { value: 3, label: '3★ & above' },
    { value: 2, label: '2★ & above' },
    { value: null, label: 'All ratings' }
  ];

  const sortOptions = [
    { value: 'popularity', label: 'Popularity' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest First' }
  ];

  return (
    <div className="flex items-center gap-2">
      {/* Sort Dropdown */}
      <Select 
        value={filters.sortBy} 
        onValueChange={(value) => onFiltersChange({ ...filters, sortBy: value as FilterState['sortBy'] })}
      >
        <SelectTrigger className="w-[140px] h-9 text-xs bg-card">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map(opt => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Filter Button */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-2 relative">
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader className="pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-bold">Filters</SheetTitle>
              <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-primary">
                Clear All
              </Button>
            </div>
          </SheetHeader>

          <div className="py-6 space-y-8 overflow-y-auto max-h-[calc(85vh-180px)]">
            {/* Category Filter */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Category</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setLocalFilters({ ...localFilters, category: null })}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-all',
                    !localFilters.category 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  )}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setLocalFilters({ ...localFilters, category: cat.id })}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-medium transition-all',
                      localFilters.category === cat.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Price Range</Label>
              <div className="px-2">
                <Slider
                  value={localFilters.priceRange}
                  onValueChange={(value) => setLocalFilters({ ...localFilters, priceRange: value as [number, number] })}
                  max={maxPrice}
                  step={50}
                  className="mb-4"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">₹{localFilters.priceRange[0]}</span>
                  <span className="font-medium text-foreground">₹{localFilters.priceRange[1]}</span>
                </div>
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Customer Rating</Label>
              <RadioGroup
                value={localFilters.rating?.toString() || 'all'}
                onValueChange={(value) => setLocalFilters({ 
                  ...localFilters, 
                  rating: value === 'all' ? null : parseInt(value) 
                })}
                className="space-y-2"
              >
                {ratingOptions.map(opt => (
                  <div
                    key={opt.value ?? 'all'}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer',
                      (localFilters.rating === opt.value || (!localFilters.rating && opt.value === null))
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                    onClick={() => setLocalFilters({ ...localFilters, rating: opt.value })}
                  >
                    <RadioGroupItem value={opt.value?.toString() || 'all'} />
                    <div className="flex items-center gap-1">
                      {opt.value && [...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'w-4 h-4',
                            i < opt.value! ? 'fill-accent text-accent' : 'text-muted'
                          )}
                        />
                      ))}
                      <span className="ml-2 text-sm">{opt.label}</span>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Sort By */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Sort By</Label>
              <RadioGroup
                value={localFilters.sortBy}
                onValueChange={(value) => setLocalFilters({ ...localFilters, sortBy: value as FilterState['sortBy'] })}
                className="space-y-2"
              >
                {sortOptions.map(opt => (
                  <div
                    key={opt.value}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer',
                      localFilters.sortBy === opt.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                    onClick={() => setLocalFilters({ ...localFilters, sortBy: opt.value as FilterState['sortBy'] })}
                  >
                    <RadioGroupItem value={opt.value} />
                    <span className="text-sm">{opt.label}</span>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          <SheetFooter className="pt-4 border-t border-border">
            <Button onClick={handleApply} className="w-full h-12 text-base font-semibold">
              Apply Filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Active Filter Pills */}
      {activeFiltersCount > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {filters.category && (
            <Badge variant="secondary" className="gap-1 shrink-0">
              {categories.find(c => c.id === filters.category)?.name}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onFiltersChange({ ...filters, category: null })}
              />
            </Badge>
          )}
          {filters.rating && (
            <Badge variant="secondary" className="gap-1 shrink-0">
              {filters.rating}★+
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onFiltersChange({ ...filters, rating: null })}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};