
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ExperimentResults } from '@/types/training';
import ExperimentResultsContainer from '@/components/experiments/ExperimentResultsContainer';
import { getExperimentResults } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AssistantInsightsProvider } from '@/contexts/AssistantInsightsContext';
import ExperimentSidePanel from '@/components/ai-assistant/ExperimentSidePanel';

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
  
  return (
    <AssistantInsightsProvider>
      <div className="container max-w-5xl mx-auto px-4 py-6 sm:py-8">
        <h1 className="text-xl sm:text-2xl font-bold mb-6">Experiment Details</h1>
        
        <ExperimentResultsContainer 
          experimentId={experimentId || ''} 
          results={data}
          isLoading={isLoading}
        />
        
        <ExperimentSidePanel />
      </div>
    </AssistantInsightsProvider>
  );
};

export default ExperimentDetailPage;
