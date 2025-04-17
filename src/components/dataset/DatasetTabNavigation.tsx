
import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TabNavigationProps {
  isTabEnabled: (tabName: string) => boolean;
}

const DatasetTabNavigation: React.FC<TabNavigationProps> = ({ isTabEnabled }) => {
  return (
    <TabsList className="grid w-full grid-cols-4">
      <TabsTrigger value="upload">Upload</TabsTrigger>
      <TabsTrigger value="explore" disabled={!isTabEnabled("explore")}>Explore</TabsTrigger>
      <TabsTrigger value="features" disabled={!isTabEnabled("features")}>Features</TabsTrigger>
      <TabsTrigger value="preprocess" disabled={!isTabEnabled("preprocess")}>Preprocess</TabsTrigger>
    </TabsList>
  );
};

export default DatasetTabNavigation;
