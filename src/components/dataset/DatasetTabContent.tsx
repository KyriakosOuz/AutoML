
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, PlayCircle } from 'lucide-react';
import FileUpload from '@/components/dataset/FileUpload';
import DataPreview from '@/components/dataset/DataPreview';
import MissingValueHandler from '@/components/dataset/MissingValueHandler';
import FeatureImportanceChart from '@/components/dataset/FeatureImportanceChart';
import FeatureSelector from '@/components/dataset/FeatureSelector';
import PreprocessingOptions from '@/components/dataset/PreprocessingOptions';
import { TabsContent } from '@/components/ui/tabs';

interface TabContentProps {
  activeTab: string;
  datasetId: string | null;
  targetColumn: string | null;
  taskType: string | null;
  processingStage: string | null;
  columnsToKeep: string[] | null;
  goToNextTab: () => void;
  formatTaskType: (type: string | null) => string;
}

const DatasetTabContent: React.FC<TabContentProps> = ({
  activeTab,
  datasetId,
  targetColumn,
  taskType,
  processingStage,
  columnsToKeep,
  goToNextTab,
  formatTaskType,
}) => {
  return (
    <>
      <TabsContent value="upload" className="pt-4">
        <FileUpload />
        {datasetId && (
          <>
            <DataPreview />
            <div className="flex justify-end mt-4">
              <Button 
                onClick={goToNextTab} 
                className="flex items-center gap-2"
              >
                Next: Explore Data
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </TabsContent>
      
      <TabsContent value="explore" className="pt-4">
        <MissingValueHandler />
        <DataPreview />
        {processingStage === 'cleaned' && (
          <div className="flex justify-end mt-4">
            <Button 
              onClick={goToNextTab} 
              className="flex items-center gap-2"
            >
              Next: Select Features
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="features" className="pt-4">
        <FeatureImportanceChart />
        {targetColumn && taskType && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-6">
            <h4 className="font-medium text-blue-800 mb-2">Selected Target & Task Type</h4>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md flex items-center">
                <span className="font-medium mr-1">Target:</span> {targetColumn}
              </div>
              <div className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-md flex items-center">
                <span className="font-medium mr-1">Task Type:</span> {formatTaskType(taskType)}
              </div>
            </div>
          </div>
        )}
        <FeatureSelector />
        {processingStage === 'final' && (
          <div className="mt-6">
            <DataPreview />
            <div className="flex justify-end mt-6">
              <Button 
                onClick={goToNextTab} 
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
              >
                Continue to Preprocessing
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="preprocess" className="pt-4">
        <PreprocessingOptions />
        <DataPreview />
        {datasetId && targetColumn && taskType && (
          <div className="flex justify-end mt-8">
            <Link to="/training">
              <Button size="lg" className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700">
                <PlayCircle className="h-5 w-5" />
                Continue to Model Training
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </TabsContent>
    </>
  );
};

export default DatasetTabContent;
