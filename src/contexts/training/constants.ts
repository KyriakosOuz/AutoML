
export const POLL_INTERVAL = 3000; // 3 seconds
export const MAX_POLL_ATTEMPTS = 1200; // 1 hour (1200 * 3 seconds = 3600 seconds = 1 hour)

export const EXPERIMENT_STORAGE_KEY = 'activeExperimentId';
export const EXPERIMENT_TYPE_STORAGE_KEY = 'experimentType';

export const defaultAutomlParameters = {
  automlEngine: 'mljar' as const,
  testSize: 0.2,
  stratify: true,
  randomSeed: 42,
};

export const defaultCustomParameters = {
  algorithm: '',
  hyperparameters: {},
  testSize: 0.2,
  stratify: true,
  randomSeed: 42,
  enableAnalytics: true,
  useDefaultHyperparameters: true,
  enableVisualization: true
};
