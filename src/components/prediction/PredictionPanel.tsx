
import React, { useState, useEffect } from 'react';
import { getExperimentResults, predictManual } from '@/lib/training';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader } from 'lucide-react';

interface PredictionPanelProps {
  experimentId: string;
}

type ManualForm = {
  features: string[];
  sampleRow: Record<string, string>;
  targetColumn: string;
};

const parseCsvSample = (csvText: string, targetColumn: string) => {
  const rows = csvText.trim().split('\n');
  if (rows.length < 2) return { features: [], sampleRow: {} };

  const header = rows[0].split(',').map(col => col.trim());
  const firstRow = rows[1].split(',');

  // Remove target_column from features
  const features = header.filter(f => f !== targetColumn);

  // Map features to sample values
  const sampleRow: Record<string, string> = {};
  features.forEach((feature, idx) => {
    const colIdx = header.indexOf(feature);
    sampleRow[feature] = (firstRow[colIdx] ?? '').trim();
  });

  return { features, sampleRow };
};

const PredictionPanel: React.FC<PredictionPanelProps> = ({ experimentId }) => {
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualForm, setManualForm] = useState<ManualForm | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [prediction, setPrediction] = useState<any>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [taskType, setTaskType] = useState<string>('');
  const { toast } = useToast();

  // --- Manual Prediction Data Fetching Logic ---
  useEffect(() => {
    const fetchManualPredictionInfo = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Fetch experiment results JSON
        const result = await getExperimentResults(experimentId);

        if (!result) throw new Error('Failed to fetch experiment results');
        const target_column = result.target_column ?? '';
        setTaskType(result.task_type || '');

        let features: string[] = [];
        let sampleRow: Record<string, string> = {};

        // 2. Get dataset_file_url and sample row
        // Prefer result.files to locate dataset file
        let datasetFileUrl: string | undefined;
        if (result.files?.length) {
          const datasetFile = result.files.find(f => f.file_type === 'dataset');
          if (datasetFile?.file_url) {
            datasetFileUrl = datasetFile.file_url;
          }
        }
        // fallback for direct property
        if (!datasetFileUrl && (result as any).dataset_file_url) {
          datasetFileUrl = (result as any).dataset_file_url;
        }

        // Directly use X_sample if available
        if ((result.training_results as any)?.X_sample && Array.isArray((result.training_results as any).X_sample)) {
          // Use header from CSV still for safety
          if (datasetFileUrl) {
            try {
              const resp = await fetch(datasetFileUrl);
              const text = await resp.text();
              const header = text.split('\n')[0].split(',').map(col => col.trim());
              features = header.filter(f => f !== target_column);
              const xArr = (result.training_results as any).X_sample[0] || [];
              features.forEach((feature, idx) => {
                sampleRow[feature] = xArr[header.indexOf(feature)] ?? '';
              });
            } catch (e) {
              // fallback: just show empty values
              features = (result.columns_to_keep ?? []).filter(f => f !== target_column);
              features.forEach(f => sampleRow[f] = '');
            }
          }
        }
        // Else, fetch from dataset CSV
        else if (datasetFileUrl) {
          const resp = await fetch(datasetFileUrl);
          const text = await resp.text();
          const res = parseCsvSample(text, target_column);
          features = res.features;
          sampleRow = res.sampleRow;
        } else if (result.columns_to_keep && result.columns_to_keep.length > 0) {
          features = result.columns_to_keep.filter(f => f !== target_column);
          features.forEach(f => sampleRow[f] = '');
        } else {
          throw new Error('Unable to load feature columns');
        }

        setManualForm({
          features,
          sampleRow,
          targetColumn: target_column
        });

        // Set up empty input values
        const initialInputs: Record<string, string> = {};
        features.forEach(f => {
          initialInputs[f] = '';
        });
        setInputValues(initialInputs);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load prediction form');
      } finally {
        setLoading(false);
      }
    };

    if (experimentId) {
      fetchManualPredictionInfo();
    }
  }, [experimentId]);

  // --- Form Handlers ---
  const handleInputChange = (feature: string, value: string) => {
    setInputValues(prev => ({
      ...prev,
      [feature]: value
    }));
  };

  const areAllInputsFilled = () => {
    if (!manualForm) return false;
    return manualForm.features.every(feature => inputValues[feature]?.trim() !== '');
  };

  const handlePredict = async () => {
    setPredicting(true);
    setPrediction(null);
    setConfidence(null);

    try {
      // Number parse attempt
      const formattedInputs: Record<string, any> = {};
      Object.entries(inputValues).forEach(([key, value]) => {
        const numValue = Number(value);
        formattedInputs[key] = isNaN(numValue) ? value : numValue;
      });

      const result = await predictManual(experimentId, formattedInputs);

      if (result.prediction !== undefined) {
        setPrediction(result.prediction);
        if (taskType.includes('classification') && result.probability !== undefined) {
          setConfidence(result.probability);
        }
        toast({
          title: 'Prediction Generated',
          description: 'The model has successfully generated a prediction.',
        });
      } else {
        throw new Error('Invalid prediction result');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate prediction');
      toast({
        title: 'Prediction Failed',
        description: err instanceof Error ? err.message : 'Could not generate prediction',
        variant: 'destructive',
      });
    } finally {
      setPredicting(false);
    }
  };

  // --- Render ---
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Prediction Form</CardTitle>
          <CardDescription>Preparing prediction interface...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prediction Unavailable</CardTitle>
          <CardDescription>There was a problem loading the prediction form</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Prediction</CardTitle>
        <CardDescription>
          Enter values for each feature to generate a prediction
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {/* --- Dynamically generated input form based on dataset --- */}
          {manualForm && manualForm.features.map((feature) => (
            <div key={feature} className="space-y-2">
              <Label htmlFor={`feature-${feature}`}>{feature}</Label>
              <Input
                id={`feature-${feature}`}
                placeholder={manualForm.sampleRow[feature] || `Enter ${feature}`}
                value={inputValues[feature]}
                onChange={(e) => handleInputChange(feature, e.target.value)}
              />
            </div>
          ))}

          <div className="space-y-2 mt-4 pt-4 border-t">
            <Label htmlFor="prediction">{manualForm?.targetColumn || 'Prediction'}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="prediction"
                value={prediction !== null && typeof prediction === "number" ? prediction.toFixed(4) : prediction ?? ''}
                placeholder="Prediction will appear here"
                readOnly
                disabled
                className={prediction ? "bg-primary/5 font-medium" : ""}
              />

              {taskType.includes('classification') && confidence !== null && (
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  {(confidence * 100).toFixed(1)}% confidence
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handlePredict}
          disabled={predicting || !areAllInputsFilled()}
          className="w-full"
        >
          {predicting ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Generating Prediction...
            </>
          ) : (
            'Generate Prediction'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PredictionPanel;

