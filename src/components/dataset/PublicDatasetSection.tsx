
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDataset } from '@/contexts/DatasetContext';
import { getWorkingAPIUrl, getAuthHeaders } from '@/lib/utils';
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Eye, Copy, Database } from 'lucide-react';

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

const PublicDatasetSection: React.FC = () => {
  const { toast } = useToast();
  const { resetState } = useDataset();
  const [selectedDataset, setSelectedDataset] = useState<PublicDataset | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [cloningDatasetId, setCloningDatasetId] = useState<string | null>(null);

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
        title: "Dataset Cloned",
        description: "The demo dataset has been cloned successfully and is ready to use.",
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

  return (
    <Card className="mb-8">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-2xl text-primary">
          <Database className="h-5 w-5" />
          Try with Demo Datasets
        </CardTitle>
        <CardDescription>
          Get started quickly with our pre-configured datasets for different machine learning tasks
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border border-gray-200">
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-16" />
                </CardHeader>
                <CardContent className="pb-0">
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
            ))}
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-red-500">Failed to load demo datasets</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2" 
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(publicDatasets || []).map((dataset) => (
              <Card key={dataset.id} className="border border-gray-200 hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-1">{dataset.dataset_name}</CardTitle>
                    <Badge variant={taskTypeBadgeVariant(dataset.task_type)}>
                      {formatTaskType(dataset.task_type)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-0">
                  <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">
                    {dataset.description || `Demo dataset for ${formatTaskType(dataset.task_type)} tasks.`}
                  </p>
                </CardContent>
                <CardFooter className="pt-4">
                  <div className="flex justify-between w-full items-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handlePreviewDataset(dataset)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                    <Button
                      onClick={() => handleCloneDataset(dataset.id)}
                      disabled={cloningDatasetId === dataset.id}
                      className="flex items-center gap-1"
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
            ))}
          </div>
        )}
      </CardContent>
      
      {/* Dataset Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedDataset?.dataset_name} - Preview
            </DialogTitle>
            <DialogDescription>
              Showing the first {previewData?.preview.length || 0} rows of the dataset
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-2 overflow-auto max-h-[400px]">
            {previewData ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    {previewData.columns.map((column) => (
                      <TableHead key={column}>{column}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.preview.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
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
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
              </div>
            )}
          </div>
          
          <DialogFooter className="mt-4">
            <Button onClick={handleClosePreview} variant="outline">Close</Button>
            <Button 
              onClick={() => {
                if (selectedDataset) {
                  handleClosePreview();
                  handleCloneDataset(selectedDataset.id);
                }
              }}
              disabled={!selectedDataset || cloningDatasetId === selectedDataset?.id}
            >
              {cloningDatasetId === selectedDataset?.id ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Cloning...
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
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
