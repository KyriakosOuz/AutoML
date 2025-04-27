
import React, { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DatasetsTab from '@/components/dashboard/DatasetsTab';
import ExperimentsTab from '@/components/dashboard/ExperimentsTab';
import ComparisonsTab from '@/components/dashboard/ComparisonsTab';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('datasets');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <div className="py-8 container max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Dashboard</h1>
          <p className="text-gray-600 max-w-2xl">
            View and manage all your datasets, experiments, and comparisons in one place.
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100">
          <TabsTrigger 
            value="datasets" 
            className="data-[state=active]:bg-black data-[state=active]:text-white"
          >
            Datasets
          </TabsTrigger>
          <TabsTrigger 
            value="experiments" 
            className="data-[state=active]:bg-black data-[state=active]:text-white"
          >
            Experiments
          </TabsTrigger>
          <TabsTrigger 
            value="comparisons" 
            className="data-[state=active]:bg-black data-[state=active]:text-white"
          >
            Comparisons
          </TabsTrigger>
        </TabsList>

        <TabsContent value="datasets" className="pt-4">
          <DatasetsTab key={`datasets-${refreshTrigger}`} />
        </TabsContent>
        
        <TabsContent value="experiments" className="pt-4">
          <ExperimentsTab key={`experiments-${refreshTrigger}`} />
        </TabsContent>
        
        <TabsContent value="comparisons" className="pt-4">
          <ComparisonsTab key={`comparisons-${refreshTrigger}`} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardPage;
