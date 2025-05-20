
import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface LikertScaleProps {
  value: string;
  onChange: (value: string) => void;
  reversed?: boolean;
  questionId: string; // Added questionId prop for unique identification
}

const LikertScale: React.FC<LikertScaleProps> = ({ value, onChange, reversed = false, questionId }) => {
  // Always display labels in standard order (strongly disagree to strongly agree)
  const labels = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];
  
  // Always use values 1-5 for the radio buttons
  const values = ['1', '2', '3', '4', '5'];

  // Color classes based on the semantic meaning of the response
  const getColorClass = (index: number): string => {
    // For reversed questions, the meaning is flipped but the display stays the same
    if (reversed) {
      // Reversed questions: green (strongly disagree) to red (strongly agree)
      return [
        "text-green-600 group-hover:bg-green-50", 
        "text-emerald-600 group-hover:bg-emerald-50", 
        "text-gray-600 group-hover:bg-gray-50", 
        "text-orange-600 group-hover:bg-orange-50", 
        "text-red-600 group-hover:bg-red-50"
      ][index];
    } else {
      // Normal questions: red (strongly disagree) to green (strongly agree)
      return [
        "text-red-600 group-hover:bg-red-50", 
        "text-orange-600 group-hover:bg-orange-50", 
        "text-gray-600 group-hover:bg-gray-50", 
        "text-emerald-600 group-hover:bg-emerald-50", 
        "text-green-600 group-hover:bg-green-50"
      ][index];
    }
  };

  // Background color for selected item with semantic meaning
  const getSelectedBg = (index: number): string => {
    if (reversed) {
      // Reversed questions: green (strongly disagree) to red (strongly agree)
      return [
        "bg-green-100", 
        "bg-emerald-100", 
        "bg-gray-100", 
        "bg-orange-100", 
        "bg-red-100"
      ][index];
    } else {
      // Normal questions: red (strongly disagree) to green (strongly agree)
      return [
        "bg-red-100", 
        "bg-orange-100", 
        "bg-gray-100", 
        "bg-emerald-100", 
        "bg-green-100"
      ][index];
    }
  };

  return (
    <RadioGroup
      className="grid grid-cols-5 gap-2 mt-2"
      value={value}
      onValueChange={onChange}
    >
      {values.map((val, index) => {
        const isSelected = value === val;
        // Create unique ID using questionId and value
        const uniqueId = `likert-${questionId}-${val}`;
        
        return (
          <div 
            key={val} 
            className={cn(
              "group relative flex flex-col items-center rounded-md border border-muted p-2 transition-all",
              isSelected ? getSelectedBg(index) : "hover:bg-muted/30",
              isSelected ? "ring-1 ring-primary" : ""
            )}
          >
            <div className="mb-1">
              <RadioGroupItem
                value={val}
                id={uniqueId}
                className={cn(
                  "transition-all",
                  isSelected && "scale-125"
                )}
              />
            </div>
            <Label 
              htmlFor={uniqueId}
              className={cn(
                "text-xs text-center font-medium cursor-pointer transition-colors",
                getColorClass(index)
              )}
            >
              {labels[index]}
            </Label>
          </div>
        );
      })}
    </RadioGroup>
  );
};

export default LikertScale;
