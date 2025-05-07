
import { trainingApi } from './api';
import { ExperimentResults, ExperimentStatusResponse } from '@/types/training';

/**
 * Checks the status of an experiment
 */
export const checkStatus = async (experimentId: string): Promise<{ data: ExperimentStatusResponse }> => {
  return trainingApi.checkStatus(experimentId);
};

/**
 * Gets the experiment results
 */
export const getExperimentResults = async (experimentId: string): Promise<ExperimentResults> => {
  return trainingApi.getExperimentResults(experimentId);
};

/**
 * Column schema type for prediction forms
 */
export interface ColumnSchema {
  name: string;
  type: 'numeric' | 'categorical';
  values?: string[];
}

/**
 * Gets the prediction schema based on experiment results
 */
export const getPredictionSchema = (results: ExperimentResults): ColumnSchema[] => {
  // This is a placeholder implementation that needs to be filled with actual logic
  // For now, we'll return an empty array to fix the type error
  const schema: ColumnSchema[] = [];
  
  // Logic to extract column schema from experiment results would go here
  // This depends on how your experiment results are structured
  
  return schema;
};
