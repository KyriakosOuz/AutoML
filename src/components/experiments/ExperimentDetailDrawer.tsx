
import React from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { ExperimentResults, ExperimentStatus } from '@/types/training';
import StatusBadge from '../training/StatusBadge';
import { filterVisualizationFiles } from '@/utils/visualizationFilters';

// Updated interface to use ExperimentResults as base
export interface ExperimentWithDataset extends ExperimentResults {
  dataset_name?: string;
}

export interface ExperimentDetailDrawerProps {
  experiment: ExperimentWithDataset;
  isOpen: boolean;
  onClose: () => void;
}

const ExperimentDetailDrawer: React.FC<ExperimentDetailDrawerProps> = ({
  experiment,
  isOpen,
  onClose
}) => {
  // Use the filterVisualizationFiles utility
  const visualizationFiles = experiment.files ? filterVisualizationFiles(experiment.files) : [];

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center justify-between">
            <span>Experiment Details</span>
            <StatusBadge status={experiment.status} />
          </DrawerTitle>
          <DrawerDescription>
            {experiment.experiment_name || `Experiment ${experiment.experimentId?.substring(0, 8)}`}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Dataset</p>
              <p>{experiment.dataset_name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p>{experiment.created_at ? `${formatDistanceToNow(new Date(experiment.created_at))} ago` : 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Algorithm</p>
              <p>{experiment.algorithm || experiment.automl_engine || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Target</p>
              <p>{experiment.target_column || 'Unknown'}</p>
            </div>
          </div>
          
          <Tabs defaultValue="visualizations">
            <TabsList className="w-full">
              <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
            </TabsList>
            <TabsContent value="visualizations" className="space-y-4 mt-2">
              {visualizationFiles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {visualizationFiles.map((file, index) => (
                    <div key={index} className="border rounded-md overflow-hidden">
                      <div className="p-2 bg-muted text-xs font-medium">
                        {file.file_type?.replace(/_/g, ' ')}
                      </div>
                      <img 
                        src={file.file_url} 
                        alt={file.file_type || 'Visualization'} 
                        className="w-full h-auto"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No visualizations available</p>
              )}
            </TabsContent>
            <TabsContent value="metrics" className="mt-2">
              {experiment.metrics ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {Object.entries(experiment.metrics).map(([key, value]) => {
                    if (typeof value === 'object') return null;
                    return (
                      <div key={key} className="border rounded-md p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          {key.replace(/_/g, ' ')}
                        </p>
                        <p className="font-medium">
                          {typeof value === 'number' && value >= 0 && value <= 1 
                            ? `${(value * 100).toFixed(2)}%` 
                            : String(value)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No metrics available</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        <DrawerFooter>
          <Button onClick={onClose} variant="outline">Close</Button>
          <Button asChild>
            <a href={`/results/${experiment.experimentId}`} target="_blank" rel="noreferrer">
              View Full Results
            </a>
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default ExperimentDetailDrawer;
