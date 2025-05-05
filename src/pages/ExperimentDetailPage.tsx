
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ExperimentResults } from '@/types/training';
import ExperimentResultsContainer from '@/components/experiments/ExperimentResultsContainer';
import { getExperimentResults } from '@/lib/training';
import { useToast } from '@/hooks/use-toast';
import { AssistantInsightsProvider } from '@/contexts/AssistantInsightsContext';
import ExperimentSidePanel from '@/components/ai-assistant/ExperimentSidePanel';
import { DatasetProvider } from '@/contexts/DatasetContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ExperimentDetailPage: React.FC = () => {
  const { experimentId } = useParams<{ experimentId: string }>();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<ExperimentResults>({
    queryKey: ['experiment', experimentId],
    queryFn: () => getExperimentResults(experimentId!),
    enabled: !!experimentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Failed to load experiment',
        description: 'Could not fetch experiment results. Please try again.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);
  
  // Determine the status to pass to ExperimentResultsContainer
  const status = data?.status || (isLoading ? 'processing' : error ? 'failed' : 'completed');
  
  return (
    <DatasetProvider>
      <AssistantInsightsProvider>
        <div className="container max-w-5xl mx-auto px-4 py-6 sm:py-8">
          <h1 className="text-xl sm:text-2xl font-bold mb-6">Experiment Details</h1>
          
          {data && !isLoading && !error && (
            <Alert variant="default" className="bg-primary/5 border-primary/20 mb-6">
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
          )}
          
          <ExperimentResultsContainer 
            experimentId={experimentId || ''} 
            status={status}
          />
          
          <ExperimentSidePanel />
        </div>
      </AssistantInsightsProvider>
    </DatasetProvider>
  );
};

export default ExperimentDetailPage;
