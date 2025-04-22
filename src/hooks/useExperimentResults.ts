
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/constants';
import { getAuthHeaders } from '@/lib/utils';
import { ExperimentResults } from '@/types/training';

interface UseExperimentResultsReturn {
  data: ExperimentResults | null;
  loading: boolean;
  error: string | null;
}

export function useExperimentResults(experimentId: string | null): UseExperimentResultsReturn {
  const [data, setData] = useState<ExperimentResults | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!experimentId) return;

    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(
          `${API_BASE_URL}/experiments/experiment-results/${experimentId}`,
          { headers }
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized: Your session has expired. Please log in again.');
          }
          
          const errorText = await response.text().catch(() => "");
          throw new Error(`Failed to fetch experiment results: ${response.status} ${response.statusText}`);
        }

        const responseText = await response.text();
        if (!responseText || responseText.trim() === '') {
          throw new Error('Server returned an empty response');
        }

        const apiResponse = JSON.parse(responseText);
        // Unwrap envelope: { status, data }
        const payload = apiResponse.data ?? apiResponse;
        
        setData(payload);
        setLoading(false);
      } catch (error) {
        console.error('[API] Error fetching experiment results:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        setLoading(false);
      }
    };

    fetchResults();
  }, [experimentId]);

  return { data, loading, error };
}
