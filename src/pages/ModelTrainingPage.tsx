
import React from 'react';
import { DatasetProvider } from '@/contexts/DatasetContext';
import { TrainingProvider } from '@/contexts/training/TrainingContext';
import ModelTrainingContent from '@/components/training/ModelTrainingContent';
import TrainingHeader from '@/components/training/TrainingHeader';
import TrainingInsights from '@/components/ai-assistant/TrainingInsights';
import { Toaster } from '@/components/ui/toaster';

const ModelTrainingPage: React.FC = () => {
  return (
    <DatasetProvider>
      <TrainingProvider>
        <div className="flex flex-col min-h-screen">
          <TrainingHeader />
          <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden">
            <ModelTrainingContent />
          </div>
          <Toaster />
        </div>
      </TrainingProvider>
    </DatasetProvider>
  );
};

export default ModelTrainingPage;
