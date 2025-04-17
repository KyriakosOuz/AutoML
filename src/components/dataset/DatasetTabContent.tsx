
import React, { useState } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { useDataset } from '@/contexts/DatasetContext';
import { datasetApi } from '@/lib/api';
import FileUpload from '@/components/dataset/FileUpload';
import DataPreview from '@/components/dataset/DataPreview';
import MissingValueHandler from '@/components/dataset/MissingValueHandler';
import FeatureSelector from '@/components/dataset/feature-importance/FeatureSelector';
import FeatureAnalyzer from '@/components/dataset/feature-importance/FeatureAnalyzer';
import SaveDatasetButton from '@/components/dataset/feature-importance/SaveDatasetButton';
import PreprocessingOptions from '@/components/dataset/PreprocessingOptions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface DatasetTabContentProps {
  activeTab: string;
  datasetId: string | null;
  targetColumn: string | null;
  taskType: string | null;
  processingStage: string | null;
  columnsToKeep: string[] | null;
  goToNextTab: () => void;
  formatTaskType: (type: string | null) => string;
}

const DatasetTabContent: React.FC<DatasetTabContentProps> = ({
  activeTab,
  datasetId,
  targetColumn,
  taskType,
  processingStage,
  columnsToKeep,
  goToNextTab,
  formatTaskType
}) => {
  const {
    previewColumns,
    setTargetColumn,
    setTaskType,
    setIsLoading,
    setError,
    setSelectedFeatures,
    setFeaturesAreSaved
  } = useDataset();
  
  const [isLoadingTaskType, setIsLoadingTaskType] = useState(false);
  const [taskTypeError, setTaskTypeError] = useState<string | null>(null);
  const [selectedFeatures, setLocalSelectedFeatures] = useState<string[]>([]);
  const [featuresAreSaved, setLocalFeaturesAreSaved] = useState(false);

  const handleTargetColumnChange = async (value: string) => {
    setTargetColumn(value);
    if (previewColumns) {
      setSelectedFeatures(prev => prev.filter(col => col !== value));
    }
    setFeaturesAreSaved(false);
    setTaskTypeError(null);
    if (datasetId) {
      setIsLoadingTaskType(true);
      try {
        const response = await datasetApi.detectTaskType(datasetId, value);
        
        let detectedTaskType = null;
        
        if (response && typeof response === 'object') {
          // Direct access to task_type property
          if (response.task_type) {
            detectedTaskType = response.task_type;
          }
          // Access via data property
          else if (response.data && response.data.task_type) {
            detectedTaskType = response.data.task_type;
          }
        } else if (typeof response === 'string') {
          try {
            // Try to parse string response as JSON
            const parsedResponse = JSON.parse(response);
            if (parsedResponse.task_type) {
              detectedTaskType = parsedResponse.task_type;
            } else if (parsedResponse.data && parsedResponse.data.task_type) {
              detectedTaskType = parsedResponse.data.task_type;
            }
          } catch (e) {
            // If parsing fails, use the string directly
            detectedTaskType = response.trim();
          }
        }
        
        console.log('Detected task type:', detectedTaskType);
        setTaskType(detectedTaskType);
      } catch (error) {
        console.error('Error detecting task type:', error);
        setTaskTypeError(error instanceof Error ? error.message : 'Failed to detect task type');
      } finally {
        setIsLoadingTaskType(false);
      }
    }
  };

  return (
    <>
      <TabsContent value="upload" className="space-y-4">
        <FileUpload onUploadSuccess={goToNextTab} />
      </TabsContent>
      
      <TabsContent value="explore" className="space-y-6">
        {datasetId && (
          <>
            <DataPreview />
            
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Select Target Column</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Select 
                      onValueChange={handleTargetColumnChange} 
                      value={targetColumn || undefined}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select target column" />
                      </SelectTrigger>
                      <SelectContent>
                        {previewColumns && previewColumns.map(column => (
                          <SelectItem key={column} value={column}>{column}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {targetColumn && taskType && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-md">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-blue-700 flex items-center">
                            <Info className="h-4 w-4 mr-2" />
                            Detected task type:
                          </div>
                          <Badge variant="secondary" className="ml-2 font-semibold">
                            {formatTaskType(taskType)}
                          </Badge>
                        </div>
                      </div>
                    )}
                    
                    {isLoadingTaskType && (
                      <div className="text-sm text-blue-600 mt-2 animate-pulse">
                        Detecting task type...
                      </div>
                    )}
                    
                    {taskTypeError && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertDescription>
                          {taskTypeError}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <MissingValueHandler onComplete={goToNextTab} />
          </>
        )}
      </TabsContent>
      
      <TabsContent value="features" className="space-y-6">
        {datasetId && targetColumn && (
          <>
            <FeatureAnalyzer 
              datasetId={datasetId} 
              targetColumn={targetColumn}
            />
            <SaveDatasetButton 
              onSaveComplete={goToNextTab} 
            />
          </>
        )}
      </TabsContent>
      
      <TabsContent value="preprocess" className="space-y-6">
        {datasetId && targetColumn && taskType && (
          <PreprocessingOptions 
            taskType={taskType}
          />
        )}
      </TabsContent>
    </>
  );
};

export default DatasetTabContent;
