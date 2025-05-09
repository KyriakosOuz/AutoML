
import React, { useState, useEffect, useCallback } from 'react';
import { useTraining } from '@/contexts/training/TrainingContext';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import TrainingResultsV2 from './TrainingResultsV2';
import H2OExperimentResults from './results/H2OExperimentResults';

interface ExperimentResultsViewProps {
  experimentId: string;
}

const ExperimentResultsView: React.FC<ExperimentResultsViewProps> = ({ experimentId }) => {
  const {
    getExperimentResults,
    experimentResults,
    isLoadingResults,
    resetTrainingState,
    setExperimentStatus,
    setResultsLoaded,
    isTraining
  } = useTraining();

  // Fetch experiment results on component mount or when experimentId changes
  useEffect(() => {
    if (experimentId) {
      getExperimentResults();
    }
  }, [experimentId, getExperimentResults]);

  // Update experiment status when data is loaded
  useEffect(() => {
    if (experimentResults && experimentResults.status) {
      const { status } = experimentResults;
      
      if ((status === 'success' || status === 'completed') && experimentResults) {
        // Only update if status is not already 'completed'
        setExperimentStatus('completed');
        setResultsLoaded(true);
      } else if (status === 'failed' || status === 'error') {
        setExperimentStatus('error');
        setResultsLoaded(false);
      }
    }
  }, [experimentResults, setExperimentStatus, setResultsLoaded]);

  // Reset training function
  const handleReset = useCallback(() => {
    resetTrainingState();
  }, [resetTrainingState]);

  // Render loading state
  if (isLoadingResults || isTraining) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle no experiment results case
  if (!experimentResults) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">No results available for this experiment</p>
        </CardContent>
      </Card>
    );
  }

  // Render experiment results based on the engine used
  if (experimentResults.automl_engine === 'h2o' || experimentResults.automl_engine === 'h2o_automl') {
    return <H2OExperimentResults experimentResults={experimentResults} />;
  }

  // Default to standard results view
  return <TrainingResultsV2 experimentId={experimentId} onReset={handleReset} />;
};

export default ExperimentResultsView;
