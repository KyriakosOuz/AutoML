
import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RateAppButtonProps extends ButtonProps {
  showText?: boolean;
  className?: string;
}

const RateAppButton: React.FC<RateAppButtonProps> = ({ 
  showText = true, 
  className,
  ...props
}) => {
  return (
    <Button 
      variant="outline" 
      size="sm"
      className={cn("flex items-center gap-1", className)} 
      {...props}
    >
      <Star className="h-4 w-4 text-amber-400" />
      {showText && <span>Rate App</span>}
    </Button>
  );
};

export default RateAppButton;
