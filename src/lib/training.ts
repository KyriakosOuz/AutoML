
import { trainingApi } from './api';
import { ExperimentResults } from '@/types/training';

export const getExperimentResults = async (experimentId: string): Promise<ExperimentResults> => {
  return trainingApi.getExperimentResults(experimentId);
};
