
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/lib/constants';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Download, Trash2 } from 'lucide-react';
import { handleApiResponse, getAuthHeaders } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import DatasetsEmptyState from '../empty-states/DatasetsEmptyState';
import DataPreviewDialog from '../dialogs/DataPreviewDialog';

interface Dataset {
  id: string;
  name: string;
  created_at: string;
  file_size: number;
  num_rows?: number;
  num_columns?: number;
  file_url?: string;
  cleaned_file_url?: string;
  final_file_url?: string;
  processed_file_url?: string;
}

const DatasetsTab: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [previewStage, setPreviewStage] = useState<'raw' | 'cleaned' | 'final' | 'processed'>('raw');
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/dataset-management/list-datasets/`, {
        method: 'GET',
        headers
      });
      
      const result = await handleApiResponse<Dataset[]>(response);
      const datasetsArray = result.data?.datasets || [];
      
      if (Array.isArray(datasetsArray)) {
        setDatasets(datasetsArray);
      } else {
        console.warn('Invalid datasets data structure:', result.data);
        setDatasets([]);
      }
    } catch (error) {
      console.error('Error fetching datasets:', error);
      toast({
        title: 'Failed to load datasets',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
      setDatasets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDataset = async (datasetId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/dataset-management/delete-dataset/${datasetId}`, {
        method: 'DELETE',
        headers
      });
      
      await handleApiResponse(response);
      toast({
        title: 'Dataset deleted',
        description: 'The dataset has been successfully deleted'
      });
      fetchDatasets(); // Refresh list
    } catch (error) {
      console.error('Error deleting dataset:', error);
      toast({
        title: 'Failed to delete dataset',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
    }
  };

  const openPreview = (dataset: Dataset, stage: 'raw' | 'cleaned' | 'final' | 'processed') => {
    setSelectedDataset(dataset);
    setPreviewStage(stage);
    setShowPreview(true);
  };

  const getDownloadUrl = (dataset: Dataset, stage: 'raw' | 'cleaned' | 'final' | 'processed') => {
    switch (stage) {
      case 'raw': return dataset.file_url;
      case 'cleaned': return dataset.cleaned_file_url;
      case 'final': return dataset.final_file_url;
      case 'processed': return dataset.processed_file_url;
      default: return dataset.file_url;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-8 w-1/3 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (datasets.length === 0) {
    return <DatasetsEmptyState onRefresh={fetchDatasets} />;
  }

  return (
    <>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Rows</TableHead>
              <TableHead>Columns</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {datasets.map((dataset) => (
              <TableRow key={dataset.id}>
                <TableCell className="font-medium">{dataset.name}</TableCell>
                <TableCell>{formatDate(dataset.created_at)}</TableCell>
                <TableCell>{formatFileSize(dataset.file_size)}</TableCell>
                <TableCell>{dataset.num_rows ?? 'N/A'}</TableCell>
                <TableCell>{dataset.num_columns ?? 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openPreview(dataset, 'raw')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {dataset.file_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a 
                          href={dataset.file_url} 
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Dataset</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{dataset.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => handleDeleteDataset(dataset.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      
      {showPreview && selectedDataset && (
        <DataPreviewDialog 
          datasetId={selectedDataset.id}
          datasetName={selectedDataset.name}
          stage={previewStage}
          open={showPreview}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
};

export default DatasetsTab;
