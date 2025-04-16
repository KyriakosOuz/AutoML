
import React, { useState, useEffect } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { useTraining } from '@/contexts/TrainingContext';
import { trainingApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertCircle, 
  ChevronDown, 
  HelpCircle, 
  Play, 
  RotateCcw, 
  Settings,
  Code
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';

interface AlgorithmOption {
  name: string;
  description: string;
}

interface Hyperparameter {
  name: string;
  type: 'int' | 'float' | 'boolean' | 'string' | 'categorical';
  default: any;
  range?: [number, number];
  options?: string[];
  description: string;
}

const CustomTraining: React.FC = () => {
  const { datasetId, targetColumn, taskType } = useDataset();
  const { 
    isTraining, 
    setIsTraining,
    customParameters, 
    setCustomParameters,
    setCustomResult,
    setLastTrainingType,
    setError
  } = useTraining();
  const { toast } = useToast();
  
  const [algorithms, setAlgorithms] = useState<AlgorithmOption[]>([]);
  const [hyperparameters, setHyperparameters] = useState<Hyperparameter[]>([]);
  const [hyperparamValues, setHyperparamValues] = useState<Record<string, any>>({});
  const [isLoadingAlgorithms, setIsLoadingAlgorithms] = useState(false);
  const [isLoadingHyperparams, setIsLoadingHyperparams] = useState(false);
  
  // Load available algorithms based on task type
  useEffect(() => {
    const loadAlgorithms = async () => {
      if (!taskType) return;
      
      try {
        setIsLoadingAlgorithms(true);
        const response = await trainingApi.getAvailableAlgorithms(taskType);
        setAlgorithms(response.algorithms);
      } catch (error) {
        console.error('Error loading algorithms:', error);
        toast({
          title: "Failed to load algorithms",
          description: "Could not retrieve algorithms for your task type",
          variant: "destructive"
        });
      } finally {
        setIsLoadingAlgorithms(false);
      }
    };
    
    loadAlgorithms();
  }, [taskType, toast]);
  
  // Load hyperparameters when algorithm changes
  useEffect(() => {
    const loadHyperparameters = async () => {
      if (!customParameters.algorithm) return;
      
      try {
        setIsLoadingHyperparams(true);
        const response = await trainingApi.getHyperparameters(customParameters.algorithm);
        setHyperparameters(response.hyperparameters);
        
        // Initialize hyperparameter values with defaults
        const defaultValues = response.hyperparameters.reduce((acc: Record<string, any>, param: Hyperparameter) => {
          acc[param.name] = param.default;
          return acc;
        }, {});
        
        setHyperparamValues(defaultValues);
        setCustomParameters({ hyperparameters: defaultValues });
      } catch (error) {
        console.error('Error loading hyperparameters:', error);
        toast({
          title: "Failed to load hyperparameters",
          description: "Could not retrieve default hyperparameters for the selected algorithm",
          variant: "destructive"
        });
      } finally {
        setIsLoadingHyperparams(false);
      }
    };
    
    loadHyperparameters();
  }, [customParameters.algorithm, setCustomParameters, toast]);
  
  const handleTrainModel = async () => {
    if (!datasetId || !targetColumn || !customParameters.algorithm) {
      toast({
        title: "Missing data",
        description: "Dataset, target column or algorithm not selected",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsTraining(true);
      setError(null);
      setLastTrainingType('custom');
      
      const { 
        algorithm, 
        hyperparameters, 
        testSize, 
        stratify, 
        randomSeed, 
        enableAnalytics 
      } = customParameters;
      
      toast({
        title: "Training Started",
        description: `Starting ${algorithm} training...`,
      });
      
      const response = await trainingApi.customTrain(
        datasetId,
        algorithm,
        hyperparameters,
        testSize,
        stratify,
        randomSeed,
        enableAnalytics
      );
      
      // Format the response to match our context state
      const formattedResult = {
        experimentId: response.experiment_id,
        selectedAlgorithm: response.selected_algorithm,
        taskType: response.task_type,
        target: response.target || targetColumn,
        metrics: response.metrics,
        modelPath: response.model_path,
        completedAt: response.completed_at || new Date().toISOString(),
        trainingTimeSec: response.training_time_sec,
        modelFormat: response.model_format
      };
      
      setCustomResult(formattedResult);
      
      toast({
        title: "Training Complete",
        description: `${algorithm} training completed successfully`,
      });
    } catch (error) {
      console.error('Custom training error:', error);
      setError(error instanceof Error ? error.message : 'Failed to train model');
      toast({
        title: "Training Failed",
        description: error instanceof Error ? error.message : 'Failed to train model',
        variant: "destructive"
      });
    } finally {
      setIsTraining(false);
    }
  };
  
  const handleHyperparamChange = (paramName: string, value: any) => {
    const updatedValues = {
      ...hyperparamValues,
      [paramName]: value
    };
    
    setHyperparamValues(updatedValues);
    setCustomParameters({ hyperparameters: updatedValues });
  };
  
  const resetParameters = () => {
    // Reset to default hyperparameters
    const defaultValues = hyperparameters.reduce((acc: Record<string, any>, param: Hyperparameter) => {
      acc[param.name] = param.default;
      return acc;
    }, {});
    
    setHyperparamValues(defaultValues);
    setCustomParameters({
      hyperparameters: defaultValues,
      testSize: 0.2,
      stratify: true,
      randomSeed: 42,
      enableAnalytics: true,
    });
    
    toast({
      title: "Parameters Reset",
      description: "All parameters have been reset to their default values",
    });
  };
  
  // Render hyperparameter controls based on type
  const renderHyperparamControl = (param: Hyperparameter) => {
    const value = hyperparamValues[param.name];
    
    switch (param.type) {
      case 'int':
        return (
          <Input
            id={`param-${param.name}`}
            type="number"
            step={1}
            min={param.range?.[0]}
            max={param.range?.[1]}
            value={value}
            onChange={(e) => handleHyperparamChange(param.name, parseInt(e.target.value) || param.default)}
            disabled={isTraining}
          />
        );
      case 'float':
        return (
          <Input
            id={`param-${param.name}`}
            type="number"
            step={0.01}
            min={param.range?.[0]}
            max={param.range?.[1]}
            value={value}
            onChange={(e) => handleHyperparamChange(param.name, parseFloat(e.target.value) || param.default)}
            disabled={isTraining}
          />
        );
      case 'boolean':
        return (
          <Switch
            id={`param-${param.name}`}
            checked={value}
            onCheckedChange={(checked) => handleHyperparamChange(param.name, checked)}
            disabled={isTraining}
          />
        );
      case 'categorical':
        return (
          <Select
            value={String(value)}
            onValueChange={(val) => handleHyperparamChange(param.name, val)}
            disabled={isTraining}
          >
            <SelectTrigger id={`param-${param.name}`}>
              <SelectValue placeholder={`Select ${param.name}`} />
            </SelectTrigger>
            <SelectContent>
              {param.options?.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            id={`param-${param.name}`}
            value={value}
            onChange={(e) => handleHyperparamChange(param.name, e.target.value)}
            disabled={isTraining}
          />
        );
    }
  };
  
  return (
    <Card className="w-full mt-6 rounded-2xl shadow-lg transition-all hover:shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl text-primary">
          <Code className="h-5 w-5" />
          Custom Model Training
        </CardTitle>
        <CardDescription>
          Train machine learning models with custom algorithms and hyperparameters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Algorithm Selection */}
          <div className="space-y-2">
            <Label htmlFor="algorithm" className="flex items-center gap-2">
              Select Algorithm
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Choose a machine learning algorithm suitable for your {taskType?.replace('_', ' ')} task.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Select
              value={customParameters.algorithm}
              onValueChange={(value) => setCustomParameters({ algorithm: value })}
              disabled={isTraining || isLoadingAlgorithms}
            >
              <SelectTrigger id="algorithm" className="w-full">
                <SelectValue placeholder={isLoadingAlgorithms ? "Loading algorithms..." : "Select algorithm"} />
              </SelectTrigger>
              <SelectContent>
                {algorithms.map((algo) => (
                  <SelectItem key={algo.name} value={algo.name}>
                    {algo.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Hyperparameters Section */}
          {customParameters.algorithm && (
            <Accordion type="single" collapsible className="w-full border rounded-lg">
              <AccordionItem value="hyperparameters">
                <AccordionTrigger className="px-4">
                  <span className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Hyperparameters
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {isLoadingHyperparams ? (
                    <div className="py-2 text-center">Loading hyperparameters...</div>
                  ) : hyperparameters.length > 0 ? (
                    <div className="space-y-4">
                      {hyperparameters.map((param) => (
                        <div key={param.name} className="grid grid-cols-1 gap-2">
                          <div className="flex justify-between items-center">
                            <Label 
                              htmlFor={`param-${param.name}`}
                              className="flex items-center gap-2"
                            >
                              {param.name}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">{param.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </Label>
                            {renderHyperparamControl(param)}
                          </div>
                          {param.range && (
                            <p className="text-xs text-muted-foreground">
                              Range: {param.range[0]} to {param.range[1]}
                            </p>
                          )}
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={resetParameters}
                        className="mt-4"
                        disabled={isTraining}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset to Defaults
                      </Button>
                    </div>
                  ) : (
                    <div className="py-2 text-center text-muted-foreground">
                      No hyperparameters available for this algorithm
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
          
          {/* Test Size Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                Test Set Split
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Percentage of data used for testing model performance. 0.2 means 20% test, 80% train.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <span className="text-sm font-medium">{customParameters.testSize * 100}%</span>
            </div>
            <Slider
              id="test-size"
              min={0.1}
              max={0.5}
              step={0.05}
              value={[customParameters.testSize]}
              onValueChange={(values) => setCustomParameters({ testSize: values[0] })}
              disabled={isTraining}
              aria-label="Test set size"
            />
          </div>
          
          {/* Stratify Option */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <Label htmlFor="stratify" className="flex items-center gap-2">
                Stratify Split
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Maintain the same distribution of target classes in both training and test sets.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <p className="text-xs text-muted-foreground">Maintains class balance in train/test sets</p>
            </div>
            <Switch
              id="stratify"
              checked={customParameters.stratify}
              onCheckedChange={(checked) => setCustomParameters({ stratify: checked })}
              disabled={isTraining}
              aria-label="Stratify split"
            />
          </div>
          
          {/* Random Seed */}
          <div className="space-y-2">
            <Label htmlFor="random-seed" className="flex items-center gap-2">
              Random Seed
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Set for reproducible results. Using the same seed will produce the same train/test split.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              id="random-seed"
              type="number"
              min={0}
              value={customParameters.randomSeed}
              onChange={(e) => setCustomParameters({ randomSeed: parseInt(e.target.value) || 0 })}
              disabled={isTraining}
              placeholder="Enter random seed (e.g. 42)"
              aria-label="Random seed for reproducibility"
            />
          </div>
          
          {/* Enable Analytics Option */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <Label htmlFor="enable-analytics" className="flex items-center gap-2">
                Enable Advanced Analytics
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Generates additional outputs like SHAP values, probability outputs, and more detailed visualizations.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <p className="text-xs text-muted-foreground">Adds SHAP, ROC curves, and probability outputs (may increase training time)</p>
            </div>
            <Switch
              id="enable-analytics"
              checked={customParameters.enableAnalytics}
              onCheckedChange={(checked) => setCustomParameters({ enableAnalytics: checked })}
              disabled={isTraining}
              aria-label="Enable advanced analytics"
            />
          </div>
          
          {/* Training Button */}
          <Button
            onClick={handleTrainModel}
            disabled={isTraining || !datasetId || !customParameters.algorithm}
            className="w-full mt-4"
            size="lg"
          >
            {isTraining ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Training in Progress...
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                Train Custom {customParameters.algorithm} Model
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomTraining;
