
import React, { useState } from 'react';
import { useTraining } from '@/contexts/training/TrainingContext';
import MainLayout from '@/components/layout/MainLayout';
import TrainingTabs from '@/components/training/TrainingTabs';
import TrainingSteps from '@/components/training/TrainingSteps';
import ExperimentResultsView from '@/components/training/ExperimentResultsView';

const ModelTrainingPage = () => {
  const { 
    activeExperimentId, 
    experimentStatus, 
    isTraining, 
    resetTrainingState 
  } = useTraining();
  
  const handleReset = () => {
    resetTrainingState();
  };
  
  const showResults = activeExperimentId && experimentStatus === 'completed';
  
  return (
    <MainLayout>
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">Model Training</h1>
        
        {showResults ? (
          <ExperimentResultsView 
            experimentId={activeExperimentId} 
            onReset={handleReset}
          />
        ) : (
          <>
            <TrainingTabs />
            {isTraining && <TrainingSteps />}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default ModelTrainingPage;
