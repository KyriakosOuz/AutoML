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
    setFeatureImportance,
    previewColumns,
  } = useDataset();
  
  const [activeTab, setActiveTab] = useState<string>("upload");
  const { toast } = useToast();
  
  const [hasInitializedTabs, setHasInitializedTabs] = useState(false);
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  
  const getActiveStep = () => {
    if (!datasetId) return 0;
    if (!targetColumn) return 1;
    if (!taskType) return 2;
    return 3;
  };

  const loadFeatureImportanceData = async () => {
    if (!datasetId || !targetColumn) {
      console.log('Cannot load feature importance: missing datasetId or targetColumn');
      return;
    }
    
    if (loadingFeatures || (featureImportance && featureImportance.length > 0)) {
      console.log('Skipping feature importance load: already loading or have data');
      return;
    }
    
    console.log('Tab changed to features - ready for feature importance analysis');
  };

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

  useEffect(() => {
    if (activeTab === "features") {
      loadFeatureImportanceData();
    }
  }, [activeTab, datasetId, targetColumn]);

  const isTabEnabled = (tabName: string): boolean => {
    if (tabName === "upload") return true;
    if (tabName === "explore") return !!datasetId;
    if (tabName === "features") {
      const hasNoMissingValues = overview && 
        (!overview.total_missing_values || overview.total_missing_values === 0);
      return !!datasetId && (processingStage === 'cleaned' || hasNoMissingValues);
    }
    if (tabName === "preprocess") return !!datasetId && !!targetColumn && !!taskType && processingStage === 'final';
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
      } else if (value === "preprocess" && processingStage !== 'final') {
        message = "Please complete feature selection first";
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
      loadFeatureImportanceData();
    } else if (activeTab === "features" && processingStage === 'final') {
      setActiveTab("preprocess");
    }
  };

  const formatTaskType = (type: string | null): string => {
    if (!type) return '';
    
    if (type === 'binary_classification') return 'Binary Classification';
    if (type === 'multiclass_classification') return 'Multiclass Classification';
    if (type === 'regression') return 'Regression';
    
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
              formatTaskType={formatTaskType}
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
