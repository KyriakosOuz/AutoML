
import React from 'react';
import { useDashboard } from '@/contexts/DashboardContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardHeader from './DashboardHeader';
import DatasetsTab from './tabs/DatasetsTab';
import ExperimentsTab from './tabs/ExperimentsTab';
import ComparisonsTab from './tabs/ComparisonsTab';

const DashboardContent: React.FC = () => {
  const { activeTab, setActiveTab } = useDashboard();

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <DashboardHeader />
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="datasets">Datasets</TabsTrigger>
          <TabsTrigger value="experiments">Experiments</TabsTrigger>
          <TabsTrigger value="comparisons">Comparisons</TabsTrigger>
        </TabsList>
        
        <TabsContent value="datasets" className="mt-6">
          <DatasetsTab />
        </TabsContent>
        
        <TabsContent value="experiments" className="mt-6">
          <ExperimentsTab />
        </TabsContent>
        
        <TabsContent value="comparisons" className="mt-6">
          <ComparisonsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardContent;
