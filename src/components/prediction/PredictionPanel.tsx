
import React, { useState, useEffect } from 'react';
import { getExperimentResults, predictManual } from '@/lib/training';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader } from 'lucide-react';

interface PredictionPanelProps {
  experimentId: string;
}

type ManualForm = {
  allColumns: string[]; // all columns including target
  features: string[];   // features, excluding target column
  sampleRow: Record<string, string>;
  targetColumn: string;
};

const parseCsvSample = (csvText: string, targetColumn: string) => {
  const rows = csvText.trim().split('\n');
  if (rows.length < 2) return { allColumns: [], features: [], sampleRow: {}, target: '' };

  const header = rows[0].split(',').map(col => col.trim());
  const firstRow = rows[1].split(',');

  const features = header.filter(f => f !== targetColumn);
  const sampleRow: Record<string, string> = {};
  header.forEach((col, idx) => {
    sampleRow[col] = (firstRow[idx] ?? '').trim();
  });

  return { allColumns: header, features, sampleRow };
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

        let allColumns: string[] = [];
        let features: string[] = [];
        let sampleRow: Record<string, string> = {};

        // 2. Get dataset_file_url and sample row
        let datasetFileUrl: string | undefined;
        if (result.files?.length) {
          const datasetFile = result.files.find(f => f.file_type === 'dataset');
          if (datasetFile?.file_url) {
            datasetFileUrl = datasetFile.file_url;
          }
        }
        if (!datasetFileUrl && (result as any).dataset_file_url) {
          datasetFileUrl = (result as any).dataset_file_url;
        }

        if (datasetFileUrl) {
          const resp = await fetch(datasetFileUrl);
          const text = await resp.text();
          const res = parseCsvSample(text, target_column);
          allColumns = res.allColumns;
          features = res.features;
          sampleRow = res.sampleRow;
        } else if (result.columns_to_keep && result.columns_to_keep.length > 0) {
          allColumns = result.columns_to_keep;
          features = result.columns_to_keep.filter(f => f !== target_column);
          features.forEach(f => sampleRow[f] = '');
        } else {
          throw new Error('Unable to load feature columns');
        }

        setManualForm({
          allColumns,
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
    setError(null);

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
        <CardTitle>Manual Input</CardTitle>
        <CardDescription>
          Enter values for each feature to generate a prediction.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-auto">
          <form
            onSubmit={e => {
              e.preventDefault();
              handlePredict();
            }}
          >
            <div className="flex flex-row gap-4 items-end mb-4">
              {manualForm &&
                manualForm.allColumns.map((col) => {
                  const isTarget = col === manualForm.targetColumn;
                  if (isTarget) {
                    // Prediction output field (different color & disabled)
                    return (
                      <div key={col} className="flex flex-col items-start" style={{ minWidth: 140 }}>
                        <Label htmlFor={`manual-${col}`}>{col}</Label>
                        <Input
                          id={`manual-${col}`}
                          placeholder={manualForm.sampleRow[col] || ''}
                          value={
                            prediction !== null
                              ? typeof prediction === 'number'
                                ? prediction.toFixed(4)
                                : prediction
                              : ''
                          }
                          readOnly
                          disabled
                          className="bg-primary/10 text-primary focus:shadow-none opacity-90 font-semibold ring-0 border-2 border-primary/20"
                        />
                        {taskType.includes('classification') && confidence !== null && (
                          <Badge variant="outline" className="mt-1 bg-primary/10 text-primary text-xs">
                            {(confidence * 100).toFixed(1)}% confidence
                          </Badge>
                        )}
                      </div>
                    );
                  } else {
                    // Editable feature input
                    return (
                      <div key={col} className="flex flex-col items-start" style={{ minWidth: 140 }}>
                        <Label htmlFor={`manual-${col}`}>{col}</Label>
                        <Input
                          id={`manual-${col}`}
                          placeholder={manualForm.sampleRow[col] || `Enter ${col}`}
                          value={inputValues[col] || ''}
                          onChange={e => handleInputChange(col, e.target.value)}
                          className=""
                          disabled={predicting}
                          autoComplete="off"
                        />
                      </div>
                    );
                  }
                })}
            </div>
            <Button
              type="submit"
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
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

export default PredictionPanel;
