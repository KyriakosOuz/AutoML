
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TrainingTabNavigationProps {
  isTabEnabled?: (tabName: string) => boolean;
  value?: string;
  onValueChange?: (value: string) => void;
}

const TrainingTabNavigation: React.FC<TrainingTabNavigationProps> = ({ 
  isTabEnabled = () => true,
  value,
  onValueChange 
}) => {
  return (
    <Tabs value={value} onValueChange={onValueChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-gray-100">
        <TabsTrigger value="dataset" className="data-[state=active]:bg-black data-[state=active]:text-white">Dataset</TabsTrigger>
        <TabsTrigger value="training" disabled={!isTabEnabled("training")} className="data-[state=active]:bg-black data-[state=active]:text-white">Training</TabsTrigger>
        <TabsTrigger value="results" disabled={!isTabEnabled("results")} className="data-[state=active]:bg-black data-[state=active]:text-white">Results</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default TrainingTabNavigation;
