
import { datasetApi } from './api';

// Extend the original datasetApi with our modified version that accepts the fourth parameter
export const extendedDatasetApi = {
  ...datasetApi,
  
  // Override the preprocessDataset method to accept the imputation strategy
  preprocessDataset: async (
    datasetId: string,
    normalization: string,
    balancing: string,
    imputation: string
  ) => {
    // Create the options object that combines all preprocessing parameters
    const options = {
      normalization,
      balancing,
      imputation
    };
    
    // Call the original method with the options object
    // (Assuming the original accepts an options object as the third parameter)
    return await datasetApi.preprocessDataset(datasetId, options);
  }
};
