
const handleTargetColumnChange = async (value: string) => {
  setTargetColumn(value);
  if (previewColumns) {
    setSelectedFeatures(prev => prev.filter(col => col !== value));
  }
  setFeaturesAreSaved(false);
  setTaskTypeError(null);
  if (datasetId) {
    setIsLoadingTaskType(true);
    try {
      const response = await datasetApi.detectTaskType(datasetId, value);
      
      let detectedTaskType = null;
      
      if (response && typeof response === 'object') {
        // Direct access to task_type property
        if (response.task_type) {
          detectedTaskType = response.task_type;
        }
        // Access via data property
        else if (response.data && response.data.task_type) {
          detectedTaskType = response.data.task_type;
        }
      } else if (typeof response === 'string') {
        try {
          // Try to parse string response as JSON
          const parsedResponse = JSON.parse(response);
          if (parsedResponse.task_type) {
            detectedTaskType = parsedResponse.task_type;
          } else if (parsedResponse.data && parsedResponse.data.task_type) {
            detectedTaskType = parsedResponse.data.task_type;
          }
        } catch (e) {
          // If parsing fails, use the string directly
          detectedTaskType = response.trim();
        }
      }
      
      console.log('Detected task type:', detectedTaskType);
      setTaskType(detectedTaskType);
    } catch (error) {
      console.error('Error detecting task type:', error);
      setTaskTypeError(error instanceof Error ? error.message : 'Failed to detect task type');
    } finally {
      setIsLoadingTaskType(false);
    }
  }
};
