
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Info, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ColumnSchema, getPredictionSchema, PredictionSchemaResponse } from '@/lib/training';
import { API_BASE_URL } from '@/lib/constants';
import { getAuthHeaders } from '@/lib/utils';
import BatchPredictionView from './prediction/BatchPredictionView';
import { ManualPredictionResponse } from './prediction/PredictionResponse.types';
import { ProbabilitiesCell } from './prediction/table/ProbabilitiesCell';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useTraining } from '@/contexts/training/TrainingContext';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface DynamicPredictionFormProps {
  experimentId: string;
}

const DynamicPredictionForm: React.FC<DynamicPredictionFormProps> = ({ experimentId }) => {
  const [columnSchemas, setColumnSchemas] = useState<ColumnSchema[]>([]);
  const [target, setTarget] = useState<string>('');
  const [example, setExample] = useState<Record<string, any>>({});
  const [manualInputs, setManualInputs] = useState<Record<string, any>>({});
  const [prediction, setPrediction] = useState<ManualPredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPredicting, setIsPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outOfRangeWarnings, setOutOfRangeWarnings] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const { setIsPredicting: setGlobalIsPredicting } = useTraining();

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setColumnSchemas([]);
    setTarget('');
    setExample({});
    setManualInputs({});
    setPrediction(null);
    setOutOfRangeWarnings({});

    if (!experimentId) return;

    const fetchSchema = async () => {
      try {
        const schema = await getPredictionSchema(experimentId);
        console.log('Fetched schema:', schema);

        // Set the target column
        setTarget(schema.target || schema.target_column || '');
        
        // Set example data
        setExample(schema.example || schema.sample_row || {});
        
        // Process column schemas
        if (Array.isArray(schema.columns) && schema.columns.length > 0) {
          // Enhanced schema with type information
          setColumnSchemas(schema.columns.filter(col => col.name !== schema.target));
          
          // Initialize inputs with default values
          const newInputs: Record<string, any> = {};
          schema.columns.forEach(col => {
            if (col.name !== schema.target) {
              // For categorical columns with defined values, use the first value as default
              if (col.type === 'categorical' && Array.isArray(col.values) && col.values.length > 0) {
                newInputs[col.name] = col.values[0];
              } else {
                newInputs[col.name] = '';
              }
            }
          });
          setManualInputs(newInputs);
        } else {
          // Legacy schema format - construct basic column schemas
          const legacyColumns = (schema.features || [])
            .filter(feat => feat !== schema.target_column)
            .map(feat => ({
              name: feat,
              type: 'categorical' as const, // Default to categorical if no type info
              required: true,
              values: undefined,
              range: undefined
            }));
            
          setColumnSchemas(legacyColumns);
          
          // Initialize inputs with empty values
          const newInputs: Record<string, any> = {};
          legacyColumns.forEach(col => {
            newInputs[col.name] = '';
          });
          setManualInputs(newInputs);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch prediction schema';
        setError(msg);
        toast({
          title: "Error",
          description: msg,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSchema();
  }, [experimentId, toast]);

  const handleInputChange = (col: string, value: string) => {
    setManualInputs(prev => {
      // Convert numerical values to numbers
      const columnSchema = columnSchemas.find(schema => schema.name === col);
      
      // Check if the input is out of range for numerical columns
      if (columnSchema?.type === 'numerical' && value !== '') {
        const numValue = parseFloat(value);
        
        // Check if the value is significantly outside the recommended range
        if (!isNaN(numValue) && columnSchema.range && columnSchema.range.length === 2) {
          const [min, max] = columnSchema.range;
          const range = max - min;
          const buffer = range * 0.2; // 20% buffer
          
          const isOutOfRange = numValue < (min - buffer) || numValue > (max + buffer);
          
          setOutOfRangeWarnings(prev => ({
            ...prev,
            [col]: isOutOfRange
          }));
        }
        
        return { ...prev, [col]: isNaN(numValue) ? value : numValue };
      }
      
      return { ...prev, [col]: value };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPredicting(true);
    setGlobalIsPredicting(true);
    setError(null);
    setPrediction(null);

    try {
      console.log('Input values before processing:', manualInputs);
      
      const processedInputs: Record<string, any> = {};
      for (const [key, value] of Object.entries(manualInputs)) {
        // Ensure numeric values are sent as numbers
        const columnSchema = columnSchemas.find(schema => schema.name === key);
        if (columnSchema?.type === 'numerical' && typeof value === 'string') {
          const numValue = Number(value);
          processedInputs[key] = isNaN(numValue) ? value : numValue;
        } else {
          processedInputs[key] = value;
        }
      }
      
      // Use only experiment_id and input_values - let backend handle model loading
      const formData = new FormData();
      formData.append('experiment_id', experimentId);
      formData.append('input_values', JSON.stringify(processedInputs));

      const token = (await getAuthHeaders())?.Authorization?.replace('Bearer ', '');
      const headers = new Headers();
      if (token) {
        headers.append('Authorization', `Bearer ${token}`);
      }

      // Call the backend prediction endpoint, passing only experiment_id and inputs
      const response = await fetch(
        `${API_BASE_URL}/prediction/predict-manual/`,
        {
          method: 'POST',
          headers,
          body: formData,
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const json = await response.json();
      console.log('Prediction response:', json);
      
      if (json.data) {
        setPrediction(json.data);
        toast({
          title: "Success",
          description: "Prediction generated successfully",
        });
      } else {
        throw new Error('Invalid prediction response format');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate prediction';
      setError(msg);
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsPredicting(false);
      setGlobalIsPredicting(false);
    }
  };

  // Render the appropriate input control based on column type
  const renderInputControl = (column: ColumnSchema) => {
    // Fix: Use a conditional to properly handle 0 values
    const value = manualInputs[column.name];
    const displayValue = value === 0 ? '0' : value || '';
    const placeholder = example[column.name] !== undefined ? String(example[column.name]) : '';
    const isOutOfRange = outOfRangeWarnings[column.name];

    if (column.type === 'categorical') {
      // If it's a categorical column with values
      if (Array.isArray(column.values) && column.values.length > 0) {
        return (
          <Select 
            onValueChange={(val) => handleInputChange(column.name, val)}
            value={displayValue.toString()}
            disabled={isPredicting}
            defaultValue={column.values[0]}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${column.name}`} />
            </SelectTrigger>
            <SelectContent>
              {column.values.map((val) => (
                <SelectItem key={val} value={val}>
                  {val}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      } 
      // If it's a categorical column with too many values or no values specified
      return (
        <Input
          id={`field-${column.name}`}
          value={displayValue}
          onChange={(e) => handleInputChange(column.name, e.target.value)}
          placeholder={column.values === 'too_many' 
            ? `Enter category (many options)` 
            : placeholder}
          disabled={isPredicting}
        />
      );
    } 
    
    // If it's a numerical column
    if (column.type === 'numerical') {
      const hasRange = column.range && column.range.length === 2;
      
      return (
        <div className="space-y-2">
          <Input
            id={`field-${column.name}`}
            type="number"
            value={displayValue}
            onChange={(e) => handleInputChange(column.name, e.target.value)}
            placeholder={placeholder}
            step="any"
            disabled={isPredicting}
            className={isOutOfRange ? "border-amber-500" : ""}
          />
          {hasRange && (
            <p className="text-xs text-muted-foreground">
              <Info className="inline-block h-3 w-3 mr-1" />
              Typical range: {column.range[0]} - {column.range[1]}
            </p>
          )}
          {isOutOfRange && (
            <p className="text-xs text-amber-600 flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              This value is outside the typical training data range and may lead to less reliable predictions
            </p>
          )}
        </div>
      );
    }
    
    // Default fallback (should not reach here if schema is correct)
    return (
      <Input
        id={`field-${column.name}`}
        value={displayValue}
        onChange={(e) => handleInputChange(column.name, e.target.value)}
        placeholder={placeholder}
        disabled={isPredicting}
      />
    );
  };

  const renderPredictionValue = (prediction: ManualPredictionResponse) => {
    const value = prediction.prediction;
    const displayValue = prediction.task_type === 'regression' 
      ? (typeof value === 'number' ? value.toFixed(4) : value)
      : String(value);
    
    if (!prediction.class_probabilities) {
      return (
        <Input
          id="field-target"
          value={displayValue}
          placeholder="Prediction will appear here"
          disabled
          className="bg-gray-100 text-gray-500 cursor-not-allowed font-medium"
          readOnly
        />
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Input
            id="field-target"
            value={displayValue}
            placeholder="Prediction will appear here"
            disabled
            className="bg-gray-100 text-gray-500 cursor-not-allowed font-medium"
            readOnly
          />
          {prediction.confidence_score !== undefined && (
            <Badge variant="outline" className="shrink-0">
              {(prediction.confidence_score * 100).toFixed(1)}% confident
            </Badge>
          )}
        </div>
        <div className="border rounded-md p-3 bg-muted/30">
          <ProbabilitiesCell 
            probabilities={prediction.class_probabilities} 
            showInline={true}
          />
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Loading prediction form...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!columnSchemas.length || !target) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No schema available for this experiment.</p>
        </CardContent>
      </Card>
    );
  }

  // Helper to check if all inputs are filled - updated to properly handle zero values
  const areAllInputsFilled = () => {
    return columnSchemas.every(col => {
      const value = manualInputs[col.name];
      // Check if the value is defined and not an empty string
      // For numbers, explicitly check if it's 0 or any other number
      if (typeof value === 'number') {
        return true; // Any number including 0 is valid
      }
      return value !== undefined && value !== '';
    });
  };

  return (
    <Tabs defaultValue="manual" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="manual">Predict Manually</TabsTrigger>
        <TabsTrigger value="batch">Predict from CSV</TabsTrigger>
      </TabsList>
      
      <TabsContent value="manual">
        <Card>
          <CardHeader>
            <CardTitle>Make a Single Prediction</CardTitle>
            <CardDescription>
              Enter values for each feature to get a prediction for {target}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {columnSchemas.map(column => (
                  <div key={column.name} className="space-y-2">
                    <Label htmlFor={`field-${column.name}`}>
                      {column.name}
                    </Label>
                    {renderInputControl(column)}
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                <Label htmlFor="field-target" className="text-primary">
                  {prediction?.task_type === 'regression' ? 'Predicted Value' : 'Prediction'}
                </Label>
                {prediction ? (
                  renderPredictionValue(prediction)
                ) : (
                  <Input
                    id="field-target"
                    value=""
                    placeholder="Prediction will appear here"
                    disabled
                    className="bg-gray-100 text-gray-500 cursor-not-allowed font-medium"
                    readOnly
                  />
                )}
              </div>
              <Button
                type="submit"
                className="mt-6 w-full"
                disabled={isPredicting || !areAllInputsFilled()}
              >
                {isPredicting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Generate Prediction'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="batch">
        <BatchPredictionView experimentId={experimentId} />
      </TabsContent>
    </Tabs>
  );
};

export default DynamicPredictionForm;
