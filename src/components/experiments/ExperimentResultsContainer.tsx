
import React, { useEffect, useState } from 'react';
import { getExperimentResults } from '@/lib/training';
import { ExperimentResults as ExperimentResultsType } from '@/types/training';
import { useToast } from '@/hooks/use-toast';
import { ExperimentStatus } from '@/contexts/training/types';
import ExperimentResults from '../results/ExperimentResults';  // Updated import path

interface ExperimentResultsContainerProps {
  experimentId: string | null;
  status: ExperimentStatus;
  onReset?: () => void;
  onRefresh?: () => void;
}

const ExperimentResultsContainer: React.FC<ExperimentResultsContainerProps> = ({
  experimentId,
  status,
  onReset,
  onRefresh
}) => {
  const [results, setResults] = useState<ExperimentResultsType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!experimentId) return;
    
    if ((status === 'completed' || status === 'success')) {
      fetchResults();
    }
  }, [experimentId, status]);

  const fetchResults = async () => {
    if (!experimentId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("[ExperimentResultsContainer] Fetching results for experiment:", experimentId);
      const data = await getExperimentResults(experimentId);
      
      if (data) {
        console.log("[ExperimentResultsContainer] Successfully fetched experiment results:", data);
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

  const handleRefresh = () => {
    fetchResults();
    if (onRefresh) onRefresh();
  };

  return (
    <ExperimentResults
      experimentId={experimentId}
      status={status}
      experimentResults={results}
      isLoading={isLoading}
      error={error}
      onReset={onReset}
      onRefresh={handleRefresh}
    />
  );
};

export default ExperimentResultsContainer;
