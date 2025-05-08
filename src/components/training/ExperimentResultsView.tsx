
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getExperimentResults } from '@/lib/training';
import { ExperimentResults } from '@/types/training';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import CustomTrainingResults from './CustomTrainingResults';
import { useTraining } from '@/contexts/training/TrainingContext';

interface ExperimentResultsViewProps {
  experimentId: string;
}

const ExperimentResultsView: React.FC<ExperimentResultsViewProps> = ({
  experimentId
}) => {
  const { setResultsLoaded, resetTrainingState } = useTraining();
  
  const { data, isLoading, error } = useQuery<ExperimentResults>({
    queryKey: ['experiment', experimentId],
    queryFn: () => getExperimentResults(experimentId),
    enabled: !!experimentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Notify parent components when results are loaded or loading
  useEffect(() => {
    if (data && !isLoading) {
      console.log("[ExperimentResultsView] Results loaded successfully");
      if (setResultsLoaded) {
        setResultsLoaded(true);
      }
    } else {
      if (setResultsLoaded) {
        setResultsLoaded(false);
      }
    }
  }, [data, isLoading, setResultsLoaded]);

  // Handler for the "Run New Experiment" button
  const handleReset = () => {
    console.log("[ExperimentResultsView] Resetting training state");
    resetTrainingState();
  };

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

  return (
    <div className="w-full">
      <CustomTrainingResults 
        experimentResults={data} 
        onReset={handleReset}
      />
    </div>
  );
};

export default ExperimentResultsView;
