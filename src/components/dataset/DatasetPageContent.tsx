
import React, { useState, useEffect } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Tabs } from '@/components/ui/tabs';
import DatasetHeader from '@/components/dataset/DatasetHeader';
import DatasetTabNavigation from '@/components/dataset/DatasetTabNavigation';
import DatasetTabContent from '@/components/dataset/DatasetTabContent';
import { datasetApi } from '@/lib/api';

const DatasetPageContent: React.FC = () => {
  const { user, signOut } = useAuth();
  const { 
    datasetId, 
    targetColumn, 
    taskType, 
    overview, 
    processingStage, 
    columnsToKeep,
    featureImportance,
    previewColumns,
  } = useDataset();
  
  const [activeTab, setActiveTab] = useState<string>("upload");
  const { toast } = useToast();
  
  const [hasInitializedTabs, setHasInitializedTabs] = useState(false);
  
  const getActiveStep = () => {
    if (!datasetId) return 0;
    if (!targetColumn) return 1;
    if (!taskType) return 2;
    return 3;
  };

  // Initialize tabs based on data state
  useEffect(() => {
    if (!hasInitializedTabs) {
      if (!datasetId) {
        setActiveTab("upload");
      } else if (datasetId && !targetColumn) {
        setActiveTab("explore");
      } else if (targetColumn && !columnsToKeep) {
        setActiveTab("features");
      } else if (columnsToKeep) {
        setActiveTab("preprocess");
      }
      setHasInitializedTabs(true);
    }
  }, [datasetId, targetColumn, taskType, hasInitializedTabs, columnsToKeep]);

  const isTabEnabled = (tabName: string): boolean => {
    if (tabName === "upload") return true;
    if (tabName === "explore") return !!datasetId;
    if (tabName === "features") {
      const hasNoMissingValues = overview && 
        (!overview.total_missing_values || overview.total_missing_values === 0);
      
      // Allow features tab access during 'cleaned' OR 'final' processing stages
      return !!datasetId && ((processingStage === 'cleaned' || processingStage === 'final') || hasNoMissingValues);
    }
    if (tabName === "preprocess") {
      // Allow preprocess tab to be enabled when there's a dataset, target column and features selected
      return !!datasetId && !!targetColumn && !!columnsToKeep && columnsToKeep.length > 0;
    }
    return false;
  };

  const handleTabChange = (value: string) => {
    if (isTabEnabled(value)) {
      setActiveTab(value);
    } else {
      let message = "You need to complete previous steps first:";
      if (value === "explore" && !datasetId) {
        message = "Please upload a dataset first";
      } else if (value === "features" && !isTabEnabled("features")) {
        message = "Please process missing values first";
      } else if (value === "preprocess" && !targetColumn) {
        message = "Please select a target column first";
      } else if (value === "preprocess" && (!columnsToKeep || columnsToKeep.length === 0)) {
        message = "Please select and save features first";
      }
      
      toast({
        title: "Tab disabled",
        description: message,
        variant: "destructive",
      });
    }
  };

  const goToNextTab = () => {
    if (activeTab === "upload" && datasetId) {
      setActiveTab("explore");
    } else if (activeTab === "explore" && isTabEnabled("features")) {
      setActiveTab("features");
    } else if (activeTab === "features" && isTabEnabled("preprocess")) {
      setActiveTab("preprocess");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-5xl mx-auto px-4">
        <DatasetHeader 
          user={user}
          signOut={signOut}
          activeStep={getActiveStep()}
          datasetId={datasetId}
          targetColumn={targetColumn}
          columnsToKeep={columnsToKeep}
        />
        
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <DatasetTabNavigation isTabEnabled={isTabEnabled} />
            
            <DatasetTabContent 
              activeTab={activeTab}
              datasetId={datasetId}
              targetColumn={targetColumn}
              taskType={taskType}
              processingStage={processingStage}
              columnsToKeep={columnsToKeep}
              goToNextTab={goToNextTab}
            />
          </Tabs>
        </div>
        
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>© 2025 AutoML Web App. Data processing powered by FastAPI.</p>
        </footer>
      </div>
    </div>
  );
};

export default DatasetPageContent;
