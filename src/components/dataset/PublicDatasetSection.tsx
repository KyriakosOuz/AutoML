
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDataset } from '@/contexts/DatasetContext';
import { getWorkingAPIUrl, getAuthHeaders, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Loader2, 
  Eye, 
  Copy, 
  Database, 
  BarChart2, 
  PieChart,
  LineChart,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

interface PublicDataset {
  id: string;
  dataset_name: string;
  task_type: string;
  created_at: string;
  description?: string;
  is_public: boolean;
}

interface PreviewData {
  columns: string[];
  preview: Record<string, any>[];
}

const taskTypeBadgeVariant = (type: string) => {
  switch (type) {
    case 'binary_classification':
      return 'automl';
    case 'multiclass_classification':
      return 'custom';
    case 'regression':
      return 'prediction';
    default:
      return 'secondary';
  }
};

const formatTaskType = (type: string): string => {
  if (!type) return "Unknown";
  
  switch(type) {
    case 'binary_classification':
      return "Binary";
    case 'multiclass_classification':
      return "Multiclass";
    case 'regression':
      return "Regression";
    default:
      return type
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
  }
};

const TaskTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'binary_classification':
      return <PieChart className="h-5 w-5 text-blue-600" />;
    case 'multiclass_classification':
      return <BarChart2 className="h-5 w-5 text-orange-600" />;
    case 'regression':
      return <LineChart className="h-5 w-5 text-purple-600" />;
    default:
      return <Database className="h-5 w-5 text-gray-600" />;
  }
};

const DatasetSkeleton = () => (
  <Card className="border border-gray-200 h-[240px]">
    <CardHeader>
      <div className="flex justify-between items-start">
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-16" />
      </div>
    </CardHeader>
    <CardContent className="pb-0">
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4" />
    </CardContent>
    <CardFooter>
      <div className="flex justify-between w-full pt-4">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-32" />
      </div>
    </CardFooter>
  </Card>
);

// Card animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: "easeOut"
    }
  })
};

const PublicDatasetSection: React.FC = () => {
  const { toast } = useToast();
  const { resetState } = useDataset();
  const [selectedDataset, setSelectedDataset] = useState<PublicDataset | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [cloningDatasetId, setCloningDatasetId] = useState<string | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'data' | 'info'>('data');

  // Fetch datasets and filter to find public ones
  const { data: allDatasets, isLoading, error } = useQuery({
    queryKey: ['allDatasets'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const apiUrl = await getWorkingAPIUrl();
      console.log("[Datasets] Calling:", `${apiUrl}/dataset-management/list-datasets/`);
      
      const response = await fetch(`${apiUrl}/dataset-management/list-datasets/`, {
        headers
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Datasets fetch error:', errorText);
        throw new Error('Failed to load datasets');
      }
      
      const data = await response.json();
      // Filter to get only public datasets
      const publicDatasets = data.data.datasets.filter(
        (dataset: PublicDataset) => dataset.is_public === true
      );
      
      return publicDatasets;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Handle dataset preview
  const handlePreviewDataset = async (dataset: PublicDataset) => {
    try {
      setSelectedDataset(dataset);
      setIsPreviewOpen(true);
      setActivePreviewTab('data');
      
      const headers = await getAuthHeaders();
      const apiUrl = await getWorkingAPIUrl();
      console.log("[Preview] Calling:", `${apiUrl}/dataset-management/preview-dataset/${dataset.id}?stage=raw`);
      
      const response = await fetch(`${apiUrl}/dataset-management/preview-dataset/${dataset.id}?stage=raw`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load dataset preview`);
      }
      
      const data = await response.json();
      setPreviewData(data.data);
    } catch (error) {
      console.error('Error fetching dataset preview:', error);
      toast({
        title: "Preview Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
      setIsPreviewOpen(false);
    }
  };

  // Handle dataset cloning
  const handleCloneDataset = async (datasetId: string) => {
    try {
      setCloningDatasetId(datasetId);
      
      const headers = await getAuthHeaders();
      const apiUrl = await getWorkingAPIUrl();
      console.log("[Clone] Calling:", `${apiUrl}/dataset-management/clone-dataset/${datasetId}`);
      
      const response = await fetch(`${apiUrl}/dataset-management/clone-dataset/${datasetId}`, {
        method: 'POST',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Failed to clone dataset`);
      }
      
      const data = await response.json();
      const newDatasetId = data.data.new_dataset_id || data.new_dataset_id;
      
      // Reset dataset state to ensure clean slate for the newly cloned dataset
      resetState();
      
      // Refresh cached data, this will trigger a refetch of datasets in DatasetsTab
      // when the user navigates there
      await fetch(`${apiUrl}/dataset-management/list-datasets/`, {
        headers,
        method: 'GET',
        cache: 'reload'
      });
      
      toast({
        title: "Dataset Cloned Successfully",
        description: "Demo dataset has been added to your collection",
        variant: "default"
      });
      
      // Redirect to the dataset page with the new ID
      window.location.href = `/dataset?id=${newDatasetId}`;
    } catch (error) {
      console.error('Error cloning dataset:', error);
      toast({
        title: "Cloning Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setCloningDatasetId(null);
    }
  };

  // Close the preview dialog
  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setSelectedDataset(null);
    setPreviewData(null);
  };

  const publicDatasets = allDatasets || [];

  // Helper function to generate dataset initials for avatar
  const getDatasetInitials = (name: string): string => {
    return name
      .split(/\s+/)
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get color based on task type
  const getTaskTypeColor = (type: string): string => {
    switch (type) {
      case 'binary_classification':
        return 'bg-blue-100 text-blue-800';
      case 'multiclass_classification':
        return 'bg-orange-100 text-orange-800';
      case 'regression':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="mb-8 border-0 shadow-md bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-4 border-b bg-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-2xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          <Database className="h-6 w-6 text-blue-600" />
          Try with Demo Datasets
        </CardTitle>
        <CardDescription className="text-base text-gray-600">
          Get started quickly with pre-configured datasets for different machine learning tasks
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <DatasetSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center bg-red-50 rounded-lg">
            <p className="text-red-600 mb-3">Unable to load demo datasets</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-red-300 hover:bg-red-50" 
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(publicDatasets || []).map((dataset, index) => (
              <motion.div
                key={dataset.id}
                custom={index}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
              >
                <Card className="border border-gray-200 hover:border-primary/40 hover:shadow-lg transition-all duration-300 h-full flex flex-col bg-white overflow-hidden group">
                  <CardHeader className="pb-2 border-b border-gray-100">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg line-clamp-1 font-medium">{dataset.dataset_name}</CardTitle>
                      <Badge 
                        variant={taskTypeBadgeVariant(dataset.task_type)}
                        className="transition-transform group-hover:scale-105"
                      >
                        {formatTaskType(dataset.task_type)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-0 pt-4 flex-grow">
                    <div className="flex items-center gap-2 mb-3">
                      <Avatar className={cn("h-8 w-8", getTaskTypeColor(dataset.task_type))}>
                        <AvatarFallback className="text-xs">
                          <TaskTypeIcon type={dataset.task_type} />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{formatTaskType(dataset.task_type)} Dataset</span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">
                      {dataset.description || `Demo dataset for ${formatTaskType(dataset.task_type)} machine learning tasks.`}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-4 mt-auto">
                    <div className="flex justify-between w-full items-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handlePreviewDataset(dataset)}
                        className="flex items-center gap-1 hover:bg-gray-100"
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                      <Button
                        onClick={() => handleCloneDataset(dataset.id)}
                        disabled={cloningDatasetId === dataset.id}
                        className="flex items-center gap-1 shadow-sm group-hover:shadow-md transition-shadow"
                      >
                        {cloningDatasetId === dataset.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Cloning...
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Use this Dataset
                          </>
                        )}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
      
      {/* Enhanced Dataset Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedDataset && <TaskTypeIcon type={selectedDataset.task_type} />}
              {selectedDataset?.dataset_name} - Preview
            </DialogTitle>
            <DialogDescription className="flex gap-2 items-center text-sm">
              <Badge variant="outline">
                {formatTaskType(selectedDataset?.task_type || '')}
              </Badge>
              {previewData && (
                <span className="text-muted-foreground">
                  {previewData.preview.length} of {previewData.preview.length} rows
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex border-b mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActivePreviewTab('data')}
              className={cn(
                "rounded-none border-b-2 mr-2", 
                activePreviewTab === 'data' 
                  ? "border-primary text-primary" 
                  : "border-transparent"
              )}
            >
              Data Preview
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActivePreviewTab('info')}
              className={cn(
                "rounded-none border-b-2", 
                activePreviewTab === 'info' 
                  ? "border-primary text-primary" 
                  : "border-transparent"
              )}
            >
              Dataset Info
            </Button>
          </div>
          
          {activePreviewTab === 'data' && (
            <div className="mt-2 overflow-auto max-h-[400px]">
              {previewData ? (
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      {previewData.columns.map((column) => (
                        <TableHead key={column} className="font-medium">
                          {column}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.preview.map((row, rowIndex) => (
                      <TableRow 
                        key={rowIndex} 
                        className={cn(
                          rowIndex % 2 === 0 ? "bg-white" : "bg-muted/20",
                          "hover:bg-blue-50/40 transition-colors"
                        )}
                      >
                        {previewData.columns.map((column) => (
                          <TableCell key={`${rowIndex}-${column}`}>
                            {String(row[column] ?? '')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col justify-center items-center h-32 gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                  <p className="text-muted-foreground">Loading dataset preview...</p>
                </div>
              )}
            </div>
          )}
          
          {activePreviewTab === 'info' && selectedDataset && (
            <div className="p-4 bg-muted/10 rounded-md">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2 text-sm text-muted-foreground">Dataset Details</h3>
                  <dl className="space-y-2">
                    <div className="grid grid-cols-2 gap-1">
                      <dt className="text-sm font-medium">Name:</dt>
                      <dd className="text-sm">{selectedDataset.dataset_name}</dd>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <dt className="text-sm font-medium">Task Type:</dt>
                      <dd className="text-sm">{formatTaskType(selectedDataset.task_type)}</dd>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <dt className="text-sm font-medium">Created:</dt>
                      <dd className="text-sm">{new Date(selectedDataset.created_at).toLocaleDateString()}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2 text-sm text-muted-foreground">Description</h3>
                  <p className="text-sm bg-white p-3 rounded border">
                    {selectedDataset.description || 
                      `This is a demo dataset for ${formatTaskType(selectedDataset.task_type)} 
                      machine learning tasks. It contains pre-processed data ready for model training.`}
                  </p>
                </div>
              </div>
              
              {previewData?.columns && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2 text-sm text-muted-foreground">Columns ({previewData.columns.length})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {previewData.columns.map((column) => (
                      <div key={column} className="bg-white p-2 rounded border text-xs">
                        {column}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="mt-4 gap-2">
            <Button onClick={handleClosePreview} variant="outline">
              Close
            </Button>
            <Button 
              onClick={() => {
                if (selectedDataset) {
                  handleClosePreview();
                  handleCloneDataset(selectedDataset.id);
                }
              }}
              disabled={!selectedDataset || cloningDatasetId === selectedDataset?.id}
              className="gap-2"
            >
              {cloningDatasetId === selectedDataset?.id ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cloning...
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Use this Dataset
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PublicDatasetSection;
