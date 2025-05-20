
import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose, DrawerFooter } from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Download, Info, BarChart2, Image, FileDown } from 'lucide-react';
import { ExperimentStatus, TrainingFile } from '@/types/training';
import { formatDateForGreece } from '@/lib/dateUtils';
import StatusBadge from '@/components/training/StatusBadge';
import { filterVisualizationFiles } from '@/utils/visualizationFilters';

interface ExperimentWithDataset {
  experiment_id?: string;
  experiment_name?: string;
  id?: string; // Added to match with experiments in ExperimentsTab
  status?: ExperimentStatus;
  training_type?: string;
  automl_engine?: string;
  created_at?: string;
  files?: TrainingFile[];
  configuration?: any;
  metrics?: Record<string, any>;
  dataset?: {
    dataset_id?: string;
    dataset_name?: string;
  };
}

interface ExperimentDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  experiment: ExperimentWithDataset | null;
}

const ExperimentDetailDrawer: React.FC<ExperimentDetailDrawerProps> = ({
  isOpen,
  onClose,
  experiment
}) => {
  const [activeTab, setActiveTab] = useState('info');

  if (!experiment) {
    return null;
  }

  // Using the shared utility to filter visualization files
  const visualizationFiles = filterVisualizationFiles(experiment.files || []);

  // Log visualization files to help with debugging
  console.log("[ExperimentDetailDrawer] Filtered visualization files:", 
    visualizationFiles.map(f => ({ 
      type: f.file_type, 
      name: f.file_name,
      url: f.file_url
    }))
  );

  // Helper function to format file names nicely
  const formatFileName = (fileName?: string, fileType?: string) => {
    if (!fileName && !fileType) return 'File';
    if (fileName) return fileName;
    return fileType ? fileType.replace(/_/g, ' ') : 'File';
  };

  // Helper function to determine the best download filename
  const getDownloadFileName = (file: any) => {
    if (file.file_name) return file.file_name;
    if (file.file_type) return `${file.file_type}.${getFileExtension(file.file_url)}`;
    return `file.${getFileExtension(file.file_url)}`;
  };

  // Helper function to get file extension from URL
  const getFileExtension = (url?: string) => {
    if (!url) return 'txt';
    const parts = url.split('.');
    return parts[parts.length - 1];
  };

  const modelFiles = (experiment.files || []).filter(file => 
    file.file_type?.includes('model') || 
    file.file_name?.toLowerCase().includes('model') || 
    file.file_url?.includes('model')
  );

  const csvFiles = (experiment.files || []).filter(file => 
    file.file_url?.toLowerCase().endsWith('.csv')
  );

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[95%]">
        <DrawerHeader className="border-b pb-4 mb-2">
          <DrawerTitle className="flex justify-between items-center">
            <span>{experiment.experiment_name || `Experiment ${experiment.experiment_id?.substring(0, 8)}`}</span>
            <DrawerClose className="rounded-full border">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DrawerClose>
          </DrawerTitle>
          <DrawerDescription>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2">
                <StatusBadge status={experiment.status as any} />
                <Badge variant="outline" className="bg-gray-100">
                  {experiment.training_type === 'automl' ? 'AutoML' : 'Custom Training'}
                </Badge>
                {experiment.automl_engine && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-800">
                    {experiment.automl_engine}
                  </Badge>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                Created {experiment.created_at ? formatDateForGreece(experiment.created_at) : 'recently'}
              </span>
            </div>
          </DrawerDescription>
        </DrawerHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="info" className="flex-1">
              <Info className="h-4 w-4 mr-2" />
              Info
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex-1">
              <BarChart2 className="h-4 w-4 mr-2" />
              Metrics
            </TabsTrigger>
            <TabsTrigger value="visuals" className="flex-1">
              <Image className="h-4 w-4 mr-2" />
              Visuals
            </TabsTrigger>
            <TabsTrigger value="download" className="flex-1">
              <FileDown className="h-4 w-4 mr-2" />
              Download
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="space-y-4 pb-8">
            <div className="space-y-2">
              <h4 className="font-medium">Experiment Details</h4>
              <div className="text-sm space-y-1">
                <div>
                  <span className="font-bold">Experiment ID:</span> {experiment.experiment_id}
                </div>
                <div>
                  <span className="font-bold">Dataset:</span> {experiment.dataset?.dataset_name}
                </div>
                <div>
                  <span className="font-bold">Created At:</span> {formatDateForGreece(experiment.created_at)}
                </div>
                <div>
                  <span className="font-bold">Training Type:</span> {experiment.training_type}
                </div>
                {experiment.automl_engine && (
                  <div>
                    <span className="font-bold">AutoML Engine:</span> {experiment.automl_engine}
                  </div>
                )}
              </div>
            </div>
            {experiment.configuration && (
              <div className="space-y-2">
                <h4 className="font-medium">Configuration</h4>
                <pre className="text-xs bg-gray-100 rounded p-2 overflow-x-auto">
                  {JSON.stringify(experiment.configuration, null, 2)}
                </pre>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="metrics" className="space-y-4 pb-8">
            {experiment.metrics && Object.keys(experiment.metrics).length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(experiment.metrics).map(([key, value]) => (
                  <Card key={key} className="border">
                    <CardContent className="p-3 text-center">
                      <div className="text-sm font-bold">{key}</div>
                      <div className="text-lg">{value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-1">No Metrics</h3>
                <p className="text-sm text-gray-500">
                  No metrics were found for this experiment.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="visuals" className="space-y-4 pb-8">
            {visualizationFiles && visualizationFiles.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {visualizationFiles.map((file, index) => (
                  <Card key={index} className="overflow-hidden border">
                    <CardContent className="p-2">
                      <div className="aspect-video bg-gray-50 rounded overflow-hidden relative">
                        <img 
                          src={file.file_url} 
                          alt={formatFileName(file.file_name, file.file_type)}
                          className="w-full h-full object-contain"
                        />
                        <a 
                          href={file.file_url}
                          download={getDownloadFileName(file)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute top-1 right-1 p-1 bg-white rounded-full shadow"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                      <div className="mt-2 text-xs font-medium text-center">
                        {formatFileName(file.file_name, file.file_type)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Image className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-1">No Visualizations</h3>
                <p className="text-sm text-gray-500">
                  No visualization files were found for this experiment.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="download" className="space-y-4 pb-8">
            {modelFiles && modelFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Model Files</h4>
                <div className="grid grid-cols-1 gap-2">
                  {modelFiles.map((file, index) => (
                    <Card key={index} className="border">
                      <CardContent className="flex items-center justify-between p-3">
                        <div className="text-sm font-medium">
                          {formatFileName(file.file_name, file.file_type)}
                        </div>
                        <Button variant="outline" size="sm">
                          <a
                            href={file.file_url}
                            download={getDownloadFileName(file)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {csvFiles && csvFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">CSV Files</h4>
                <div className="grid grid-cols-1 gap-2">
                  {csvFiles.map((file, index) => (
                    <Card key={index} className="border">
                      <CardContent className="flex items-center justify-between p-3">
                        <div className="text-sm font-medium">
                          {formatFileName(file.file_name, file.file_type)}
                        </div>
                        <Button variant="outline" size="sm">
                          <a
                            href={file.file_url}
                            download={getDownloadFileName(file)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {(!modelFiles || modelFiles.length === 0) && (!csvFiles || csvFiles.length === 0) && (
              <div className="text-center py-12">
                <FileDown className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-1">No Files</h3>
                <p className="text-sm text-gray-500">
                  No downloadable files were found for this experiment.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <DrawerFooter className="pt-2 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default ExperimentDetailDrawer;
