
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  RefreshCw, 
  AlertCircle, 
  Loader2,
  XCircle,
  CheckCircle,
  Info,
  BarChart
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

type PreviewStage = 'raw' | 'cleaned' | 'final' | 'processed' | 'latest';
type DataPreviewProps = {
  highlightTargetColumn?: string | null;
};

const DataPreview: React.FC<DataPreviewProps> = ({ highlightTargetColumn }) => {
  const { 
    datasetId, 
    previewData, 
    previewColumns, 
    setPreviewData, 
    setPreviewColumns,
    overview,
    setOverview,
    processingStage,
    targetColumn
  } = useDataset();
  
  const [stage, setStage] = useState<PreviewStage>('raw');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [stageOverview, setStageOverview] = useState<any>(null);
  const { toast } = useToast();

  const fetchPreview = async () => {
    if (!datasetId) {
      console.log('No dataset ID available, skipping preview fetch');
      return;
    }
    
    try {
      setIsLoadingPreview(true);
      setPreviewError(null);
      
      console.log('Fetching preview for dataset:', datasetId, 'stage:', stage);
      
      const response = await datasetApi.previewDataset(datasetId, stage);
      console.log('Preview response:', response);
      
      if (response && response.data) {
        setPreviewData(response.data.preview || []);
        setPreviewColumns(response.data.columns || []);
        
        // Store the overview specific to this stage
        const stageSpecificOverview = response.data.overview || {};
        setStageOverview(stageSpecificOverview);
        
        // Update global overview only when viewing the latest stage
        if (stage === 'latest' || stage === processingStage) {
          setOverview(stageSpecificOverview);
        }
      } else {
        setPreviewData(response.preview || []);
        setPreviewColumns(response.columns || []);
        
        // Store the overview specific to this stage
        const stageSpecificOverview = response.overview || {};
        setStageOverview(stageSpecificOverview);
        
        // Update global overview only when viewing the latest stage
        if (stage === 'latest' || stage === processingStage) {
          setOverview(stageSpecificOverview);
        }
      }
      
      setInitialLoadComplete(true);
      toast({
        title: "Preview updated",
        description: `Dataset preview for ${stage} stage loaded successfully`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error fetching preview:', error);
      setPreviewError(error instanceof Error ? error.message : 'Failed to load data preview');
      toast({
        title: "Error loading preview",
        description: error instanceof Error ? error.message : 'Failed to load data preview',
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const hasRawData = !!datasetId;
  const hasCleanedData = processingStage === 'cleaned' || processingStage === 'final' || processingStage === 'processed';
  const hasFinalData = processingStage === 'final' || processingStage === 'processed';
  const hasProcessedData = processingStage === 'processed';

  useEffect(() => {
    if (processingStage) {
      console.log('Processing stage changed:', processingStage);
      
      if (processingStage === 'final' && stage !== 'final') {
        console.log('Setting stage to final');
        setStage('final');
      } else if (processingStage === 'processed' && stage !== 'processed') {
        console.log('Setting stage to processed');
        setStage('processed');
      }
      // Don't automatically switch to cleaned stage - only set by button click
    }
  }, [processingStage]);

  useEffect(() => {
    if (datasetId) {
      console.log('DatasetId or stage changed - fetching preview');
      fetchPreview();
    }
  }, [datasetId, stage]);

  if (!datasetId) {
    return null;
  }

  const renderStageLabel = (selectedStage: PreviewStage) => {
    const labels = {
      raw: "Raw Data (Original)",
      cleaned: "Cleaned Data (Missing Values Handled)",
      final: "Final Data (Feature Selection)",
      processed: "Processed Data (Ready for Training)",
      latest: "Latest Available Stage"
    };
    return labels[selectedStage];
  };

  // Use the stage-specific overview if available, otherwise fall back to global overview
  const currentOverview = stageOverview || overview;

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
            <SelectTrigger className="w-48">
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
            title="Refresh data preview"
          >
            {isLoadingPreview ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Info className="h-4 w-4" />
            <span>Viewing: <span className="font-medium">{renderStageLabel(stage)}</span></span>
          </div>
          
          {isLoadingPreview && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-sm text-blue-500">Loading data preview...</span>
              </div>
              <Progress value={75} className="h-1" />
            </div>
          )}
        </div>
        
        {previewError && (
          <Alert variant="destructive" className="mb-4">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error loading preview</AlertTitle>
            <AlertDescription>{previewError}</AlertDescription>
          </Alert>
        )}
        
        {!isLoadingPreview && !previewError && previewData && previewData.length > 0 && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-700">Data Preview Loaded</AlertTitle>
            <AlertDescription className="text-green-600">
              Showing {previewData.length} rows and {previewColumns?.length || 0} columns
            </AlertDescription>
          </Alert>
        )}
        
        {/* Table rendering section */}
        {!previewData || isLoadingPreview ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
          </div>
        ) : previewColumns && previewColumns.length > 0 ? (
          <div className="overflow-auto max-h-[400px] rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-white dark:bg-gray-950">
                <TableRow>
                  <TableHead className="w-[50px] text-center">#</TableHead>
                  {previewColumns.map((column) => (
                    <TableHead 
                      key={column} 
                      className={
                        highlightTargetColumn === column || column === targetColumn 
                          ? 'bg-purple-50 text-purple-700 font-bold' 
                          : ''
                      }
                    >
                      {column}
                    </TableHead>
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
                          <TableCell 
                            key={`${rowIndex}-${column}`}
                            className={
                              highlightTargetColumn === column || column === targetColumn 
                                ? 'bg-purple-50 text-purple-700' 
                                : ''
                            }
                          >
                            {displayValue}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={previewColumns.length + 1} className="text-center text-gray-500 py-8">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-6 w-6 text-amber-500" />
                        <p>Data structure invalid. Please refresh the preview.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 border rounded-md">
            <div className="flex flex-col items-center gap-2">
              <Info className="h-6 w-6 text-blue-500" />
              <p>No preview data available</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchPreview} 
                className="mt-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Loading Data
              </Button>
            </div>
          </div>
        )}
        
        {/* Display statistics based on the current stage overview */}
        {currentOverview && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm border">
            <div className="flex items-center gap-2 mb-2">
              <BarChart className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                Dataset Statistics ({stage.charAt(0).toUpperCase() + stage.slice(1)} Stage)
              </h4>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <p className="flex items-center gap-1">
                <span className="font-medium text-gray-700 dark:text-gray-300">Rows:</span> 
                <span className="text-gray-900 dark:text-gray-100">{currentOverview.num_rows}</span>
              </p>
              <p className="flex items-center gap-1">
                <span className="font-medium text-gray-700 dark:text-gray-300">Columns:</span> 
                <span className="text-gray-900 dark:text-gray-100">{currentOverview.num_columns}</span>
              </p>
              <p className="flex items-center gap-1">
                <span className="font-medium text-gray-700 dark:text-gray-300">Numerical Features:</span> 
                <span className="text-gray-900 dark:text-gray-100">{currentOverview.numerical_features?.length || 0}</span>
              </p>
              <p className="flex items-center gap-1">
                <span className="font-medium text-gray-700 dark:text-gray-300">Categorical Features:</span> 
                <span className="text-gray-900 dark:text-gray-100">{currentOverview.categorical_features?.length || 0}</span>
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataPreview;
