
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import DatasetsTab from '@/components/dashboard/DatasetsTab';
import ExperimentsTab from '@/components/dashboard/ExperimentsTab';
import ComparisonsTab from '@/components/dashboard/ComparisonsTab';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

const DashboardPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("datasets");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <DashboardHeader user={user} signOut={signOut} />
        
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 mb-8">
            <TabsTrigger value="datasets" className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              Datasets
            </TabsTrigger>
            <TabsTrigger value="experiments" className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              Experiments
            </TabsTrigger>
            <TabsTrigger value="comparisons" className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              Comparisons
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-4 space-y-4">
            <TabsContent value="datasets">
              <DatasetsTab />
            </TabsContent>
            
            <TabsContent value="experiments">
              <ExperimentsTab />
            </TabsContent>
            
            <TabsContent value="comparisons">
              <ComparisonsTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardPage;
