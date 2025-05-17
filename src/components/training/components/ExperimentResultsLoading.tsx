
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const ExperimentResultsLoading: React.FC = () => {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
};

export default ExperimentResultsLoading;
