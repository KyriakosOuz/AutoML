
import { useState, useEffect, useCallback } from 'react';
import { trainingApi } from '@/lib/api';
import { ExperimentStatus } from './types';

interface UseExperimentPollingProps {
  onSuccess: (experimentId: string) => void;
  onError: (error: string) => void;
  setExperimentStatus: (status: ExperimentStatus) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useExperimentPolling = ({
  onSuccess,
  onError,
  setExperimentStatus,
  setIsLoading
}: UseExperimentPollingProps) => {
  const [experimentId, setExperimentId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    setExperimentId(null);
    setPollCount(0);
  }, []);

  const startPolling = useCallback((id: string) => {
    setExperimentId(id);
    setIsPolling(true);
    setPollCount(0);
    setExperimentStatus('processing');
  }, [setExperimentStatus]);

  useEffect(() => {
    if (!isPolling || !experimentId) return;

    const intervalId = setInterval(async () => {
      try {
        setIsLoading(true);
        const statusResponse = await trainingApi.checkStatus(experimentId);
        
        setPollCount(prev => prev + 1);
        
        console.log(`[TrainingContext] Status response data:`, statusResponse.data);
        
        if (statusResponse.data) {
          const { status, hasTrainingResults } = statusResponse.data;
          
          setExperimentStatus(status as ExperimentStatus);
          
          if (status === 'failed') {
            setIsLoading(false);
            stopPolling();
            onError(statusResponse.data.error_message || 'Training failed with unknown error');
            return;
          }
          
          if (status === 'completed' && hasTrainingResults === true) {
            setIsLoading(false);
            stopPolling();
            onSuccess(experimentId);
            return;
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        const errorMessage = error instanceof Error ? error.message : 'Failed to check training status';
        console.error('[TrainingContext] Polling error:', errorMessage);
        
        // Stop polling after 5 consecutive errors
        if (pollCount > 5) {
          stopPolling();
          onError('Failed to check training status after multiple attempts');
        }
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId);
  }, [
    isPolling, 
    experimentId, 
    pollCount, 
    onSuccess, 
    onError, 
    stopPolling, 
    setExperimentStatus, 
    setIsLoading
  ]);

  return { startPolling, stopPolling, isPolling };
};
