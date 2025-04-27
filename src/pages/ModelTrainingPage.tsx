
import React from 'react';
import { DatasetProvider } from '@/contexts/DatasetContext';
import { TrainingProvider } from '@/contexts/training/TrainingContext';
import ModelTrainingContent from '@/components/training/ModelTrainingContent';
import TrainingHeader from '@/components/training/TrainingHeader';
import { Toaster } from '@/components/ui/toaster';
import TrainingTabNavigation from '@/components/training/TrainingTabNavigation';

const ModelTrainingPage: React.FC = () => {
  return (
    <DatasetProvider>
      <TrainingProvider>
        <div className="flex flex-col min-h-screen">
          <TrainingHeader />
          <div className="flex-1 p-6">
            <div className="container max-w-7xl mx-auto">
              <TrainingTabNavigation />
              <ModelTrainingContent />
            </div>
          </div>
          <Toaster />
        </div>
      </TrainingProvider>
    </DatasetProvider>
  );
};

export default ModelTrainingPage;
