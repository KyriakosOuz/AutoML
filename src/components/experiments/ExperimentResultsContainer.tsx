
import React, { useEffect, useState } from 'react';
import { trainingApi } from '@/lib/api';
import { ExperimentResults as ExperimentResultsType } from '@/types/training';
import { useToast } from '@/hooks/use-toast';
import { ExperimentStatus } from '@/contexts/training/types';
import ExperimentResults from './ExperimentResults';

interface ExperimentResultsContainerProps {
  experimentId: string | null;
  status: ExperimentStatus;
  onReset?: () => void;
}

const ExperimentResultsContainer: React.FC<ExperimentResultsContainerProps> = ({
  experimentId,
  status,
  onReset
}) => {
  const [results, setResults] = useState<ExperimentResultsType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch results only when experimentId is available and we don't already have results
  // or when hasTrainingResults transitions to true
  useEffect(() => {
    if (!experimentId) return;
    
    // Only fetch if we don't have results yet AND status indicates they're available
    if (!results && (status === 'completed' || status === 'success')) {
      fetchResults();
    }
  }, [experimentId, status]);

  const fetchResults = async () => {
    if (!experimentId) return;
    
    // Don't refetch if we already have the results for this experiment
    if (results && results.experimentId === experimentId) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("[ExperimentResultsContainer] Fetching results for experiment:", experimentId);
      const data = await trainingApi.getExperimentResults(experimentId);
      
      if (data) {
        console.log("[ExperimentResultsContainer] Successfully fetched experiment results");
        setResults(data);
      } else {
        console.log("[ExperimentResultsContainer] No results returned from API");
        setError("Failed to load experiment results");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load experiment results';
      console.error("[ExperimentResultsContainer] Error fetching results:", errorMessage);
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ExperimentResults
      experimentId={experimentId}
      status={status}
      experimentResults={results}
      isLoading={isLoading}
      error={error}
      onReset={onReset}
    />
  );
};

export default ExperimentResultsContainer;
