
import React from 'react';
import { DatasetProvider } from '@/contexts/DatasetContext';
import { TrainingProvider } from '@/contexts/TrainingContext';
import ModelTrainingContent from '@/components/training/ModelTrainingContent';
import { Toaster } from '@/components/ui/toaster';

const ModelTrainingPage: React.FC = () => {
  return (
    <DatasetProvider>
      <TrainingProvider>
        <ModelTrainingContent />
        <Toaster />
      </TrainingProvider>
    </DatasetProvider>
  );
};

export default ModelTrainingPage;
