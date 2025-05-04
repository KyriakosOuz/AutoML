
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
    // Looking at the original function in api.ts, it expects three separate parameters:
    // datasetId, normalizationMethod, and balanceStrategy
    // We need to pass these parameters separately, not as an options object
    return await datasetApi.preprocessDataset(datasetId, normalization, balancing);
    
    // Note: The imputation parameter is collected here but the backend API
    // doesn't support it yet. In the future, the API will need to be updated
    // to accept this parameter as well.
  }
};
