import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { predictManual, predictBatchCsv } from '@/lib/training';
import { ManualPredictionResponse, BatchPredictionResponse } from '@/types/training';
import { Download, AlertTriangle, FileUp, Check, Activity, Table as TableIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PredictionPanelProps {
  experimentId: string;
  taskType?: string;
  targetColumn?: string;
  columnsToKeep?: string[];
  className?: string;
}

const PredictionPanel: React.FC<PredictionPanelProps> = ({
  experimentId,
  taskType = '',
  targetColumn = '',
  columnsToKeep = [],
  className,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('manual');
  
  // Manual prediction state
  const [manualInputs, setManualInputs] = useState<Record<string, any>>({});
  const [manualPrediction, setManualPrediction] = useState<ManualPredictionResponse | null>(null);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // Batch prediction state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [batchResults, setBatchResults] = useState<BatchPredictionResponse | null>(null);
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const isClassification = taskType.includes('classification');
  
  // Handle manual input change
  const handleInputChange = (feature: string, value: string) => {
    setManualInputs(prev => ({
      ...prev,
      [feature]: value
    }));
    
    // Clear previous prediction when inputs change
    if (manualPrediction) {
      setManualPrediction(null);
    }
  };
  
  // Submit manual prediction
  const submitManualPrediction = async () => {
    setIsSubmittingManual(true);
    setManualError(null);
    
    try {
      // Validate inputs
      const missingFeatures = columnsToKeep.filter(col => 
        !manualInputs[col] && manualInputs[col] !== 0 && manualInputs[col] !== false
      );
      
      if (missingFeatures.length > 0) {
        throw new Error(`Missing required values for: ${missingFeatures.join(', ')}`);
      }
      
      // Normalize numeric values
      const normalizedInputs = Object.fromEntries(
        Object.entries(manualInputs).map(([key, value]) => {
          if (!isNaN(Number(value)) && value !== '') {
            return [key, Number(value)];
          }
          return [key, value];
        })
      );
      
      const prediction = await predictManual(experimentId, normalizedInputs);
      setManualPrediction(prediction);
      toast({
        title: "Prediction complete",
        description: "Successfully generated prediction based on input values"
      });
    } catch (error) {
      console.error("Manual prediction error:", error);
      setManualError(error instanceof Error ? error.message : "Failed to generate prediction");
      toast({
        title: "Prediction failed",
        description: error instanceof Error ? error.message : "Failed to generate prediction",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingManual(false);
    }
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast({
          title: "Invalid file",
          description: "Please upload a CSV file",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
      setBatchResults(null);
      setBatchError(null);
    }
  };
  
  // Submit batch prediction
  const submitBatchPrediction = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to upload",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmittingBatch(true);
    setBatchError(null);
    setUploadProgress(0);
    
    try {
      // Simulate upload progress (in a real app you'd use XHR or fetch with progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);
      
      const results = await predictBatchCsv(experimentId, selectedFile);
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setBatchResults(results);
      toast({
        title: "Batch prediction complete",
        description: `Successfully processed ${selectedFile.name}`
      });
    } catch (error) {
      console.error("Batch prediction error:", error);
      setBatchError(error instanceof Error ? error.message : "Failed to process file");
      toast({
        title: "Batch prediction failed",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingBatch(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };
  
  // Format prediction value for display
  const formatPredictionValue = (value: string | number | number[] | undefined) => {
    if (value === undefined) return 'N/A';
    
    // Handle array case first
    if (Array.isArray(value)) {
      const maxValue = Math.max(...value);
      if (maxValue >= 0 && maxValue <= 1 && isClassification) {
        return `${(maxValue * 100).toFixed(2)}%`;
      }
      return maxValue.toFixed(4);
    }
    
    // Format probability as percentage if it's between 0 and 1
    if (typeof value === 'number') {
      if (value >= 0 && value <= 1 && isClassification) {
        return `${(value * 100).toFixed(2)}%`;
      }
      return value.toFixed(4);
    }
    
    return value;
  };
  
  // Helper function to safely format class probabilities
  const formatClassProbability = (prob: number | number[]): string => {
    if (Array.isArray(prob)) {
      // If it's an array, get the max value
      return `${(Math.max(...prob) * 100).toFixed(2)}%`;
    } else if (typeof prob === 'number') {
      return `${(prob * 100).toFixed(2)}%`;
    }
    return 'N/A';
  };
  
  // Create a download URL for CSV data
  const createCsvDownload = useCallback(() => {
    if (!batchResults || batchResults.mode !== 'prediction_only' || !batchResults.filled_dataset_preview) {
      return '';
    }
    
    try {
      // Get column headers from first row
      const headers = Object.keys(batchResults.filled_dataset_preview[0]);
      
      // Format data as CSV
      const csvContent = [
        headers.join(','),
        ...batchResults.filled_dataset_preview.map(row => 
          headers.map(header => {
            const value = row[header];
            // Quote strings that contain commas
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');
      
      // Create blob and URL
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error creating CSV download:", error);
      return '';
    }
  }, [batchResults]);
  
  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="manual">Manual Prediction</TabsTrigger>
          <TabsTrigger value="batch">Batch Prediction (CSV)</TabsTrigger>
        </TabsList>
        
        {/* Manual Prediction Tab */}
        <TabsContent value="manual">
          <div className="space-y-6">
            {columnsToKeep.length === 0 ? (
              <Alert>
                <AlertTitle>No features available</AlertTitle>
                <AlertDescription>
                  This model doesn't have any defined features for prediction.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Input Values</CardTitle>
                    <CardDescription>
                      Enter values for each feature to get a prediction
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {columnsToKeep.map(feature => (
                        <div key={feature} className="space-y-2">
                          <Label htmlFor={`feature-${feature}`}>{feature}</Label>
                          <Input
                            id={`feature-${feature}`}
                            placeholder={`Enter value for ${feature}`}
                            value={manualInputs[feature] || ''}
                            onChange={e => handleInputChange(feature, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={submitManualPrediction} 
                      disabled={isSubmittingManual || columnsToKeep.length === 0}
                    >
                      {isSubmittingManual ? 'Generating...' : 'Generate Prediction'}
                    </Button>
                  </CardFooter>
                </Card>
                
                {manualError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{manualError}</AlertDescription>
                  </Alert>
                )}
                
                {manualPrediction && (
                  <Card className="border-primary/20 shadow-md">
                    <CardHeader className="bg-primary/5">
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        Prediction Result
                      </CardTitle>
                      <CardDescription>
                        Based on the provided feature values
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center justify-center py-4">
                        <div className="text-3xl font-bold text-center mb-2">
                          {formatPredictionValue(manualPrediction.prediction)}
                        </div>
                        
                        {isClassification && manualPrediction.probability !== undefined && (
                          <Badge variant="secondary" className="text-sm">
                            Confidence: {formatPredictionValue(manualPrediction.probability)}
                          </Badge>
                        )}
                        
                        {manualPrediction.class_probabilities && (
                          <div className="mt-4 w-full max-w-md">
                            <h4 className="text-sm font-medium mb-2">Class Probabilities</h4>
                            <div className="space-y-2">
                              {Object.entries(manualPrediction.class_probabilities).map(([className, prob]) => {
                                let probValue: number | null = null;
                                if (Array.isArray(prob)) {
                                  probValue = prob.length > 0 ? Math.max(...prob) : null;
                                } else if (typeof prob === 'number') {
                                  probValue = prob;
                                }

                                return (
                                  <div key={className} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span>{className}</span>
                                      <span>
                                        {probValue !== null
                                          ? `${(probValue * 100).toFixed(2)}%`
                                          : 'N/A'}
                                      </span>
                                    </div>
                                    <Progress value={probValue !== null ? probValue * 100 : 0} className="h-2" />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </TabsContent>
        
        {/* Batch Prediction Tab */}
        <TabsContent value="batch">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Upload CSV File</CardTitle>
                <CardDescription>
                  Upload a CSV file with feature values for batch prediction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => document.getElementById('csv-upload')?.click()}>
                    <FileUp className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {selectedFile ? selectedFile.name : 'Drag and drop or click to select a CSV file'}
                    </p>
                    {selectedFile && (
                      <Badge variant="outline" className="mt-2">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </Badge>
                    )}
                  </div>
                  <input
                    id="csv-upload"
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  
                  {uploadProgress > 0 && (
                    <div className="w-full space-y-1">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-right text-muted-foreground">
                        {uploadProgress}%
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={submitBatchPrediction}
                  disabled={!selectedFile || isSubmittingBatch}
                >
                  {isSubmittingBatch ? 'Processing...' : 'Process CSV'}
                </Button>
              </CardFooter>
            </Card>
            
            {batchError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{batchError}</AlertDescription>
              </Alert>
            )}
            
            {batchResults && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-primary" />
                      Batch Results
                    </CardTitle>
                    
                    {batchResults.mode === 'prediction_only' && (
                      <Button variant="outline" size="sm" asChild>
                        <a 
                          href={batchResults.download_url || createCsvDownload()} 
                          download={`predictions-${Date.now()}.csv`}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Predictions
                        </a>
                      </Button>
                    )}
                  </div>
                  <CardDescription>
                    {batchResults.mode === 'evaluation' 
                      ? 'Evaluation results with actual vs predicted values' 
                      : 'Preview of predictions for the uploaded data'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Evaluation Mode Results */}
                  {batchResults.mode === 'evaluation' && (
                    <div className="space-y-6">
                      {/* Metrics */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(batchResults.metrics).map(([key, value]) => {
                          const isPercentageMetric = [
                            'accuracy', 'f1', 'precision', 'recall', 'auc', 'r2'
                          ].some(m => key.toLowerCase().includes(m));
                          
                          const displayValue = isPercentageMetric && value >= 0 && value <= 1
                            ? `${(value * 100).toFixed(2)}%`
                            : typeof value === 'number'
                              ? value.toFixed(4)
                              : value;
                          
                          return (
                            <Card key={key} className="shadow-sm">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm capitalize">
                                  {key.replace(/_/g, ' ')}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold">
                                  {displayValue}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                      
                      {/* Predictions Table */}
                      <div>
                        <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                          <TableIcon className="h-4 w-4" />
                          Predictions Preview
                        </h3>
                        <div className="rounded-md border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Index</TableHead>
                                <TableHead>Actual</TableHead>
                                <TableHead>Predicted</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {batchResults.y_true.slice(0, 10).map((actual, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-mono">{index}</TableCell>
                                  <TableCell>{String(actual)}</TableCell>
                                  <TableCell>{String(batchResults.y_pred[index])}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          {batchResults.y_true.length > 10 && (
                            <div className="py-2 px-4 text-xs text-muted-foreground border-t">
                              Showing 10 of {batchResults.y_true.length} predictions
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Prediction Only Mode Results */}
                  {batchResults.mode === 'prediction_only' && batchResults.filled_dataset_preview && (
                    <div>
                      <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                        <TableIcon className="h-4 w-4" />
                        Predictions Preview
                      </h3>
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {Object.keys(batchResults.filled_dataset_preview[0]).map(key => (
                                <TableHead key={key} className={key === targetColumn ? 'bg-primary/10' : ''}>
                                  {key}
                                  {key === targetColumn && <span className="ml-1 text-primary">*</span>}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {batchResults.filled_dataset_preview.slice(0, 10).map((row, rowIndex) => (
                              <TableRow key={rowIndex}>
                                {Object.entries(row).map(([key, value], cellIndex) => (
                                  <TableCell 
                                    key={`${rowIndex}-${cellIndex}`}
                                    className={key === targetColumn ? 'bg-primary/5 font-medium' : ''}
                                  >
                                    {String(value)}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {batchResults.filled_dataset_preview.length > 10 && (
                          <div className="py-2 px-4 text-xs text-muted-foreground border-t">
                            Showing 10 of {batchResults.filled_dataset_preview.length} rows
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="text-xs text-muted-foreground">
                    {batchResults.mode === 'evaluation' 
                      ? `${batchResults.y_true.length} predictions evaluated` 
                      : `${batchResults.filled_dataset_preview.length} rows processed`}
                  </div>
                  
                  {batchResults.mode === 'prediction_only' && (
                    <Button variant="outline" size="sm" asChild>
                      <a 
                        href={batchResults.download_url || createCsvDownload()} 
                        download={`predictions-${Date.now()}.csv`}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Complete Results
                      </a>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PredictionPanel;
