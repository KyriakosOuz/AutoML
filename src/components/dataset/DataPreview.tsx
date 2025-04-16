
import React, { useEffect, useState } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { datasetApi } from '@/lib/api';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';

type PreviewStage = 'raw' | 'cleaned' | 'final' | 'processed' | 'latest';

const DataPreview: React.FC = () => {
  const { 
    datasetId, 
    previewData, 
    previewColumns, 
    setPreviewData, 
    setPreviewColumns,
    overview,
    processingStage
  } = useDataset();
  
  const [stage, setStage] = useState<PreviewStage>('raw');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const fetchPreview = async () => {
    if (!datasetId) return;
    
    try {
      setIsLoadingPreview(true);
      setPreviewError(null);
      
      const response = await datasetApi.previewDataset(datasetId, stage);
      
      if (response && response.data) {
        setPreviewData(response.data.preview || []);
        setPreviewColumns(response.data.columns || []);
      } else {
        setPreviewData(response.preview || []);
        setPreviewColumns(response.columns || []);
      }
    } catch (error) {
      console.error('Error fetching preview:', error);
      setPreviewError(error instanceof Error ? error.message : 'Failed to load data preview');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Determine which stages are available based on processing status
  const hasRawData = !!datasetId;
  const hasCleanedData = processingStage === 'cleaned' || processingStage === 'final' || processingStage === 'processed';
  const hasFinalData = processingStage === 'final' || processingStage === 'processed';
  const hasProcessedData = processingStage === 'processed';

  useEffect(() => {
    if (datasetId) {
      fetchPreview();
    }
  }, [datasetId, stage]);

  // Set the default stage based on the latest available processing stage
  useEffect(() => {
    if (processingStage) {
      if (processingStage === 'cleaned' && stage === 'raw') {
        setStage('cleaned');
        fetchPreview();
      } else if (stage !== processingStage && (processingStage === 'final' || processingStage === 'processed')) {
        setStage(processingStage);
        fetchPreview();
      }
    }
  }, [processingStage]);

  if (!datasetId) {
    return null;
  }

  return (
    <Card className="w-full mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl text-primary">Data Preview</CardTitle>
        <div className="flex items-center gap-2">
          <Select
            value={stage}
            onValueChange={(value) => setStage(value as PreviewStage)}
            disabled={isLoadingPreview}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="raw">Raw Data</SelectItem>
              <SelectItem value="cleaned" disabled={!hasCleanedData}>Cleaned Data</SelectItem>
              <SelectItem value="final" disabled={!hasFinalData}>Final Data</SelectItem>
              <SelectItem value="processed" disabled={!hasProcessedData}>Processed Data</SelectItem>
              <SelectItem value="latest">Latest Stage</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchPreview}
            disabled={isLoadingPreview}
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingPreview ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {previewError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{previewError}</AlertDescription>
          </Alert>
        )}
        
        {!previewData || isLoadingPreview ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : previewColumns && previewColumns.length > 0 ? (
          <div className="overflow-auto max-h-[400px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-center">#</TableHead>
                  {previewColumns.map((column) => (
                    <TableHead key={column}>{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(previewData) ? (
                  previewData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      <TableCell className="text-center font-medium">{rowIndex + 1}</TableCell>
                      {previewColumns.map((column) => {
                        const value = row[column];
                        const displayValue = 
                          value === null || value === undefined ? 
                          <span className="text-gray-400 italic">null</span> : 
                          String(value);
                        
                        return (
                          <TableCell key={`${rowIndex}-${column}`}>
                            {displayValue}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={previewColumns.length + 1} className="text-center text-gray-500 py-4">
                      Data structure invalid. Please refresh the preview.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No preview data available
          </div>
        )}
        
        {overview && (
          <div className="mt-4 text-sm text-gray-500">
            <p>
              Dataset has {overview.num_rows} rows and {overview.num_columns} columns
              ({overview.numerical_features?.length || 0} numerical, {overview.categorical_features?.length || 0} categorical)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataPreview;
