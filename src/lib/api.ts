
  getExperimentResults: async (experimentId: string) => {
    try {
      console.log('[API] Fetching experiment results for:', experimentId);
      
      const response = await fetch(`${API_URL}/experiments/experiment-results/${experimentId}`, {
        headers: getAuthHeaders()
      });
      
      const contentType = response.headers.get('content-type');
      console.log('[API] Response content-type:', contentType);

      if (!response.ok) {
        if (response.status === 404) {
          // Return a structured response for 404 (experiment not yet created)
          return { 
            status: 'processing',
            experiment_id: experimentId,
            message: 'Waiting for experiment to start...',
          };
        }
        
        const errorText = await response.text();
        let errorMessage;
        
        try {
          // Try to parse as JSON
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.detail || errorJson.message || `Error: ${response.status} ${response.statusText}`;
        } catch {
          // If not JSON, use the raw text
          errorMessage = `Error: ${response.status} ${response.statusText} - ${errorText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON response, got: ${contentType}\n${text.slice(0, 200)}`);
      }
      
      const data = await response.json();
      return data.data?.experiment_results || data.experiment_results || data;
    } catch (error) {
      console.error('Error fetching experiment results:', error);
      throw error;
    }
  },
