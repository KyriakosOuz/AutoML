
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, PlayCircle, Info, AlertCircle, BarChart, Sparkles, Filter } from 'lucide-react';
import FileUpload from '@/components/dataset/FileUpload';
import DataPreview from '@/components/dataset/DataPreview';
import MissingValueHandler from '@/components/dataset/MissingValueHandler';
import FeatureImportanceChart from '@/components/dataset/feature-importance/FeatureImportanceChart';
import FeatureSelector from '@/components/dataset/feature-importance/FeatureSelector';
import SaveDatasetButton from '@/components/dataset/feature-importance/SaveDatasetButton';
import PreprocessingOptions from '@/components/dataset/PreprocessingOptions';
import { TabsContent } from '@/components/ui/tabs';
import { useDataset } from '@/contexts/DatasetContext';
import { datasetApi } from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DatasetTabContent from './DatasetTabContent';
import DatasetHeader from './DatasetHeader';

const DatasetPageContent: React.FC = () => {
  const { 
    datasetId, 
    targetColumn, 
    taskType, 
    columnsToKeep, 
    processingStage,
  } = useDataset();

  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('upload');

  // Initialize tab based on processingStage when component mounts
  useEffect(() => {
    if (processingStage === 'processed') {
      setActiveTab('preprocess');
    } else if (processingStage === 'final' && activeTab !== 'preprocess') {
      setActiveTab('preprocess');
    } else if (processingStage === 'cleaned' && activeTab === 'upload') {
      setActiveTab('explore');
    } else if (!processingStage && datasetId) {
      setActiveTab('upload');
    }
  }, [processingStage, datasetId]);

  const goToNextTab = () => {
    if (activeTab === 'upload') {
      setActiveTab('explore');
    } else if (activeTab === 'explore') {
      setActiveTab('features');
    } else if (activeTab === 'features') {
      setActiveTab('preprocess');
    }
  };

  const isTabEnabled = (tabName: string): boolean => {
    if (tabName === 'upload') return true;
    if (tabName === 'explore') return !!datasetId;
    if (tabName === 'features') return !!datasetId && (processingStage === 'cleaned' || processingStage === 'final' || processingStage === 'processed');
    if (tabName === 'preprocess') return !!datasetId && !!targetColumn && !!taskType && !!columnsToKeep && columnsToKeep.length > 0;
    return false;
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger 
            value="upload" 
            data-value="upload"
            disabled={false}
            className="text-sm md:text-base"
          >
            1. Upload Data
          </TabsTrigger>
          <TabsTrigger 
            value="explore" 
            data-value="explore"
            disabled={!isTabEnabled('explore')}
            className="text-sm md:text-base"
          >
            2. Explore Data
          </TabsTrigger>
          <TabsTrigger 
            value="features" 
            data-value="features"
            disabled={!isTabEnabled('features')}
            className="text-sm md:text-base"
          >
            3. Select Features
          </TabsTrigger>
          <TabsTrigger 
            value="preprocess" 
            data-value="preprocess"
            disabled={!isTabEnabled('preprocess')}
            className="text-sm md:text-base"
          >
            4. Preprocess
          </TabsTrigger>
        </TabsList>

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
  );
};

export default DatasetPageContent;
