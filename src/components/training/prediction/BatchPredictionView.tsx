
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, Download, FileText } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/lib/constants';
import { getAuthHeaders } from '@/lib/utils';

interface BatchPredictionViewProps {
  experimentId: string;
}

interface PredictionResponse {
  mode: 'prediction_only' | 'evaluation';
  predictions?: string[];
  filled_dataset_preview?: Record<string, any>[];
  metrics?: {
    accuracy: number;
    f1_macro: number;
    report: Record<string, {
      precision: number;
      recall: number;
      'f1-score': number;
      support: number;
    }>;
  };
  y_true?: string[];
  y_pred?: string[];
}

const BatchPredictionView: React.FC<BatchPredictionViewProps> = ({ experimentId }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);
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

      // ✅ Proper headers
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

  const renderPredictionOnly = () => {
    if (!result?.filled_dataset_preview) return null;
    
    return (
      <div className="space-y-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <p className="text-lg font-medium">
              Predictions generated for {result.filled_dataset_preview.length} samples
            </p>
          </CardContent>
        </Card>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {Object.keys(result.filled_dataset_preview[0] || {}).map((header) => (
                  <TableHead key={header} className={header === 'survived' ? 'font-bold text-primary' : ''}>
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.filled_dataset_preview.map((row, index) => (
                <TableRow key={index}>
                  {Object.entries(row).map(([key, value]) => (
                    <TableCell key={key} className={key === 'survived' ? 'font-bold text-primary' : ''}>
                      {String(value)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end">
          <Button disabled variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download Full Results
          </Button>
        </div>
      </div>
    );
  };

  const renderEvaluation = () => {
    if (!result?.metrics) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(result.metrics.accuracy * 100).toFixed(1)}%
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">F1 Score (Macro)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(result.metrics.f1_macro * 100).toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Classification Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Precision</TableHead>
                    <TableHead>Recall</TableHead>
                    <TableHead>F1-Score</TableHead>
                    <TableHead>Support</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(result.metrics.report).map(([label, metrics]) => (
                    <TableRow key={label}>
                      <TableCell className="font-medium">{label}</TableCell>
                      <TableCell>{(metrics.precision * 100).toFixed(1)}%</TableCell>
                      <TableCell>{(metrics.recall * 100).toFixed(1)}%</TableCell>
                      <TableCell>{(metrics['f1-score'] * 100).toFixed(1)}%</TableCell>
                      <TableCell>{metrics.support}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
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
