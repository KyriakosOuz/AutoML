import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuthHeaders, handleApiResponse, getWorkingAPIUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useDatasetDownload } from '@/hooks/useDatasetDownload';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Download, 
  Trash2, 
  AlertCircle,
  DownloadCloud,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Dataset {
  id: string;
  dataset_name: string;
  created_at: string;
  has_raw: boolean;
  has_cleaned: boolean;
  has_final: boolean;
  has_processed: boolean;
  is_public?: boolean;
}

interface PreviewData {
  stage: string;
  preview: Record<string, any>[];
  columns: string[];
}

const DatasetsTab: React.FC = () => {
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [previewStage, setPreviewStage] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const { downloadDataset } = useDatasetDownload();

  // Confirm API URL on component mount
  useEffect(() => {
    const confirmApiUrl = async () => {
      const apiUrl = await getWorkingAPIUrl();
      console.log("🔄 DatasetsTab confirmed API URL:", apiUrl);
      if (!apiUrl.includes("localhost") && !apiUrl.includes("127.0.0.1")) {
        console.warn("⚠️ Not using localhost development URL!");
      }
    };
    
    confirmApiUrl();
  }, []);

  const { data: datasetsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['datasets'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const apiUrl = await getWorkingAPIUrl();
      console.log("🌍 API base:", apiUrl);
      console.log("[Datasets] Calling:", `${apiUrl}/dataset-management/list-datasets/`);
      const response = await fetch(`${apiUrl}/dataset-management/list-datasets/`, {
        headers
      });
      return handleApiResponse<{ datasets: Dataset[] }>(response);
    },
  });

  // Filter out public datasets that don't belong to user
  const userDatasets = datasetsData?.data.datasets.filter(dataset => !dataset.is_public) || [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handlePreviewDataset = async (dataset: Dataset, stage: string) => {
    setSelectedDataset(dataset);
    setPreviewStage(stage);
    setIsPreviewLoading(true);
    
    try {
      const headers = await getAuthHeaders();
      const apiUrl = await getWorkingAPIUrl();
      console.log("[Preview] Calling:", `${apiUrl}/dataset-management/preview-dataset/${dataset.id}?stage=${stage}`);
      
      const response = await fetch(`${apiUrl}/dataset-management/preview-dataset/${dataset.id}?stage=${stage}`, {
        headers
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Preview error response:', errorText);
        throw new Error(`Failed to load ${stage} dataset preview`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Expected JSON but received:', contentType);
        throw new Error('Server returned invalid content type. Expected JSON.');
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
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const getDownloadUrl = async (dataset: Dataset, stage: string) => {
    const apiUrl = await getWorkingAPIUrl();
    return `${apiUrl}/dataset-management/download/${dataset.id}?stage=${stage}`;
  };

  const openDeleteDialog = (datasetId: string) => {
    setDeleteTargetId(datasetId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteDataset = async () => {
    if (!deleteTargetId) return;
    
    try {
      const headers = await getAuthHeaders();
      const apiUrl = await getWorkingAPIUrl();
      console.log("[Delete] Calling:", `${apiUrl}/dataset-management/delete-dataset/${deleteTargetId}`);
      
      const response = await fetch(`${apiUrl}/dataset-management/delete-dataset/${deleteTargetId}`, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete dataset');
      }
      
      toast({
        title: "Dataset Deleted",
        description: "The dataset has been successfully deleted",
      });
      
      refetch();
    } catch (error) {
      console.error('Error deleting dataset:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteTargetId(null);
    }
  };

  const getStageStatus = (dataset: Dataset, stage: 'raw' | 'cleaned' | 'final' | 'processed') => {
    const stageMap = {
      raw: dataset.has_raw,
      cleaned: dataset.has_cleaned,
      final: dataset.has_final,
      processed: dataset.has_processed
    };

    return stageMap[stage];
  };

  const renderStageButtons = (dataset: Dataset, stage: 'raw' | 'cleaned' | 'final' | 'processed') => {
    const isAvailable = getStageStatus(dataset, stage);
    
    return (
      <div className="flex space-x-1">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handlePreviewDataset(dataset, stage)}
          disabled={!isAvailable}
          className={!isAvailable ? "opacity-50 cursor-not-allowed" : ""}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => downloadDataset(dataset.id, stage, `${dataset.dataset_name}_${stage}.csv`)}
          disabled={!isAvailable}
          className={!isAvailable ? "opacity-50 cursor-not-allowed" : ""}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const closePreview = () => {
    setPreviewData(null);
    setSelectedDataset(null);
    setPreviewStage(null);
  };

  // Handle manual refresh with loading state
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Datasets Refreshed",
        description: "The dataset list has been updated",
      });
    } catch (error) {
      console.error('Error refreshing datasets:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh datasets. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Show only user-owned datasets
  const datasets = userDatasets.slice(0, 100) || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Available Datasets</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={isLoading || isRefreshing}
          className="gap-2"
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>
      
      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
      )}
      
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load datasets. Please try again later.
          </AlertDescription>
        </Alert>
      )}
      
      {!isLoading && !isError && datasets.length === 0 && (
        <div className="text-center py-8">
          <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium">No Datasets Found</h3>
          <p className="text-sm text-gray-500 mt-2">Upload datasets via the Dataset page to get started</p>
          <Button className="mt-4" asChild>
            <a href="/dataset">Go to Dataset Upload</a>
          </Button>
        </div>
      )}
      
      {!isLoading && !isError && datasets.length > 0 && (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dataset Name</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Raw</TableHead>
                <TableHead>Cleaned</TableHead>
                <TableHead>Feature Selected</TableHead>
                <TableHead>Processed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datasets.map((dataset) => (
                <TableRow key={dataset.id}>
                  <TableCell className="font-medium">{dataset.dataset_name}</TableCell>
                  <TableCell>{formatDate(dataset.created_at)}</TableCell>
                  <TableCell>{renderStageButtons(dataset, 'raw')}</TableCell>
                  <TableCell>{renderStageButtons(dataset, 'cleaned')}</TableCell>
                  <TableCell>{renderStageButtons(dataset, 'final')}</TableCell>
                  <TableCell>{renderStageButtons(dataset, 'processed')}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(dataset.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      <Dialog open={!!previewData} onOpenChange={(open) => !open && closePreview()}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              {selectedDataset?.dataset_name} - {previewStage} Preview
            </DialogTitle>
            <DialogDescription>
              Showing first {previewData?.preview.length || 0} rows of the dataset
            </DialogDescription>
          </DialogHeader>
          
          {isPreviewLoading ? (
            <div className="space-y-2 my-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : previewData ? (
            <div className="overflow-x-auto max-h-[400px]">
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
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No preview data available</AlertTitle>
              <AlertDescription>
                No data could be loaded for this dataset stage.
              </AlertDescription>
            </Alert>
          )}
          
          <DialogFooter className="sm:justify-between">
            <div className="flex items-center">
              {selectedDataset && previewStage && (
                <Button 
                  variant="outline"
                  onClick={() => downloadDataset(
                    selectedDataset.id, 
                    previewStage, 
                    `${selectedDataset.dataset_name}_${previewStage}.csv`
                  )}
                >
                  <DownloadCloud className="mr-2 h-4 w-4" />
                  Download Full Dataset
                </Button>
              )}
            </div>
            <Button onClick={closePreview}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this dataset? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteDataset}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DatasetsTab;
