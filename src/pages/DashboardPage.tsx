
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import DatasetsTab from '@/components/dashboard/DatasetsTab';
import ExperimentsTab from '@/components/dashboard/ExperimentsTab';
import ComparisonsTab from '@/components/dashboard/ComparisonsTab';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("datasets");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            {user && (
              <div className="text-sm text-gray-600">
                Welcome, {user.email}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 w-full max-w-md mb-8">
            <TabsTrigger value="datasets">Datasets</TabsTrigger>
            <TabsTrigger value="experiments">Experiments</TabsTrigger>
            <TabsTrigger value="comparisons">Comparisons</TabsTrigger>
          </TabsList>
          
          <TabsContent value="datasets" className="space-y-4">
            <DatasetsTab />
          </TabsContent>
          
          <TabsContent value="experiments" className="space-y-4">
            <ExperimentsTab />
          </TabsContent>
          
          <TabsContent value="comparisons" className="space-y-4">
            <ComparisonsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DashboardPage;
