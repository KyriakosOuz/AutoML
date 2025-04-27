
import { useState, useCallback, useEffect } from 'react';
import { checkStatus } from '@/lib/training';
import { useToast } from '@/hooks/use-toast';
import { ExperimentStatus } from '@/types/training';
import { wait } from '@/lib/utils';

export interface UseExperimentPollingProps {
  onSuccess: (experimentId: string) => void;
  onError: (error: string) => void;
  setExperimentStatus: (status: ExperimentStatus) => void;
  setIsLoading: (loading: boolean) => void;
}

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 2000;
const MAX_RETRY_DELAY = 30000;
const POLL_INTERVAL = 2000;

export const useExperimentPolling = ({
  onSuccess,
  onError,
  setExperimentStatus,
  setIsLoading
}: UseExperimentPollingProps) => {
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [retryDelay, setRetryDelay] = useState(INITIAL_RETRY_DELAY);
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
    setRetryDelay(INITIAL_RETRY_DELAY);
    setExperimentStatus('processing');

    const poll = async () => {
      try {
        const response = await checkStatus(experimentId);
        const data = response.data;
        
        // Reset retry counters on successful response
        setRetryCount(0);
        setRetryDelay(INITIAL_RETRY_DELAY);
        
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
        
        // Increment retry count and implement exponential backoff
        setRetryCount(prev => {
          const newCount = prev + 1;
          if (newCount >= MAX_RETRIES) {
            stopPolling();
            onError('Failed to check experiment status after multiple attempts. The server might be unavailable.');
            return prev;
          }
          return newCount;
        });

        // Calculate next retry delay with exponential backoff
        setRetryDelay(prev => {
          const newDelay = Math.min(prev * 2, MAX_RETRY_DELAY);
          return newDelay;
        });

        // Show toast with retry information
        if (error instanceof Error) {
          toast({
            title: "Connection Error",
            description: `${error.message}. Retrying in ${retryDelay / 1000} seconds...`,
            variant: "destructive"
          });
        }

        // Wait before next retry using exponential backoff
        await wait(retryDelay);
      }
    };

    // Initial poll
    await poll();
    
    // Set up polling interval
    const interval = setInterval(poll, POLL_INTERVAL);
    setPollingInterval(interval);
  }, [onSuccess, onError, setExperimentStatus, setIsLoading, stopPolling, toast, retryDelay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return { startPolling, stopPolling };
};
