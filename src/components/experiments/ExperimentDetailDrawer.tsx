import React, { useState } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button'; 
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { X, Download } from 'lucide-react';
import { ExperimentResults, ExperimentStatus } from '@/types/training';
import { formatDate } from '@/lib/dateUtils';
import StatusBadge from '@/components/training/StatusBadge';
import ClassificationReportTable from '@/components/training/ClassificationReportTable';
import MetricsDisplay from '@/components/results/MetricsDisplay';
import ModelSummary from '@/components/results/ModelSummary';
import { filterVisualizationFiles } from '@/utils/visualizationFilters';
import MLJARVisualizations from '@/components/results/MLJARVisualizations';

interface ExperimentDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  experimentId: string | null;
  status: ExperimentStatus;
  results: ExperimentResults | null;
}

const ExperimentDetailDrawer: React.FC<ExperimentDetailDrawerProps> = ({
  isOpen,
  onClose,
  experimentId,
  status,
  results
}) => {
  const [activeTab, setActiveTab] = useState('summary');
  
  // Check if this is a MLJAR experiment
  const isMljarExperiment = results?.automl_engine === 'mljar';

  // Use the shared utility function to filter visualization files for all cases
  const visualizationFiles = results?.files ? filterVisualizationFiles(results.files) : [];
  
  console.log("[ExperimentDetailDrawer] Filtered visualization files:", 
    visualizationFiles.map(f => ({ 
      type: f.file_type, 
      name: f.file_name,
      url: f.file_url,
      curve_subtype: f.curve_subtype
    }))
  );

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">
        <SheetHeader className="pb-4 relative">
          <SheetTitle className="text-left">
            {results?.model_display_name || `Experiment ${experimentId?.substring(0, 8)}`}
            <StatusBadge status={status} className="ml-2" />
          </SheetTitle>
          <SheetDescription className="text-left">
            {experimentId && <span className="block">ID: {experimentId}</span>}
            {results?.created_at && <span className="block">Created: {formatDate(results.created_at)}</span>}
          </SheetDescription>
          <SheetClose className="absolute right-0 top-0" asChild>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </SheetClose>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            {visualizationFiles.length > 0 && (
              <TabsTrigger value="visuals">Visuals</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="summary">
            {results && <ModelSummary results={results} />}
          </TabsContent>
          
          <TabsContent value="metrics">
            {results && (
              <>
                <MetricsDisplay results={results} />
                
                {results.classification_report && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Classification Report</h3>
                    <ClassificationReportTable report={results.classification_report} />
                  </div>
                )}
              </>
            )}
          </TabsContent>
          
          {visualizationFiles.length > 0 && (
            <TabsContent value="visuals">
              {isMljarExperiment ? (
                <MLJARVisualizations files={visualizationFiles} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {visualizationFiles.map((file, index) => (
                    <VisualizationCard key={index} file={file} />
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

// Helper component for visualizations
const VisualizationCard = ({ file }: { file: any }) => {
  const getVisualizationName = () => {
    // First check for curve subtype
    if (file.curve_subtype) {
      if (file.curve_subtype === 'roc') return 'ROC Curve';
      if (file.curve_subtype === 'precision_recall') return 'Precision-Recall Curve';
      if (file.curve_subtype === 'calibration') return 'Calibration Curve';
    }
    
    const fileName = file.file_name || file.file_url.split('/').pop() || '';
    const fileType = file.file_type || '';
    
    if (fileName.includes('learning_curve') || fileName.includes('learning_curves')) {
      return 'Learning Curve';
    }
    if (fileName.includes('roc_curve') || fileType.includes('roc_curve')) {
      return 'ROC Curve';
    }
    if (fileName.includes('precision_recall') || fileType.includes('precision_recall')) {
      return 'Precision-Recall Curve';
    }
    if (fileName.includes('confusion_matrix') || fileType.includes('confusion_matrix')) {
      return fileType.includes('normalized') ? 'Normalized Confusion Matrix' : 'Confusion Matrix';
    }
    if (fileName.includes('feature_importance') || fileType.includes('importance')) {
      return 'Feature Importance';
    }
    
    return fileName
      .replace(/[_-]/g, ' ')
      .replace(/\.png$/, '')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Use the same dialog pattern as in MLJARVisualizations, including the sr-only DialogTitle
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="cursor-pointer border rounded-md p-4 hover:bg-gray-50 transition-colors">
          <div className="aspect-video bg-gray-100 flex items-center justify-center relative overflow-hidden mb-2">
            <img 
              src={file.file_url} 
              alt={getVisualizationName()}
              className="object-contain w-full h-full"
            />
          </div>
          <p className="text-sm text-center">{getVisualizationName()}</p>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogTitle className="sr-only">
          {getVisualizationName()}
        </DialogTitle>
        <div className="p-4">
          <img 
            src={file.file_url} 
            alt={getVisualizationName()}
            className="w-full rounded-md mb-4"
          />
          <div className="flex justify-between items-center">
            <h3 className="font-medium">{getVisualizationName()}</h3>
            <Button variant="outline" size="sm" asChild>
              <a 
                href={file.file_url} 
                download={file.file_name || `${getVisualizationName()}.png`}
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExperimentDetailDrawer;
