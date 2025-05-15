
// If this file doesn't exist, we'll create it with the default values
import { AutoMLParameters, CustomParameters } from './types';

export const POLL_INTERVAL = 5000; // 5 seconds
export const MAX_POLL_ATTEMPTS = 120; // 10 minutes max polling time

export const EXPERIMENT_STORAGE_KEY = 'active_experiment_id';
export const EXPERIMENT_TYPE_STORAGE_KEY = 'experiment_type';

export const defaultAutomlParameters: AutoMLParameters = {
  automlEngine: 'mljar', // Changed from 'h2o' to 'mljar'
  testSize: 0.2, // 20% test size
  stratify: true, // Stratify by default
  randomSeed: 42 // Default random seed
};

export const defaultCustomParameters: CustomParameters = {
  algorithm: '',
  useDefaultHyperparameters: true,
  hyperparameters: {},
  testSize: 0.2,
  stratify: true,
  randomSeed: 42,
  enableVisualization: true
};
