
import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TrainingTabNavigationProps {
  isTabEnabled?: (tabName: string) => boolean;
}

const TrainingTabNavigation: React.FC<TrainingTabNavigationProps> = ({ isTabEnabled = () => true }) => {
  return (
    <TabsList className="grid w-full grid-cols-3 bg-gray-100">
      <TabsTrigger value="dataset" className="data-[state=active]:bg-black data-[state=active]:text-white">Dataset</TabsTrigger>
      <TabsTrigger value="training" disabled={!isTabEnabled("training")} className="data-[state=active]:bg-black data-[state=active]:text-white">Training</TabsTrigger>
      <TabsTrigger value="results" disabled={!isTabEnabled("results")} className="data-[state=active]:bg-black data-[state=active]:text-white">Results</TabsTrigger>
    </TabsList>
  );
};

export default TrainingTabNavigation;
