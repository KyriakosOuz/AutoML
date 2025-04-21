
import React from 'react';
import { DatasetProvider } from '@/contexts/DatasetContext';
import { TrainingProvider } from '@/contexts/TrainingContext';
import ModelTrainingContent from '@/components/training/ModelTrainingContent';

const ModelTrainingPage: React.FC = () => {
  return (
    <DatasetProvider>
      <TrainingProvider>
        <ModelTrainingContent />
      </TrainingProvider>
    </DatasetProvider>
  );
};

export default ModelTrainingPage;
