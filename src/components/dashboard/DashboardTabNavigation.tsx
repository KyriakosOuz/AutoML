
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DashboardTabNavigationProps {
  value?: string;
  onValueChange?: (value: string) => void;
}

const DashboardTabNavigation: React.FC<DashboardTabNavigationProps> = ({ 
  value,
  onValueChange 
}) => {
  return (
    <Tabs value={value} onValueChange={onValueChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-gray-100">
        <TabsTrigger value="datasets" className="data-[state=active]:bg-black data-[state=active]:text-white">Datasets</TabsTrigger>
        <TabsTrigger value="experiments" className="data-[state=active]:bg-black data-[state=active]:text-white">Experiments</TabsTrigger>
        <TabsTrigger value="comparisons" className="data-[state=active]:bg-black data-[state=active]:text-white">Comparisons</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default DashboardTabNavigation;
