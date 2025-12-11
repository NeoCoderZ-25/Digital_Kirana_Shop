import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const banners = [
  {
    id: 1,
    title: 'Grocery Sale',
    subtitle: 'Up to 30% off on daily essentials',
    bgClass: 'flipkart-gradient',
  },
  {
    id: 2,
    title: 'Fresh Deals',
    subtitle: 'Premium quality at best prices',
    bgClass: 'amazon-gradient',
  },
  {
    id: 3,
    title: 'Free Delivery',
    subtitle: 'On orders above ₹499',
    bgClass: 'bg-success',
  },
];

export const DealBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((banner) => (
          <div
            key={banner.id}
            className={cn(
              'min-w-full px-6 py-8 text-white',
              banner.bgClass
            )}
          >
            <h3 className="text-2xl font-display font-bold mb-1">{banner.title}</h3>
            <p className="text-sm opacity-90">{banner.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={goToPrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-background/20 hover:bg-background/40 transition-colors"
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-background/20 hover:bg-background/40 transition-colors"
      >
        <ChevronRight className="w-5 h-5 text-white" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              index === currentIndex ? 'bg-white w-4' : 'bg-white/50'
            )}
          />
        ))}
      </div>
    </div>
  );
};
