
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DatasetsTab from '@/components/dashboard/DatasetsTab';
import ExperimentsTab from '@/components/dashboard/ExperimentsTab';
import ComparisonsTab from '@/components/dashboard/ComparisonsTab';

const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('datasets');

  return (
    <div className="py-4 sm:py-6 md:py-8 container max-w-7xl mx-auto px-4">
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
          View and manage all your datasets, experiments, and comparisons in one place.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 mb-4">
          <TabsTrigger 
            value="datasets" 
            className="data-[state=active]:bg-black data-[state=active]:text-white text-xs sm:text-sm py-2"
          >
            Datasets
          </TabsTrigger>
          <TabsTrigger 
            value="experiments" 
            className="data-[state=active]:bg-black data-[state=active]:text-white text-xs sm:text-sm py-2"
          >
            Experiments
          </TabsTrigger>
          <TabsTrigger 
            value="comparisons" 
            className="data-[state=active]:bg-black data-[state=active]:text-white text-xs sm:text-sm py-2"
          >
            Comparisons
          </TabsTrigger>
        </TabsList>

        <div className="w-full">
          <TabsContent value="datasets" className="pt-2 sm:pt-4">
            <DatasetsTab />
          </TabsContent>
          
          <TabsContent value="experiments" className="pt-2 sm:pt-4">
            <ExperimentsTab />
          </TabsContent>
          
          <TabsContent value="comparisons" className="pt-2 sm:pt-4">
            <ComparisonsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default DashboardPage;
