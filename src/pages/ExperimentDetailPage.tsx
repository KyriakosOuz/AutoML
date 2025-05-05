
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ExperimentResults } from '@/types/training';
import ExperimentResultsContainer from '@/components/experiments/ExperimentResultsContainer';
import { getExperimentResults } from '@/lib/training';
import { useToast } from '@/hooks/use-toast';
import { AssistantInsightsProvider } from '@/contexts/AssistantInsightsContext';
import AIBottomPanel from '@/components/ai-assistant/AIBottomPanel';
import { useAssistantInsights } from '@/contexts/AssistantInsightsContext';

const ExperimentDetailPage: React.FC = () => {
  const { experimentId } = useParams<{ experimentId: string }>();
  const { toast } = useToast();
  const { getRouteInsights } = useAssistantInsights();

  const { data, isLoading, error, refetch } = useQuery<ExperimentResults>({
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
  
  const insights = React.useMemo(() => {
    return getRouteInsights('/experiment').map(insight => ({
      id: insight.id,
      title: insight.title,
      content: insight.content,
      suggestedPrompts: insight.suggestedPrompts,
    }));
  }, [getRouteInsights]);
  
  // Determine the status to pass to ExperimentResultsContainer
  const status = data?.status || (isLoading ? 'processing' : error ? 'failed' : 'completed');
  
  return (
    <AssistantInsightsProvider>
      <div className="container max-w-5xl mx-auto px-4 py-6 sm:py-8 mb-16">
        <h1 className="text-xl sm:text-2xl font-bold mb-6">
          Experiment Details
          {data?.experiment_name && ` - ${data.experiment_name}`}
        </h1>
        
        <ExperimentResultsContainer 
          experimentId={experimentId || ''} 
          status={status}
          onReset={() => {/* Optional reset handler */}}
          onRefresh={() => refetch()}
        />
        
        <AIBottomPanel insights={insights} />
      </div>
    </AssistantInsightsProvider>
  );
};

export default ExperimentDetailPage;
