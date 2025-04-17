
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
    setFeatureImportance
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
    
    // Skip if already loading or if we already have data
    if (loadingFeatures || (featureImportance && featureImportance.length > 0)) {
      console.log('Skipping feature importance load: already loading or have data');
      return;
    }
    
    try {
      console.log('Loading feature importance data...');
      setLoadingFeatures(true);
      
      const response = await datasetApi.featureImportancePreview(datasetId, targetColumn);
      console.log('Feature importance API response:', response);
      
      if (response && response.data && response.data.feature_importance) {
        // For API response with nested data structure
        setFeatureImportance(response.data.feature_importance);
        console.log('Feature importance set from nested data:', response.data.feature_importance);
      } else if (response && response.feature_importance) {
        // For API response with direct data structure
        setFeatureImportance(response.feature_importance);
        console.log('Feature importance set from direct data:', response.feature_importance);
      } else {
        console.error('Invalid feature importance data format:', response);
        toast({
          title: "Warning",
          description: "Feature importance data format is unexpected",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading feature importance data:', error);
      toast({
        title: "Error",
        description: "Failed to load feature importance data",
        variant: "destructive",
      });
    } finally {
      setLoadingFeatures(false);
    }
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

  // Add an effect to reload feature importance if needed when target column changes
  useEffect(() => {
    if (targetColumn && activeTab === "features" && (!featureImportance || featureImportance.length === 0)) {
      loadFeatureImportanceData();
    }
  }, [targetColumn]);

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
