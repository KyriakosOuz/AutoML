
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getExperimentResults, checkStatus } from '@/lib/training';
import { ExperimentResults } from '@/types/training';
import ExperimentResultsComponent from './ExperimentResults';
import { ExperimentStatus } from '@/contexts/training/types';

interface ExperimentResultsContainerProps {
  experimentId: string | null;
  status?: ExperimentStatus;
  onRefresh?: () => void;
  onReset?: () => void;
}

const ExperimentResultsContainer: React.FC<ExperimentResultsContainerProps> = ({
  experimentId,
  status: initialStatus = 'completed',
  onRefresh,
  onReset
}) => {
  const [experimentResults, setExperimentResults] = useState<ExperimentResults | null>(null);
  const [status, setStatus] = useState<ExperimentStatus>(initialStatus);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollTimeout, setPollTimeout] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const fetchResults = async () => {
    if (!experimentId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // First check status to see if the experiment is completed
      const statusResponse = await checkStatus(experimentId);
      if (!statusResponse.status || statusResponse.status === 'error') {
        throw new Error(statusResponse.message || 'Failed to check experiment status');
      }
      
      const experimentStatus = statusResponse.data.status;
      setStatus(experimentStatus);
      
      // If experiment is still running, we'll poll for updates
      if (experimentStatus === 'running' || experimentStatus === 'processing') {
        return; // Don't fetch results yet, wait for next poll
      }
      
      // Fetch full results if experiment is completed or failed
      const results = await getExperimentResults(experimentId);
      setExperimentResults(results);
      setError(null);
      
    } catch (err) {
      console.error('Error fetching experiment results:', err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message);
      toast({
        title: 'Error',
        description: 'Failed to load experiment results',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Poll for updates if experiment is still running
  useEffect(() => {
    if (!experimentId) return;

    // Clean up previous timeout if it exists
    if (pollTimeout) {
      clearTimeout(pollTimeout);
    }

    // Set up polling if experiment is still running
    if (status === 'running' || status === 'processing') {
      const timeout = setTimeout(fetchResults, 3000); // Poll every 3 seconds
      setPollTimeout(timeout);
    }

    return () => {
      if (pollTimeout) {
        clearTimeout(pollTimeout);
      }
    };
  }, [experimentId, status]);

  // Initial fetch
  useEffect(() => {
    fetchResults();
    
    return () => {
      if (pollTimeout) {
        clearTimeout(pollTimeout);
      }
    };
  }, [experimentId]);

  const handleRefresh = () => {
    fetchResults();
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleReset = () => {
    setExperimentResults(null);
    setIsLoading(false);
    setError(null);
    if (onReset) {
      onReset();
    }
  };

  return (
    <ExperimentResultsComponent
      experimentId={experimentId}
      status={status}
      experimentResults={experimentResults}
      isLoading={isLoading}
      error={error}
      onReset={handleReset}
      onRefresh={handleRefresh}
    />
  );
};

export default ExperimentResultsContainer;
