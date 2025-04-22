
import React from 'react';
import { DatasetProvider } from '@/contexts/DatasetContext';
import { TrainingProvider } from '@/contexts/training/TrainingContext';
import ModelTrainingContent from '@/components/training/ModelTrainingContent';
import TrainingHeader from '@/components/training/TrainingHeader';
import { Toaster } from '@/components/ui/toaster';

const ModelTrainingPage: React.FC = () => {
  console.log('Rendering ModelTrainingPage');
  
  return (
    <DatasetProvider>
      <TrainingProvider>
        <div className="flex flex-col min-h-screen">
          <TrainingHeader />
          <div className="flex-1 p-6">
            <ModelTrainingContent />
          </div>
          <Toaster />
        </div>
      </TrainingProvider>
    </DatasetProvider>
  );
};

export default ModelTrainingPage;
