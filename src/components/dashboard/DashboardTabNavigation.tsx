
import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

const DashboardTabNavigation: React.FC = () => {
  return (
    <TabsList className="grid w-full grid-cols-3 bg-gray-100">
      <TabsTrigger value="datasets" className="data-[state=active]:bg-black data-[state=active]:text-white">Datasets</TabsTrigger>
      <TabsTrigger value="experiments" className="data-[state=active]:bg-black data-[state=active]:text-white">Experiments</TabsTrigger>
      <TabsTrigger value="comparisons" className="data-[state=active]:bg-black data-[state=active]:text-white">Comparisons</TabsTrigger>
    </TabsList>
  );
};

export default DashboardTabNavigation;
