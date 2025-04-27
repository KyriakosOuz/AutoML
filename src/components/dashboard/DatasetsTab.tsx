
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useQuery } from '@tanstack/react-query';
import { datasetsApi, Dataset, DatasetPreview } from '@/lib/dashboardApi';
import { Download, Eye, Trash2, Loader } from 'lucide-react';

const DatasetsTab = () => {
  const { toast } = useToast();
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);
  const [previewStage, setPreviewStage] = useState<'raw' | 'cleaned' | 'final' | 'processed'>('raw');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  
  const { 
    data: datasets = [], 
    isLoading, 
    error, 
    refetch
  } = useQuery({
    queryKey: ['datasets'],
    queryFn: () => datasetsApi.listDatasets(),
  });

  const handlePreview = async (dataset: Dataset, stage: 'raw' | 'cleaned' | 'final' | 'processed' = 'raw') => {
    try {
      setSelectedDataset(dataset);
      setPreviewStage(stage);
      setIsPreviewLoading(true);
      
      const data = await datasetsApi.previewDataset(dataset.dataset_id, stage);
      
      if (data && Array.isArray(data.rows)) {
        setPreviewData(data.rows.slice(0, 10)); // Show first 10 rows
        setPreviewColumns(data.columns || Object.keys(data.rows[0] || {}));
      } else {
        setPreviewData([]);
        setPreviewColumns([]);
        toast({
          title: "Preview Error",
          description: "Could not load preview data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error previewing dataset:", error);
      toast({
        title: "Preview Error",
        description: error instanceof Error ? error.message : "Failed to load preview",
        variant: "destructive",
      });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleDelete = async (datasetId: string) => {
    try {
      await datasetsApi.deleteDataset(datasetId);
      toast({
        title: "Success",
        description: "Dataset deleted successfully",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Delete Error",
        description: error instanceof Error ? error.message : "Failed to delete dataset",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading datasets...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertDescription>
          {error instanceof Error ? error.message : "An error occurred while fetching datasets"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Your Datasets</h2>
        <Button onClick={() => refetch()}>Refresh</Button>
      </div>

      {datasets.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-muted-foreground mb-4">No datasets uploaded yet.</p>
            <Button onClick={() => window.location.href = '/dataset'}>
              Upload New Dataset
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
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
                <TableRow key={dataset.dataset_id}>
                  <TableCell className="font-medium">{dataset.name || 'Unnamed Dataset'}</TableCell>
                  <TableCell>{new Date(dataset.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{dataset.file_size || 'Unknown'}</TableCell>
                  <TableCell>{dataset.num_rows || 'N/A'}</TableCell>
                  <TableCell>{dataset.num_columns || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* Preview Dialog */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => handlePreview(dataset, 'raw')}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Dataset Preview</DialogTitle>
                          </DialogHeader>
                          
                          <Tabs defaultValue="raw" className="w-full">
                            <TabsList className="grid grid-cols-4 mb-4">
                              <TabsTrigger 
                                value="raw" 
                                onClick={() => handlePreview(dataset, 'raw')}
                                disabled={!dataset.stages?.raw}
                              >
                                Raw
                              </TabsTrigger>
                              <TabsTrigger 
                                value="cleaned" 
                                onClick={() => handlePreview(dataset, 'cleaned')}
                                disabled={!dataset.stages?.cleaned}
                              >
                                Cleaned
                              </TabsTrigger>
                              <TabsTrigger 
                                value="final" 
                                onClick={() => handlePreview(dataset, 'final')}
                                disabled={!dataset.stages?.final}
                              >
                                Final
                              </TabsTrigger>
                              <TabsTrigger 
                                value="processed" 
                                onClick={() => handlePreview(dataset, 'processed')}
                                disabled={!dataset.stages?.processed}
                              >
                                Processed
                              </TabsTrigger>
                            </TabsList>
                            
                            {isPreviewLoading ? (
                              <div className="flex justify-center items-center p-8">
                                <Loader className="h-8 w-8 animate-spin text-primary" />
                              </div>
                            ) : previewData.length > 0 ? (
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      {previewColumns.map((column) => (
                                        <TableHead key={column}>{column}</TableHead>
                                      ))}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {previewData.map((row, i) => (
                                      <TableRow key={i}>
                                        {previewColumns.map((column) => (
                                          <TableCell key={column}>{String(row[column] !== undefined ? row[column] : '')}</TableCell>
                                        ))}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            ) : (
                              <p className="text-center p-4 text-muted-foreground">No preview data available for this stage</p>
                            )}
                          </Tabs>
                        </DialogContent>
                      </Dialog>
                      
                      {/* Download Button */}
                      <Button variant="outline" size="sm" asChild>
                        <a 
                          href={dataset.file_url} 
                          download 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>

                      {/* Delete Dataset Dialog */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Dataset</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this dataset? This action cannot be undone, and all experiments and models using this dataset will be affected.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(dataset.dataset_id)}>
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
        </div>
      )}
    </div>
  );
};

export default DatasetsTab;
