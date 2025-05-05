
import React, { useEffect, useState } from 'react';
import { getExperimentResults } from '@/lib/training';
import { ExperimentResults as ExperimentResultsType } from '@/types/training';
import { useToast } from '@/hooks/use-toast';
import { ExperimentStatus } from '@/contexts/training/types';
import ExperimentResults from '../results/ExperimentResults';
import MLJARExperimentResults from '../results/MLJARExperimentResults';

interface ExperimentResultsContainerProps {
  experimentId: string | null;
  status: ExperimentStatus;
  results?: ExperimentResultsType | null; // Make results optional
  isLoading?: boolean; // Make isLoading optional
  onReset?: () => void; // Make onReset optional
  onRefresh?: () => void;
}

const ExperimentResultsContainer: React.FC<ExperimentResultsContainerProps> = ({
  experimentId,
  status,
  results: providedResults,
  isLoading: providedIsLoading,
  onReset = () => {}, // Default no-op function
  onRefresh
}) => {
  const [results, setResults] = useState<ExperimentResultsType | null>(providedResults || null);
  const [isLoading, setIsLoading] = useState<boolean>(providedIsLoading !== undefined ? providedIsLoading : false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (providedResults) {
      // If results are provided as props, use them
      setResults(providedResults);
      return;
    }
    
    if (!experimentId) return;
    
    // Fetch results when status is completed, success, or failed (to show error details)
    if ((status === 'completed' || status === 'success' || status === 'failed')) {
      fetchResults();
    }
  }, [experimentId, status, providedResults]);

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

  // Check if this is a MLJAR experiment
  const isMljarExperiment = results?.automl_engine === "mljar";

  return (
    <div className="w-full overflow-x-hidden">
      {isMljarExperiment ? (
        <MLJARExperimentResults
          experimentId={experimentId}
          status={status}
          experimentResults={results}
          isLoading={isLoading}
          error={error}
          onReset={onReset}
          onRefresh={handleRefresh}
        />
      ) : (
        <ExperimentResults
          experimentId={experimentId}
          status={status}
          experimentResults={results}
          isLoading={isLoading}
          error={error}
          onReset={onReset}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
};

export default ExperimentResultsContainer;
