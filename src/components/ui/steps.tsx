
import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface StepProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  status?: 'pending' | 'current' | 'complete';
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

export interface StepsProps {
  active: number;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  children: React.ReactNode;
  onStepClick?: (index: number) => void;
}

export const Step = ({
  title,
  description,
  icon,
  status = 'pending',
  className,
  children,
  onClick,
}: StepProps) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center transition-all duration-200',
        onClick && status !== 'pending' && 'cursor-pointer hover:opacity-80',
        className
      )}
      onClick={onClick && status !== 'pending' ? onClick : undefined}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-full w-10 h-10 border-2 transition-colors',
          status === 'complete' ? 'bg-primary border-primary text-white' :
          status === 'current' ? 'border-primary text-primary' :
          'border-gray-300 text-gray-400'
        )}
      >
        {status === 'complete' ? (
          <Check className="h-5 w-5" />
        ) : icon || (
          <span className="font-medium">{title[0]}</span>
        )}
      </div>
      <div className="mt-2">
        <h4
          className={cn(
            'font-medium text-sm',
            status === 'complete' ? 'text-primary' :
            status === 'current' ? 'text-primary' :
            'text-gray-500'
          )}
        >
          {title}
        </h4>
        {description && (
          <p className={cn(
            'text-xs',
            status === 'complete' ? 'text-gray-600' :
            status === 'current' ? 'text-gray-600' :
            'text-gray-400'
          )}>{description}</p>
        )}
      </div>
      {children}
    </div>
  );
};

export const Steps = ({ 
  active, 
  orientation = 'horizontal', 
  className, 
  children,
  onStepClick
}: StepsProps) => {
  const steps = React.Children.toArray(children);

  return (
    <div
      className={cn(
        'flex',
        orientation === 'horizontal' ? 'flex-row items-center' : 'flex-col',
        className
      )}
    >
      {steps.map((step, index) => {
        const status =
          index < active ? 'complete' : 
          index === active ? 'current' : 'pending';

        // Define onClick handler if onStepClick is provided
        const handleClick = onStepClick ? () => onStepClick(index) : undefined;

        // Clone the step element to pass the status prop and onClick handler
        const stepWithProps = React.cloneElement(step as React.ReactElement<StepProps>, {
          status,
          onClick: handleClick,
        });

        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={index}>
            <div className={cn(
              'flex-1',
              orientation === 'horizontal' ? 'flex-basis-0' : ''
            )}>
              {stepWithProps}
            </div>
            
            {!isLast && (
              <div
                className={cn(
                  orientation === 'horizontal'
                    ? 'w-12 h-1 mx-2'
                    : 'h-12 w-1 my-2',
                  index < active
                    ? 'bg-primary'
                    : 'bg-gray-200',
                  'transition-colors duration-300'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
