
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
import { useDataset } from '@/contexts/DatasetContext';

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
  // Get the featureImportance data from the DatasetContext
  const { featureImportance, overview } = useDataset();
  
  // Check if dataset has no missing values initially
  const hasNoMissingValues = overview && 
    (!overview.total_missing_values || overview.total_missing_values === 0);
  
  // Add console log to debug feature importance data
  console.log('Current tab:', activeTab);
  console.log('Feature importance data:', featureImportance);
  console.log('Target column:', targetColumn);
  
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
                className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white"
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
        {/* Show Next button if either there are no missing values initially or after processing */}
        {(processingStage === 'cleaned' || (datasetId && hasNoMissingValues)) && (
          <div className="flex justify-end mt-4">
            <Button 
              onClick={goToNextTab} 
              className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white"
            >
              Next: Feature Selection
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="features" className="pt-4">
        {/* Show feature importance chart if data is available */}
        {featureImportance && featureImportance.length > 0 ? (
          <FeatureImportanceChart featureImportance={featureImportance} />
        ) : (
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <p className="text-gray-600 mb-4">No feature importance data available yet.</p>
            <p className="text-sm text-gray-500">Select a target column and analyze feature importance to view this chart.</p>
          </div>
        )}
        <FeatureSelector />
        {processingStage === 'final' && (
          <div className="flex justify-end mt-6">
            <Button 
              onClick={goToNextTab} 
              className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white"
            >
              Next: Preprocess Dataset
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="preprocess" className="pt-4">
        <PreprocessingOptions />
        <DataPreview />
        {datasetId && targetColumn && taskType && (
          <div className="flex justify-end mt-8">
            <Link to="/training">
              <Button size="lg" className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white">
                <PlayCircle className="h-5 w-5" />
                Next: Train Model
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
