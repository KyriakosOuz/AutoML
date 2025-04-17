
import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TabNavigationProps {
  isTabEnabled: (tabName: string) => boolean;
}

const DatasetTabNavigation: React.FC<TabNavigationProps> = ({ isTabEnabled }) => {
  return (
    <TabsList className="grid w-full grid-cols-4 bg-gray-100">
      <TabsTrigger value="upload" className="data-[state=active]:bg-black data-[state=active]:text-white">Upload</TabsTrigger>
      <TabsTrigger value="explore" disabled={!isTabEnabled("explore")} className="data-[state=active]:bg-black data-[state=active]:text-white">Explore</TabsTrigger>
      <TabsTrigger value="features" disabled={!isTabEnabled("features")} className="data-[state=active]:bg-black data-[state=active]:text-white">Features</TabsTrigger>
      <TabsTrigger value="preprocess" disabled={!isTabEnabled("preprocess")} className="data-[state=active]:bg-black data-[state=active]:text-white">Preprocess</TabsTrigger>
    </TabsList>
  );
};

export default DatasetTabNavigation;
