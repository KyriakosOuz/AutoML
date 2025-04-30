
import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TabNavigationProps {
  isTabEnabled: (tabName: string) => boolean;
}

const DatasetTabNavigation: React.FC<TabNavigationProps> = ({ isTabEnabled }) => {
  return (
    <TabsList className="grid w-full grid-cols-4 bg-gray-100">
      <TabsTrigger 
        value="upload" 
        className="data-[state=active]:bg-black data-[state=active]:text-white text-xs sm:text-sm py-2"
      >
        Upload
      </TabsTrigger>
      <TabsTrigger 
        value="explore" 
        disabled={!isTabEnabled("explore")} 
        className="data-[state=active]:bg-black data-[state=active]:text-white text-xs sm:text-sm py-2"
      >
        Explore
      </TabsTrigger>
      <TabsTrigger 
        value="features" 
        disabled={!isTabEnabled("features")} 
        className="data-[state=active]:bg-black data-[state=active]:text-white text-xs sm:text-sm py-2"
      >
        Features
      </TabsTrigger>
      <TabsTrigger 
        value="preprocess" 
        disabled={!isTabEnabled("preprocess")} 
        className="data-[state=active]:bg-black data-[state=active]:text-white text-xs sm:text-sm py-2"
      >
        Preprocess
      </TabsTrigger>
    </TabsList>
  );
};

export default DatasetTabNavigation;
