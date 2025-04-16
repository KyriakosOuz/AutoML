
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
}

export interface StepsProps {
  active: number;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  children: React.ReactNode;
}

export const Step = ({
  title,
  description,
  icon,
  status = 'pending',
  className,
  children,
}: StepProps) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center',
        className
      )}
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
          <p className="text-xs text-gray-500">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
};

export const Steps = ({ active, orientation = 'horizontal', className, children }: StepsProps) => {
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

        // Clone the step element to pass the status prop
        const stepWithProps = React.cloneElement(step as React.ReactElement<StepProps>, {
          status,
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
                    : 'bg-gray-200'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
