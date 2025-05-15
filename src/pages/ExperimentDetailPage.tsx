
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ExperimentResults } from '@/types/training';
import ExperimentResultsContainer from '@/components/experiments/ExperimentResultsContainer';
import { getExperimentResults } from '@/lib/training';
import { toast } from '@/hooks/use-toast';
import ExperimentSidePanel from '@/components/ai-assistant/ExperimentSidePanel';

const ExperimentDetailPage: React.FC = () => {
  const { experimentId } = useParams<{ experimentId: string }>();

  const { data, isLoading, error } = useQuery<ExperimentResults>({
    queryKey: ['experiment', experimentId],
    queryFn: () => getExperimentResults(experimentId!),
    enabled: !!experimentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (error) {
      toast.error("Failed to load experiment", {
        description: 'Could not fetch experiment results. Please try again.'
      });
    }
  }, [error]);
  
  // Determine the status to pass to ExperimentResultsContainer
  const status = data?.status || (isLoading ? 'processing' : error ? 'failed' : 'completed');
  
  return (
    <div className="container max-w-5xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-6">Experiment Details</h1>
      
      <ExperimentResultsContainer 
        experimentId={experimentId || ''} 
        status={status}
      />
      
      <ExperimentSidePanel />
    </div>
  );
};

export default ExperimentDetailPage;
