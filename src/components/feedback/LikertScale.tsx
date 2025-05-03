
import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface LikertScaleProps {
  value: string;
  onChange: (value: string) => void;
  reversed?: boolean;
}

const LikertScale: React.FC<LikertScaleProps> = ({ value, onChange, reversed = false }) => {
  const labels = reversed 
    ? ['Strongly agree', 'Agree', 'Neutral', 'Disagree', 'Strongly disagree']
    : ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];
  
  const values = reversed 
    ? ['5', '4', '3', '2', '1'] 
    : ['1', '2', '3', '4', '5'];

  return (
    <RadioGroup
      className="flex justify-between mt-2"
      value={value}
      onValueChange={onChange}
    >
      {values.map((val, index) => (
        <div key={val} className="flex flex-col items-center">
          <RadioGroupItem
            value={val}
            id={`likert-${val}`}
            className={cn(
              "transition-all",
              value === val && "scale-125"
            )}
          />
          <Label 
            htmlFor={`likert-${val}`}
            className="mt-1 text-xs text-gray-600"
          >
            {labels[index]}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
};

export default LikertScale;
