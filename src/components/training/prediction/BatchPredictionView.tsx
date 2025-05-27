
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Download, FileText, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getWorkingAPIUrl } from '@/lib/constants';
import { getAuthHeaders } from '@/lib/utils';
import { BatchPredictionResponse } from './PredictionResponse.types';
import { ProbabilitiesCell } from './table/ProbabilitiesCell';
import { Badge } from '@/components/ui/badge';
import { downloadCSV, downloadJSON } from './utils/downloadUtils';
import MetricsBlock from './metrics/MetricsBlock';
import { useTraining } from '@/contexts/training/TrainingContext';

interface BatchPredictionViewProps {
  experimentId: string;
}

interface FormattedError {
  title: string;
  description: React.ReactNode;
  isMissingColumns?: boolean;
  missingColumns?: string[];
}

const BatchPredictionView: React.FC<BatchPredictionViewProps> = ({ experimentId }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<FormattedError | null>(null);
  const [result, setResult] = useState<BatchPredictionResponse | null>(null);
  const { toast } = useToast();
  const { setIsPredicting: setGlobalIsPredicting } = useTraining();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.csv')) {
        setError({
          title: "Invalid File Format",
          description: "Please select a CSV file. Other file formats are not supported."
        });
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const parseErrorMessage = (errorMessage: string): FormattedError => {
    // Check for missing columns error pattern
    const missingColumnsMatch = errorMessage.match(/Missing required columns: (\[.*?\])/);
    if (missingColumnsMatch) {
      try {
        // Try to parse the columns as a JSON array
        const columnsString = missingColumnsMatch[1].replace(/'/g, '"');
        const missingColumns = JSON.parse(columnsString);
        
        return {
          title: "Missing Required Columns",
          isMissingColumns: true,
          missingColumns,
          description: (
            <div className="space-y-2">
              <p>Your CSV file is missing the following required columns:</p>
              <div className="flex flex-wrap gap-2 my-2">
                {missingColumns.map((col: string) => (
                  <Badge key={col} variant="outline" className="bg-amber-50 text-amber-900 border-amber-300">
                    {col}
                  </Badge>
                ))}
              </div>
              <p>Please ensure your CSV file includes all required columns for this model.</p>
            </div>
          )
        };
      } catch (e) {
        // Fallback if JSON parsing fails
        console.error("Failed to parse missing columns", e);
      }
    }

    // Check for malformed CSV error
    if (errorMessage.includes("csv") && 
        (errorMessage.includes("parse") || errorMessage.includes("format"))) {
      return {
        title: "CSV Format Error",
        description: "The CSV file appears to be malformed or contains invalid data. Please check the file format and try again."
      };
    }

    // Default error handling
    return {
      title: "Prediction Error",
      description: errorMessage
    };
  };

  const handleTryAgain = () => {
    setSelectedFile(null);
    setError(null);
    if (document.getElementById('csv-file') instanceof HTMLInputElement) {
      (document.getElementById('csv-file') as HTMLInputElement).value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError({
        title: "No File Selected",
        description: "Please select a CSV file before proceeding."
      });
      return;
    }

    setIsLoading(true);
    setGlobalIsPredicting(true);
    setError(null);
    setResult(null);

    try {
      // Use only experiment_id and file - let backend handle model loading
      const formData = new FormData();
      formData.append('experiment_id', experimentId);
      formData.append('file', selectedFile);

      const token = (await getAuthHeaders())?.Authorization?.replace('Bearer ', '');
      const headers = new Headers();
      if (token) {
        headers.append('Authorization', `Bearer ${token}`);
      }

      // Get the appropriate API URL
      const apiUrl = await getWorkingAPIUrl();

      // Call the backend prediction endpoint
      const response = await fetch(`${apiUrl}/prediction/predict-csv/`, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const json = await response.json();
      setResult(json.data);

      toast({
        title: "Success",
        description: json.mode === 'evaluation'
          ? "Evaluation completed successfully"
          : "Predictions generated successfully",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process CSV file';
      console.error("CSV prediction error:", message);
      
      // Parse and format the error message for better user understanding
      const formattedError = parseErrorMessage(message);
      setError(formattedError);
      
      toast({
        title: "Error",
        description: formattedError.title,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setGlobalIsPredicting(false);
    }
  };

  const handleDownloadPredictions = () => {
    if (!result?.filled_dataset_preview?.length) return;
    
    // Use engine name if available for the filename
    const engineName = result.automl_engine?.toUpperCase();
    const filename = engineName 
      ? `${engineName}_Predictions_${new Date().toISOString().split('T')[0]}.csv`
      : `predictions_${new Date().toISOString().split('T')[0]}.csv`;
    
    downloadCSV(result.filled_dataset_preview, filename);
    
    toast({
      title: "Success",
      description: "Predictions downloaded successfully",
    });
  };

  const handleDownloadEvaluation = () => {
    if (!result?.metrics) return;
    
    const evaluationData = {
      metrics: result.metrics,
      y_true: result.y_true,
      y_pred: result.y_pred
    };
    
    const filename = `evaluation_report_${new Date().toISOString().split('T')[0]}.json`;
    downloadJSON(evaluationData, filename);
    
    toast({
      title: "Success",
      description: "Evaluation report downloaded successfully",
    });
  };

  const handleDownloadComparisonCSV = () => {
    if (!result?.y_true || !result?.y_pred) return;
    
    const comparisonData = result.y_true.map((trueVal, index) => {
      const predicted = result.y_pred[index];
      const isCorrect = trueVal === predicted;
      
      return {
        Sample: `#${index + 1}`,
        TrueValue: trueVal,
        PredictedValue: predicted,
        Correct: isCorrect ? 'Yes' : 'No'
      };
    });
    
    const filename = `predictions_comparison_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(comparisonData, filename);
    
    toast({
      title: "Success",
      description: "Comparison data downloaded successfully",
    });
  };

  const renderPredictionOnly = () => {
    if (!result?.filled_dataset_preview) return null;
    
    const columns = Object.keys(result.filled_dataset_preview[0] || {});
    const target = columns[columns.length - 1];
    const hasClassProbabilities = result.filled_dataset_preview.some(
      row => 'class_probabilities' in row
    );
    
    return (
      <div className="space-y-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-lg font-medium">
                Predictions generated for {result.filled_dataset_preview.length} samples
              </p>
              <Button variant="outline" onClick={handleDownloadPredictions}>
                <Download className="mr-2 h-4 w-4" />
                Download Predictions
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {Object.keys(result.filled_dataset_preview[0] || {})
                  .filter(header => header !== 'class_probabilities')
                  .map((header) => (
                    <TableHead 
                      key={header} 
                      className={header === result.target_column ? 'font-bold text-primary' : ''}
                    >
                      {header}
                    </TableHead>
                  ))
                }
                {result.filled_dataset_preview.some(row => 'class_probabilities' in row) && 
                 result.task_type?.includes('classification') && (
                  <TableHead>Prediction Probabilities</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.filled_dataset_preview.map((row, index) => (
                <TableRow key={index}>
                  {Object.entries(row)
                    .filter(([key]) => key !== 'class_probabilities')
                    .map(([key, value]) => {
                      const isTarget = key === result.target_column;
                      return (
                        <TableCell key={key} className={isTarget ? 'font-bold text-primary' : ''}>
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </TableCell>
                      );
                    })
                  }
                  {row.class_probabilities && result.task_type?.includes('classification') && (
                    <TableCell>
                      <ProbabilitiesCell 
                        probabilities={
                          typeof row.class_probabilities === 'string'
                            ? JSON.parse(row.class_probabilities)
                            : row.class_probabilities
                        }
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const renderEvaluation = () => {
    if (!result?.metrics) return null;
    
    return (
      <div className="space-y-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-lg font-medium">Evaluation Results</p>
              <Button variant="outline" onClick={handleDownloadEvaluation}>
                <Download className="mr-2 h-4 w-4" />
                Download Evaluation Report
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <MetricsBlock metrics={result.metrics} taskType={result.task_type} />

        {result.y_true && result.y_pred && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Predictions Comparison</CardTitle>
                <CardDescription>
                  Comparison between true values and model predictions (first 10 samples)
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadComparisonCSV}>
                <Download className="mr-2 h-4 w-4" />
                Download as CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sample</TableHead>
                      <TableHead>True Value</TableHead>
                      <TableHead>Predicted</TableHead>
                      <TableHead>Correct?</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.y_true.slice(0, 10).map((trueVal, index) => (
                      <TableRow key={index}>
                        <TableCell>#{index + 1}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {trueVal}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {result.y_pred[index]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {trueVal === result.y_pred[index] ? (
                            <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                              Correct
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="opacity-80">
                              Incorrect
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderErrorAlert = () => {
    if (!error) return null;
    
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4 mr-2" />
        <div className="space-y-2">
          <h4 className="font-medium">{error.title}</h4>
          <AlertDescription>{error.description}</AlertDescription>
          
          {error.isMissingColumns && (
            <div className="mt-4 bg-destructive/10 p-3 rounded-md text-sm">
              <p className="font-medium mb-1">How to fix this:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Open your CSV file in a spreadsheet program</li>
                <li>Add the missing column headers to the first row</li>
                <li>Fill in appropriate data for these columns</li>
                <li>Save the file and upload again</li>
              </ol>
            </div>
          )}
          
          <div className="pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleTryAgain} 
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Try Again
            </Button>
          </div>
        </div>
      </Alert>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Prediction from CSV</CardTitle>
        <CardDescription>
          Upload a CSV file to make predictions for multiple records
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderErrorAlert()}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid w-full gap-4">
            <Label htmlFor="csv-file">Upload CSV File</Label>
            <div className="flex flex-col items-center justify-center w-full">
              <label 
                htmlFor="csv-file" 
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/40 hover:bg-muted/60 ${error ? 'border-destructive/50' : ''}`}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="mb-1 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    CSV file with {error?.isMissingColumns ? 'all required columns' : 'feature columns'}
                  </p>
                </div>
                <Input 
                  id="csv-file" 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {selectedFile && (
              <div className="flex items-center p-2 text-sm text-primary bg-primary/10 rounded">
                <FileText className="h-4 w-4 mr-2" />
                <span>{selectedFile.name}</span>
              </div>
            )}

            <Button 
              type="submit" 
              className="mt-2"
              disabled={isLoading || !selectedFile}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Generate Predictions'
              )}
            </Button>
          </div>
        </form>

        {result && (
          <div className="mt-8">
            {result.mode === 'prediction_only' ? renderPredictionOnly() : renderEvaluation()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BatchPredictionView;
