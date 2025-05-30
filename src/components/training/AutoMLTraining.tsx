
import React, { useState, useEffect } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { useTraining } from '@/contexts/training/TrainingContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Rocket, HelpCircle, Play, Settings, Loader, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generateExperimentName } from '@/lib/constants';
import { TrainingEngine } from '@/types/training';
import { useAuth } from '@/contexts/AuthContext';
import * as trainingLib from '@/lib/training';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';

const AutoMLTraining: React.FC = () => {
  const { datasetId, taskType, processingStage } = useDataset();
  const {
    isTraining,
    setIsTraining,
    automlEngine,
    setAutomlEngine,
    testSize,
    setTestSize,
    stratify,
    setStratify,
    randomSeed,
    setRandomSeed,
    setError,
    startPolling,
    setLastTrainingType,
    setActiveExperimentId,
    experimentStatus,
    experimentName,
    setExperimentName,
    setResultsLoaded
  } = useTraining();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Add state to track whether the user has manually edited the name
  const [userEditedName, setUserEditedName] = useState(false);
  // Add state for MLJAR presets
  const [mljarPresets, setMljarPresets] = useState<trainingLib.MLJARPreset[]>([]);
  
  // Changed: Separate preset states for each engine type
  const [mljarSelectedPreset, setMljarSelectedPreset] = useState<string | null>(null);
  const [h2oSelectedPreset, setH2OSelectedPreset] = useState<string | null>(null);
  
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);
  
  // NEW: Add state for H2O presets
  const [h2oPresets, setH2OPresets] = useState<trainingLib.H2OPreset[]>([]);
  const [isLoadingH2OPresets, setIsLoadingH2OPresets] = useState(false);
  
  // Track submitted values - fixed the type for engine to be TrainingEngine | null
  const [submittedValues, setSubmittedValues] = useState<{
    engine: TrainingEngine | null;
    preset: string | null;
    experimentName: string;
    testSize: number;
    stratify: boolean;
    randomSeed: number;
  }>({
    engine: null,
    preset: null,
    experimentName: '',
    testSize: 0.2,
    stratify: true,
    randomSeed: 42
  });
  
  // Helper function to get the currently selected preset based on engine
  const getSelectedPreset = (): string | null => {
    if (automlEngine === 'mljar') {
      return mljarSelectedPreset;
    } else if (automlEngine === 'h2o') {
      return h2oSelectedPreset;
    }
    return null;
  };
  
  // Check if the task type is regression to determine if stratify should be disabled
  const isRegressionTask = taskType === 'regression';
  
  // New effect to load saved configuration from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem("automlTrainingConfig");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSubmittedValues(parsed);
        setExperimentName(parsed.experimentName);
        setTestSize(parsed.testSize);
        
        // Only set stratify if we're not in regression task type
        if (!isRegressionTask) {
          setStratify(parsed.stratify);
        } else {
          // Force stratify to false for regression tasks
          setStratify(false);
        }
        
        setRandomSeed(parsed.randomSeed);
        
        // Set the automl engine if it's valid
        if (parsed.engine && (parsed.engine === "mljar" || parsed.engine === "h2o")) {
          setAutomlEngine(parsed.engine);
        }
        
        // Set engine-specific presets if available
        if (parsed.engine === "mljar") setMljarSelectedPreset(parsed.preset);
        if (parsed.engine === "h2o") setH2OSelectedPreset(parsed.preset);
        
        console.log("Restored AutoML config from localStorage:", parsed);
      } catch (e) {
        console.warn("Failed to restore AutoML config:", e);
      }
    }
  }, [setExperimentName, setTestSize, setStratify, setRandomSeed, setAutomlEngine, isRegressionTask]);
  
  // Force stratify to false when task type is regression
  useEffect(() => {
    if (isRegressionTask && stratify) {
      console.log("Setting stratify to false for regression task");
      setStratify(false);
    }
  }, [taskType, isRegressionTask, stratify, setStratify]);
  
  useEffect(() => {
    // Initialize userEditedName to false when component first mounts
    setUserEditedName(false);
    // Enhanced logging to help debugging
    console.log("AutoML Training - Component mounted, reset userEditedName");
  }, []); // Empty dependency array ensures this runs only once on mount
  
  // Fetch MLJAR presets when automl engine is selected and it's "mljar"
  useEffect(() => {
    const fetchMljarPresets = async () => {
      if (automlEngine === 'mljar') {
        setIsLoadingPresets(true);
        try {
          const presets = await trainingLib.getMljarPresets();
          console.log("AutoML Training - Fetched MLJAR presets:", presets);
          setMljarPresets(presets);
          // Default to "balanced" preset if available and no preset is already selected
          const balancedPreset = presets.find(preset => preset.name === 'balanced');
          if (balancedPreset && !mljarSelectedPreset) {
            console.log("AutoML Training - Setting default MLJAR preset to:", balancedPreset.name);
            setMljarSelectedPreset(balancedPreset.name);
          } else if (presets.length > 0 && !mljarSelectedPreset) {
            console.log("AutoML Training - Setting default MLJAR preset to first preset:", presets[0].name);
            setMljarSelectedPreset(presets[0].name);
          }
        } catch (error) {
          console.error("Failed to fetch MLJAR presets:", error);
          toast({
            title: "Failed to load MLJAR presets",
            description: "Could not fetch training presets. Using default settings.",
            variant: "destructive"
          });
        } finally {
          setIsLoadingPresets(false);
        }
      }
    };
    
    fetchMljarPresets();
  }, [automlEngine, toast]);
  
  // NEW: Fetch H2O presets when automl engine is selected and it's "h2o"
  useEffect(() => {
    const fetchH2OPresets = async () => {
      if (automlEngine === 'h2o') {
        setIsLoadingH2OPresets(true);
        try {
          const presets = await trainingLib.getH2OPresets();
          console.log("AutoML Training - Fetched H2O presets:", presets);
          
          // Ensure presets is always an array (defensive programming)
          if (Array.isArray(presets) && presets.length > 0) {
            setH2OPresets(presets);
            // Default to "balanced" preset if available and no preset is already selected
            const balancedPreset = presets.find(preset => preset.name === 'balanced');
            if (balancedPreset && !h2oSelectedPreset) {
              console.log("AutoML Training - Setting default H2O preset to:", balancedPreset.name);
              setH2OSelectedPreset(balancedPreset.name);
            } else if (!h2oSelectedPreset) {
              console.log("AutoML Training - Setting default H2O preset to first preset:", presets[0].name);
              setH2OSelectedPreset(presets[0].name);
            }
          } else {
            // Handle empty presets array
            console.warn("AutoML Training - Empty H2O presets received, using defaults");
            toast({
              title: "Using default H2O presets",
              description: "Could not fetch custom training presets. Using default settings.",
            });
          }
        } catch (error) {
          console.error("Failed to fetch H2O presets:", error);
          toast({
            title: "Failed to load H2O presets",
            description: "Could not fetch training presets. Using default settings.",
            variant: "destructive"
          });
        } finally {
          setIsLoadingH2OPresets(false);
        }
      }
    };
    
    fetchH2OPresets();
  }, [automlEngine, toast]);
  
  useEffect(() => {
    // Enhanced logging to help debugging
    console.log("AutoML Training - Dataset context values:", { 
      datasetId, 
      taskType, 
      processingStage,
      experimentStatus
    });
  }, [datasetId, taskType, processingStage, experimentStatus]);

  // Handle engine change separately - Modified to not reset presets
  useEffect(() => {
    if (taskType && automlEngine) {
      // If experiment name is empty, generate a new one regardless of userEditedName flag
      if (!experimentName || experimentName.trim() === '') {
        const newName = generateExperimentName(automlEngine.toUpperCase(), '');
        console.log("AutoMLTraining - Generated experiment name (empty name):", newName);
        setExperimentName(newName);
      } 
      // If name was auto-generated (matches pattern of previous engine), update it
      else if (!userEditedName) {
        const newName = generateExperimentName(automlEngine.toUpperCase(), '');
        console.log("AutoMLTraining - Generated experiment name based on engine change:", newName);
        setExperimentName(newName);
      }
      else {
        console.log("AutoMLTraining - User edited name detected, keeping current name:", experimentName);
      }
      
      // We no longer reset preset selection when changing engine
      // Each engine type now has its own preset state
      console.log("AutoMLTraining - Engine changed to:", automlEngine, "- keeping separate preset selections");
    }
  }, [taskType, automlEngine, setExperimentName, experimentName, userEditedName]);

  // Reset userEditedName flag when training completes or component unmounts
  useEffect(() => {
    // Reset the flag when training completes
    if (!isTraining && experimentStatus !== 'processing' && experimentStatus !== 'running') {
      console.log("AutoMLTraining - Training completed, resetting userEditedName flag");
      setUserEditedName(false);
    }

    // Cleanup function to reset flag when component unmounts
    return () => {
      setUserEditedName(false);
    };
  }, [isTraining, experimentStatus]);

  // Handler for engine change
  const handleEngineChange = (value: string) => {
    setAutomlEngine(value as TrainingEngine);
    // Do not reset preset selection when changing engine anymore
    console.log("AutoMLTraining - Engine changed to:", value, "- preset selections preserved");
    
    // If the name field is empty, ensure we'll generate a new one
    if (!experimentName || experimentName.trim() === '') {
      setUserEditedName(false);
    }
  };
  
  const handleExperimentNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Mark that user has manually edited the name
    setUserEditedName(true);
    setExperimentName(e.target.value);
    console.log("AutoMLTraining - User edited experiment name:", e.target.value);
  };

  // Handler for MLJAR preset selection
  const handleMljarPresetChange = (value: string) => {
    console.log("AutoMLTraining - MLJAR preset changed to:", value);
    setMljarSelectedPreset(value);
  };

  // Handler for H2O preset selection
  const handleH2OPresetChange = (value: string) => {
    console.log("AutoMLTraining - H2O preset changed to:", value);
    setH2OSelectedPreset(value);
  };

  const handleTrainModel = async () => {
    if (!datasetId || !taskType || !automlEngine) {
      toast({
        title: "Missing Required Fields",
        description: "Dataset ID, task type, and AutoML engine are required",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to start training",
        variant: "destructive"
      });
      return;
    }

    if (isTraining || isSubmitting) {
      toast({
        title: "Training Already in Progress",
        description: "Please wait for the current training to complete",
      });
      return;
    }

    // Check if experimentName is empty or just whitespace
    let finalExperimentName = experimentName;
    if (!experimentName || experimentName.trim() === '') {
      // Generate a default experiment name as fallback
      finalExperimentName = generateExperimentName(automlEngine.toUpperCase(), '');
      console.log("[AutoMLTraining] Using generated fallback name:", finalExperimentName);
      
      // Update the experiment name in the context
      setExperimentName(finalExperimentName);
      
      // Inform user we're using a default name
      toast({
        title: "Using Default Name",
        description: `No name provided, using '${finalExperimentName}'`,
      });
    }

    // Use the correct preset based on the current engine
    const selectedPreset = getSelectedPreset();
    console.log("[AutoMLTraining] Using selected preset for current engine:", selectedPreset);

    try {
      setIsSubmitting(true);
      setIsTraining(true);
      setError(null);
      // Reset the results loaded state at the beginning of training
      setResultsLoaded(false);
      setActiveExperimentId(null);

      // Save submitted values before training starts and persist to localStorage
      const configToSave = {
        engine: automlEngine as TrainingEngine,
        preset: selectedPreset,
        experimentName: finalExperimentName,
        testSize,
        stratify,
        randomSeed
      };
      
      // Save to state
      setSubmittedValues(configToSave);
      
      // Persist to localStorage
      localStorage.setItem("automlTrainingConfig", JSON.stringify(configToSave));
      console.log("[AutoMLTraining] Saved training config to localStorage:", configToSave);

      toast({
        title: "Training Started",
        description: `Starting AutoML training with ${automlEngine}...`,
      });

      console.log("AutoMLTraining - Starting training with experiment name:", finalExperimentName);

      // ENHANCED: Add more debugging info before making the API call
      console.log("AutoMLTraining - Training parameters:", {
        datasetId,
        taskType,
        automlEngine,
        testSize,
        stratify,
        randomSeed,
        experimentName: finalExperimentName,
        presetProfile: selectedPreset
      });

      // Use the function from training.ts instead of api.ts
      const result = await trainingLib.automlTrain(
        datasetId,
        taskType,
        automlEngine,
        testSize,
        stratify,
        randomSeed,
        finalExperimentName, // Pass the final experiment name (either user-defined or generated)
        selectedPreset // Pass the selected preset if available
      );

      if (result && result.experiment_id) {
        // Enhanced logging for AutoML experiment tracking
        console.log("[AutoMLTraining] AutoML training submitted successfully:", {
          experimentId: result.experiment_id,
          experimentName: finalExperimentName,
          engine: automlEngine,
          setLastTrainingType: 'automl' 
        });

        // IMPROVED: First set the training type to 'automl' explicitly
        setLastTrainingType('automl');
        
        // CRITICAL: Then set the active experiment ID
        setActiveExperimentId(result.experiment_id);
        
        // ENHANCED: Start polling with additional debugging
        console.log("[AutoMLTraining] Starting polling for experiment:", result.experiment_id);
        startPolling(result.experiment_id);
        
        // Log the experiment ID and name for debugging
        console.log("AutoMLTraining - Training submitted:", {
          experimentId: result.experiment_id,
          experimentName: finalExperimentName,
          resultName: result.experiment_name
        });
        
        // Reset userEditedName flag after successful training start
        setUserEditedName(false);
        
        toast({
          title: "Training Submitted",
          description: `Experiment ${finalExperimentName} started and now processing...`,
        });
      } else {
        throw new Error('No experiment ID returned from the server');
      }
    } catch (error) {
      console.error('AutoML training error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to train model';
      setError(errorMessage);
      setIsTraining(false);
      
      toast({
        title: "Training Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    // Use the helper function to get the currently selected preset based on engine
    const currentSelectedPreset = getSelectedPreset();
    
    // Enhanced logging for form validation
    console.log("AutoML - Checking if form is valid:", {
      datasetId,
      taskType,
      automlEngine,
      testSize,
      processingStage,
      experimentName,
      selectedPreset: currentSelectedPreset
    });
    
    // Check if we have the required data and if dataset is properly processed
    // UPDATED: Accept both 'processed' and 'final' as valid processing stages
    const isValidProcessingStage = processingStage === 'final' || processingStage === 'processed';
    
    // MODIFIED: Removed the experimentName check since we'll generate a default one if needed
    // Add check for selected preset when using MLJAR or H2O
    let result = !!(
      datasetId &&
      taskType &&
      automlEngine &&
      testSize >= 0.1 &&
      testSize <= 0.5 &&
      isValidProcessingStage
    );
    
    // If using MLJAR or H2O, also require a preset
    if (result && (automlEngine === 'mljar' || automlEngine === 'h2o')) {
      result = !!currentSelectedPreset;
    }
    
    console.log("AutoML - Form validation result:", { 
      result, 
      isValidProcessingStage,
      currentSelectedPreset
    });
    
    return result;
  };

  // More explicit conditions for button disabled state
  const isButtonDisabled = () => {
    const formNotValid = !isFormValid();
    const isProcessing = experimentStatus === 'processing' || experimentStatus === 'running';
    const isSubmittingNow = isTraining || isSubmitting;
    
    console.log("AutoML - Button disabled conditions:", {
      formNotValid,
      isProcessing,
      isSubmittingNow,
      experimentStatus
    });
    
    return formNotValid || isProcessing || isSubmittingNow;
  };

  // Format time limit for display
  const formatTimeLimit = (timeLimit: number) => {
    if (timeLimit < 60) return `${timeLimit} seconds`;
    return `${Math.floor(timeLimit / 60)} minutes`;
  };

  // NEW: Function to get the active settings for display during training
  const getActiveSettings = () => {
    if (isTraining || isSubmitting) {
      return submittedValues;
    } else {
      return {
        engine: automlEngine as TrainingEngine, // Fixed the type here as well
        preset: getSelectedPreset(),
        experimentName,
        testSize,
        stratify,
        randomSeed
      };
    }
  };
  
  // Get the current active settings (either form values or submitted values)
  const activeSettings = getActiveSettings();

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-primary">
            <Rocket className="h-5 w-5" />
            AutoML Training
            {isTraining && (
              <Badge className="ml-2 bg-amber-500">Training in Progress</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Automatically train models with different algorithms and hyperparameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {!datasetId && (
              <Alert className="mb-4 bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                <AlertDescription>
                  Please select or process a dataset before training a model.
                </AlertDescription>
              </Alert>
            )}
            
            {datasetId && (!processingStage || !(processingStage === 'final' || processingStage === 'processed')) && (
              <Alert className="mb-4 bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                <AlertDescription>
                  Please complete dataset preprocessing before training. Current stage: {processingStage || 'unknown'}
                </AlertDescription>
              </Alert>
            )}
            
            {isTraining && (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
                <h3 className="text-sm font-medium mb-2">Training Configuration</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500">Engine:</span>{' '}
                    <span className="font-medium">{submittedValues.engine?.toUpperCase()}</span>
                  </div>
                  {(submittedValues.engine === 'mljar' || submittedValues.engine === 'h2o') && (
                    <div>
                      <span className="text-slate-500">Preset:</span>{' '}
                      <span className="font-medium capitalize">{submittedValues.preset || 'Default'}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500">Experiment:</span>{' '}
                    <span className="font-medium">{submittedValues.experimentName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Test Size:</span>{' '}
                    <span className="font-medium">{(submittedValues.testSize * 100).toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Stratify:</span>{' '}
                    <span className="font-medium">{submittedValues.stratify ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Random Seed:</span>{' '}
                    <span className="font-medium">{submittedValues.randomSeed}</span>
                  </div>
                </div>
              </div>
            )}

            {/* New persistent information alert about background processing */}
            <Alert className="mb-4 bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600 mr-2" />
              <AlertDescription>
                <span className="font-semibold">Training continues in the background:</span> You can close this browser tab or window, and your training will continue on our servers. Return anytime to check progress.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label>AutoML Engine</Label>
              <Select
                value={automlEngine}
                onValueChange={handleEngineChange}
                disabled={isTraining || isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select AutoML engine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mljar">MLJAR</SelectItem>
                  <SelectItem value="h2o">H2O</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* MLJAR Preset Selection - show only when MLJAR is selected */}
            {automlEngine === 'mljar' && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Training Preset
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Select a training profile that balances speed vs accuracy</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                
                {isLoadingPresets ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader className="h-4 w-4 animate-spin" />
                    Loading presets...
                  </div>
                ) : mljarPresets.length > 0 ? (
                  <RadioGroup 
                    value={mljarSelectedPreset || ''} 
                    onValueChange={handleMljarPresetChange}
                    className="space-y-3 pt-2"
                    disabled={isTraining || isSubmitting}
                  >
                    {mljarPresets.map(preset => (
                      <div key={preset.name} className="flex items-start space-x-2">
                        <RadioGroupItem value={preset.name} id={`preset-${preset.name}`} className="mt-1" />
                        <div className="space-y-1">
                          <Label 
                            htmlFor={`preset-${preset.name}`} 
                            className="text-base font-medium capitalize cursor-pointer"
                          >
                            {preset.name} 
                            <span className="text-xs ml-2 text-muted-foreground">
                              (~{formatTimeLimit(preset.time_limit)})
                            </span>
                          </Label>
                          <p className="text-sm text-muted-foreground">{preset.description}</p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="text-sm text-muted-foreground pt-1">
                    Could not load presets. Will use default settings.
                  </div>
                )}
              </div>
            )}
            
            {/* NEW: H2O Preset Selection - show only when H2O is selected */}
            {automlEngine === 'h2o' && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Training Preset
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Select a training profile that balances speed vs accuracy</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                
                {isLoadingH2OPresets ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader className="h-4 w-4 animate-spin" />
                    Loading presets...
                  </div>
                ) : h2oPresets.length > 0 ? (
                  <RadioGroup 
                    value={h2oSelectedPreset || ''} 
                    onValueChange={handleH2OPresetChange}
                    className="space-y-3 pt-2"
                    disabled={isTraining || isSubmitting}
                  >
                    {h2oPresets.map((preset) => (
                      <div key={preset.name} className="flex items-start space-x-2">
                        <RadioGroupItem value={preset.name} id={`h2o-preset-${preset.name}`} className="mt-1" />
                        <div className="space-y-1">
                          <Label 
                            htmlFor={`h2o-preset-${preset.name}`} 
                            className="text-base font-medium capitalize cursor-pointer"
                          >
                            {preset.name} 
                            <span className="text-xs ml-2 text-muted-foreground">
                              (~{preset.max_runtime_secs ? formatTimeLimit(preset.max_runtime_secs) : 'unknown time'})
                            </span>
                          </Label>
                          <p className="text-sm text-muted-foreground">{preset.description}</p>
                          <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded">{preset.nfolds}-fold CV</span>
                            {preset.exclude_algos && Array.isArray(preset.exclude_algos) && preset.exclude_algos.length > 0 && (
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                                Excludes: {preset.exclude_algos.join(', ')}
                              </span>
                            )}
                            {preset.balance_classes && (
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded">Balance Classes</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="text-sm text-muted-foreground pt-1">
                    Could not load presets. Will use default settings.
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="experiment-name" className="flex items-center gap-2">
                Experiment Name
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Name to identify this training experiment</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="experiment-name"
                value={experimentName || ''}
                onChange={handleExperimentNameChange}
                placeholder="Enter experiment name"
                disabled={isTraining || isSubmitting}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Test Set Split</Label>
                <span className="text-sm font-medium">{(testSize * 100).toFixed(0)}%</span>
              </div>
              <Slider
                id="test-size"
                min={0.1}
                max={0.5}
                step={0.05}
                value={[testSize]}
                onValueChange={(values) => setTestSize(values[0])}
                disabled={isTraining || isSubmitting}
                aria-label="Test set size"
              />
            </div>

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
                        <p>Maintains class distribution in train/test sets. Recommended for classification tasks.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <p className="text-xs text-muted-foreground">
                  {isRegressionTask 
                    ? "Not applicable for regression tasks"
                    : "Essential for balanced datasets in classification tasks"}
                </p>
              </div>
              <Switch
                id="stratify"
                checked={stratify}
                onCheckedChange={(checked) => setStratify(checked)}
                disabled={isTraining || isSubmitting || isRegressionTask}
                aria-label="Stratify split"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="random-seed" className="flex items-center gap-2">
                Random Seed
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Set for reproducible results. Using the same seed ensures consistent train/test splits.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="random-seed"
                type="number"
                min={0}
                value={randomSeed}
                onChange={(e) => setRandomSeed(parseInt(e.target.value) || 0)}
                disabled={isTraining || isSubmitting}
                placeholder="Enter random seed (e.g. 42)"
                aria-label="Random seed for reproducibility"
              />
              <p className="text-xs text-muted-foreground">For reproducible results</p>
            </div>

            {/* Comment out the Advanced Analytics section */}
            {/*
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
                        <p>Enable advanced analytics and tracking during training</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <p className="text-xs text-muted-foreground">Enable or disable advanced analytics</p>
              </div>
              <Switch
                id="enable-analytics"
                checked={enableAnalytics}
                onCheckedChange={(checked) => setEnableAnalytics(checked)}
                disabled={isTraining || isSubmitting}
                aria-label="Enable advanced analytics"
              />
            </div>
            */}

            <Button
              onClick={handleTrainModel}
              disabled={isButtonDisabled()}
              className="w-full mt-4"
              size="lg"
            >
              {isTraining || isSubmitting ? (
                <>
                  <Loader className="mr-2 h-5 w-5 animate-spin" />
                  {experimentStatus === 'processing' 
                    ? 'Processing...' 
                    : experimentStatus === 'running' 
                      ? 'Training in Progress...' 
                      : 'Starting Training...'}
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Train Model with {automlEngine}
                </>
              )}
            </Button>

            <div className="text-sm text-muted-foreground bg-primary-foreground p-3 rounded-md mt-4">
              <p className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Training might take several minutes depending on dataset size and complexity.</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutoMLTraining;
