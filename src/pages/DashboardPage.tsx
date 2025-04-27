
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DatasetsTab from '@/components/dashboard/DatasetsTab';
import ExperimentsTab from '@/components/dashboard/ExperimentsTab';
import ComparisonsTab from '@/components/dashboard/ComparisonsTab';

const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('datasets');

  return (
    <div className="py-8 container max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Dashboard</h1>
        <p className="text-gray-600 max-w-2xl">
          View and manage all your datasets, experiments, and comparisons in one place.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-10 bg-black text-white">
          <TabsTrigger 
            value="datasets" 
            className="rounded-none shadow-none data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-none"
          >
            Datasets
          </TabsTrigger>
          <TabsTrigger 
            value="experiments" 
            className="rounded-none shadow-none data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-none"
          >
            Experiments
          </TabsTrigger>
          <TabsTrigger 
            value="comparisons" 
            className="rounded-none shadow-none data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-none"
          >
            Comparisons
          </TabsTrigger>
        </TabsList>

        <TabsContent value="datasets" className="pt-4">
          <DatasetsTab />
        </TabsContent>
        
        <TabsContent value="experiments" className="pt-4">
          <ExperimentsTab />
        </TabsContent>
        
        <TabsContent value="comparisons" className="pt-4">
          <ComparisonsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardPage;
