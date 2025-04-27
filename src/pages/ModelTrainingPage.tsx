
import React, { useState } from 'react';
import { DatasetProvider } from '@/contexts/DatasetContext';
import { TrainingProvider } from '@/contexts/training/TrainingContext';
import ModelTrainingContent from '@/components/training/ModelTrainingContent';
import TrainingHeader from '@/components/training/TrainingHeader';
import { Toaster } from '@/components/ui/toaster';
import TrainingTabNavigation from '@/components/training/TrainingTabNavigation';
import { Tabs, TabsContent } from '@/components/ui/tabs';

const ModelTrainingPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('dataset');

  return (
    <DatasetProvider>
      <TrainingProvider>
        <div className="flex flex-col min-h-screen">
          <TrainingHeader />
          <div className="flex-1 p-6">
            <div className="container max-w-7xl mx-auto">
              <Tabs value={currentTab} onValueChange={setCurrentTab}>
                <TrainingTabNavigation 
                  value={currentTab}
                  onValueChange={setCurrentTab} 
                />
                <TabsContent value="dataset">
                  <ModelTrainingContent />
                </TabsContent>
                <TabsContent value="training">
                  <ModelTrainingContent />
                </TabsContent>
                <TabsContent value="results">
                  <ModelTrainingContent />
                </TabsContent>
              </Tabs>
            </div>
          </div>
          <Toaster />
        </div>
      </TrainingProvider>
    </DatasetProvider>
  );
};

export default ModelTrainingPage;
