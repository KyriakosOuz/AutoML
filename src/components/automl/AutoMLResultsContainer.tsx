
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getExperimentResults } from '@/lib/training';
import { ExperimentResults, ExperimentStatus } from '@/types/training';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AutoMLResults from './AutoMLResults';

interface AutoMLResultsContainerProps {
  experimentId: string;
  status: ExperimentStatus;
  onReset?: () => void;
  onRefresh?: () => void;
}

const AutoMLResultsContainer: React.FC<AutoMLResultsContainerProps> = ({
  experimentId,
  status,
  onReset,
  onRefresh
}) => {
  const [pollingInterval, setPollingInterval] = useState<number>(2000); // 2 seconds

  // Use TanStack Query to fetch and poll for results
  const { data, isLoading, error, refetch } = useQuery<ExperimentResults>({
    queryKey: ['experiment', experimentId],
    queryFn: () => getExperimentResults(experimentId),
    enabled: !!experimentId && (status === 'running' || status === 'processing'),
    refetchInterval: (status === 'running' || status === 'processing') ? pollingInterval : false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    // When status changes to completed or failed, stop polling
    if (status === 'completed' || status === 'success' || status === 'failed') {
      setPollingInterval(0);
    } else {
      setPollingInterval(2000);
    }
  }, [status]);

  const handleRefresh = () => {
    refetch();
    if (onRefresh) onRefresh();
  };

  if (isLoading) {
    return (
      <Card className="w-full shadow-sm">
        <CardHeader>
          <CardTitle>Loading AutoML Results</CardTitle>
          <CardDescription>Fetching your experiment results...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || status === 'failed') {
    return (
      <Card className="w-full shadow-sm border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Error Loading Results
          </CardTitle>
          <CardDescription>
            There was a problem with your experiment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {data?.error_message || (error instanceof Error ? error.message : "Failed to load experiment results")}
            </AlertDescription>
          </Alert>
          <div className="flex space-x-2 mt-4">
            {onReset && (
              <Button 
                variant="outline" 
                onClick={onReset}
              >
                Run New Experiment
              </Button>
            )}
            <Button 
              variant="secondary" 
              onClick={handleRefresh}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'running' || status === 'processing') {
    return (
      <Card className="w-full shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Loader className="h-5 w-5 mr-2 animate-spin" />
            AutoML In Progress
          </CardTitle>
          <CardDescription>
            Your model is being trained. This may take a few minutes.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
              <div className="absolute inset-0 border-t-4 border-primary rounded-full animate-spin"></div>
            </div>
            <p className="mt-6 text-center text-muted-foreground max-w-md">
              {status === 'processing' 
                ? "Preparing your experiment..." 
                : "Training your AutoML model. This might take several minutes depending on the dataset size."}
            </p>
            <div className="mt-2">
              <p className="text-sm text-muted-foreground text-center">Experiment ID: {experimentId}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="w-full shadow-sm">
        <CardHeader>
          <CardTitle>No Data Available</CardTitle>
          <CardDescription>
            No results data was found for this experiment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRefresh}>Refresh</Button>
        </CardContent>
      </Card>
    );
  }

  return <AutoMLResults experimentResults={data} onReset={onReset} />;
};

export default AutoMLResultsContainer;
