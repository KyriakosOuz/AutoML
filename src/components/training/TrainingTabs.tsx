
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TrainingTabs: React.FC = () => {
  return (
    <Tabs defaultValue="custom" className="w-full mb-6">
      <TabsList className="w-full">
        <TabsTrigger value="custom" className="flex-1">
          Custom Training
        </TabsTrigger>
        <TabsTrigger value="auto" className="flex-1">
          AutoML
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default TrainingTabs;
