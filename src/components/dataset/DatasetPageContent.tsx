
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, PlayCircle, Info } from 'lucide-react';
import FileUpload from '@/components/dataset/FileUpload';
import DataPreview from '@/components/dataset/DataPreview';
import MissingValueHandler from '@/components/dataset/MissingValueHandler';
import FeatureImportanceChart from '@/components/dataset/feature-importance/FeatureImportanceChart';
import FeatureSelector from '@/components/dataset/feature-importance/FeatureSelector';
import FeatureAnalyzer from '@/components/dataset/feature-importance/FeatureAnalyzer';
import SaveDatasetButton from '@/components/dataset/feature-importance/SaveDatasetButton';
import PreprocessingOptions from '@/components/dataset/PreprocessingOptions';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useDataset } from '@/contexts/DatasetContext';
import { useState, useEffect } from 'react';
import { datasetApi } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import DatasetHeader from '@/components/dataset/DatasetHeader';
import DatasetTabNavigation from '@/components/dataset/DatasetTabNavigation';
import DatasetTabContent from '@/components/dataset/DatasetTabContent';

interface DatasetPageContentProps {
  formatTaskType: (type: string | null) => string;
}

const DatasetPageContent: React.FC<DatasetPageContentProps> = ({ formatTaskType }) => {
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
    } else if (activeTab === "features" && processingStage === 'final') {
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
