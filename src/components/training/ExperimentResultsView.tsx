
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getExperimentResults } from '@/lib/training';
import { ExperimentResults } from '@/types/training';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, InfoIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ExperimentResultsContainer from '@/components/experiments/ExperimentResultsContainer';

interface ExperimentResultsViewProps {
  experimentId: string;
}

const ExperimentResultsView: React.FC<ExperimentResultsViewProps> = ({
  experimentId
}) => {
  const { data, isLoading, error } = useQuery<ExperimentResults>({
    queryKey: ['experiment', experimentId],
    queryFn: () => getExperimentResults(experimentId),
    enabled: !!experimentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load experiment results. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  // If we have data, show a brief info message about the experiment
  return (
    <div className="w-full space-y-4">
      <Alert variant="default" className="bg-primary/5 border-primary/20">
        <InfoIcon className="h-4 w-4 text-primary" />
        <AlertDescription className="flex items-center gap-2">
          <span>Viewing results for experiment: <span className="font-medium">{data.experiment_name || experimentId}</span></span>
          {data.task_type && (
            <Badge variant="outline" className="ml-2">{data.task_type.replace(/_/g, ' ')}</Badge>
          )}
          {data.created_at && (
            <span className="text-xs text-muted-foreground ml-auto">
              Created: {new Date(data.created_at).toLocaleString()}
            </span>
          )}
        </AlertDescription>
      </Alert>
      
      {/* Pass the data directly to avoid duplicate fetching */}
      <ExperimentResultsContainer 
        experimentId={experimentId} 
        status="completed" 
        results={data}
        isLoading={false}
      />
    </div>
  );
};

export default ExperimentResultsView;
