import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Download, FileText, InfoIcon, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/lib/constants';
import { getAuthHeaders } from '@/lib/utils';
import { BatchPredictionResponse } from './PredictionResponse.types';
import { ClassProbabilities } from './ClassProbabilities';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import MetricsBlock from './metrics/MetricsBlock';
import { ProbabilitiesCell } from './table/ProbabilitiesCell';
import { Badge } from '@/components/ui/badge';
import { downloadCSV, downloadJSON } from './utils/downloadUtils';

interface BatchPredictionViewProps {
  experimentId: string;
}

const BatchPredictionView: React.FC<BatchPredictionViewProps> = ({ experimentId }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BatchPredictionResponse | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a CSV file');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('experiment_id', experimentId);
      formData.append('file', selectedFile);

      const token = (await getAuthHeaders())?.Authorization?.replace('Bearer ', '');
      const headers = new Headers();
      if (token) {
        headers.append('Authorization', `Bearer ${token}`);
      }

      const response = await fetch(`${API_BASE_URL}/prediction/predict-csv/`, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
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
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPredictions = () => {
    if (!result?.filled_dataset_preview?.length) return;
    
    const filename = `predictions_${new Date().toISOString().split('T')[0]}.csv`;
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

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((header) => {
                  if (header === 'class_probabilities') return null;
                  return (
                    <TableHead 
                      key={header} 
                      className={header === target ? 'font-bold text-primary' : ''}
                    >
                      {header}
                    </TableHead>
                  );
                })}
                {hasClassProbabilities && result.task_type?.includes('classification') && (
                  <TableHead>Prediction Probabilities</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.filled_dataset_preview.map((row, index) => (
                <TableRow key={index}>
                  {Object.entries(row).map(([key, value]) => {
                    if (key === 'class_probabilities') return null;
                    const isTarget = key === target;
                    return (
                      <TableCell key={key} className={isTarget ? 'font-bold text-primary' : ''}>
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </TableCell>
                    );
                  })}
                  {hasClassProbabilities && result.task_type?.includes('classification') && (
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
      </div>
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
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid w-full gap-4">
            <Label htmlFor="csv-file">Upload CSV File</Label>
            <div className="flex flex-col items-center justify-center w-full">
              <label 
                htmlFor="csv-file" 
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/40 hover:bg-muted/60"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="mb-1 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">CSV file with feature columns</p>
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
