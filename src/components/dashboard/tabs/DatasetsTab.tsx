
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/lib/constants';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Download, Trash2, Check } from 'lucide-react';
import { handleApiResponse, getAuthHeaders } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import DatasetsEmptyState from '../empty-states/DatasetsEmptyState';
import DataPreviewDialog from '../dialogs/DataPreviewDialog';
import { Badge } from '@/components/ui/badge';
import { Dataset, DatasetsResponse } from '@/types/api';

const DatasetsTab: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
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
      
      const result = await handleApiResponse<DatasetsResponse>(response);
      
      if (result?.data?.datasets) {
        // Only show first 100 datasets
        setDatasets(result.data.datasets.slice(0, 100));
      } else {
        console.warn('Invalid or empty datasets response:', result);
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
      fetchDatasets();
    } catch (error) {
      console.error('Error deleting dataset:', error);
      toast({
        title: 'Failed to delete dataset',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
    }
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
              <TableHead>Dataset Name</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {datasets.map((dataset) => (
              <TableRow key={dataset.id}>
                <TableCell className="font-medium">{dataset.dataset_name}</TableCell>
                <TableCell>{formatDate(dataset.created_at)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {dataset.has_raw && (
                      <Badge variant="secondary">Raw</Badge>
                    )}
                    {dataset.has_cleaned && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        <Check className="h-3 w-3 mr-1" />
                        Cleaned
                      </Badge>
                    )}
                    {dataset.has_final && (
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        <Check className="h-3 w-3 mr-1" />
                        Selected
                      </Badge>
                    )}
                    {dataset.has_processed && (
                      <Badge variant="outline" className="bg-purple-100 text-purple-800">
                        <Check className="h-3 w-3 mr-1" />
                        Processed
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedDataset(dataset);
                        setShowPreview(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {dataset.has_raw && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a 
                          href={`${API_BASE_URL}/dataset-management/download-dataset/${dataset.id}`} 
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
                            Are you sure you want to delete "{dataset.dataset_name}"? This action cannot be undone.
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
          datasetName={selectedDataset.dataset_name}
          stage="raw"
          open={showPreview}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
};

export default DatasetsTab;
