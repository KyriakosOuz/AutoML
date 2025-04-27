
import { useState, useCallback, useEffect } from 'react';
import { checkStatus } from '@/lib/training';
import { useToast } from '@/hooks/use-toast';
import { ExperimentStatus } from '@/types/training';

export interface UseExperimentPollingProps {
  onSuccess: (experimentId: string) => void;
  onError: (error: string) => void;
  setExperimentStatus: (status: ExperimentStatus) => void;
  setIsLoading: (loading: boolean) => void;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const POLL_INTERVAL = 2000;

export const useExperimentPolling = ({
  onSuccess,
  onError,
  setExperimentStatus,
  setIsLoading
}: UseExperimentPollingProps) => {
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [pollingInterval]);

  const startPolling = useCallback(async (experimentId: string) => {
    stopPolling();
    setIsLoading(true);
    setRetryCount(0);
    setExperimentStatus('processing');

    const poll = async () => {
      try {
        const response = await checkStatus(experimentId);
        const data = response.data;
        
        if (data.status === 'failed' || !!data.error_message) {
          stopPolling();
          setExperimentStatus('failed');
          onError(data.error_message || 'Training failed');
          return;
        }

        setExperimentStatus(data.status);
        
        if (data.hasTrainingResults === true) {
          stopPolling();
          onSuccess(experimentId);
        }
      } catch (error) {
        console.error('[Polling] Error:', error);
        
        // Increment retry count
        setRetryCount(prev => {
          const newCount = prev + 1;
          if (newCount >= MAX_RETRIES) {
            stopPolling();
            onError('Failed to check experiment status after multiple attempts');
            return prev;
          }
          return newCount;
        });

        // Show toast on first error
        if (retryCount === 0) {
          toast({
            title: "Connection Error",
            description: "Having trouble connecting to the server. Retrying...",
            variant: "destructive"
          });
        }
      }
    };

    // Initial poll
    await poll();
    
    // Set up polling interval
    const interval = setInterval(poll, POLL_INTERVAL);
    setPollingInterval(interval);
  }, [onSuccess, onError, setExperimentStatus, setIsLoading, stopPolling, toast, retryCount]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return { startPolling, stopPolling };
};
