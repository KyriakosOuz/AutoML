import React, { useState } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { datasetApi } from '@/lib/api';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Extract clean task type from response
const extractTaskType = (response: any): string | null => {
  console.log("Extracting task type from:", response);
  
  if (!response) return null;
  
  // Handle string response
  if (typeof response === 'string') {
    // Check if the string contains "classification" or "regression"
    const lcResponse = response.toLowerCase();
    if (lcResponse.includes('classification')) {
      return lcResponse.includes('binary') ? 'binary_classification' : 'multiclass_classification';
    } else if (lcResponse.includes('regression')) {
      return 'regression';
    }
    return response.trim().toLowerCase();
  }
  
  // Handle object response
  if (typeof response === 'object') {
    // Try to find task_type in the response object
    if (response.task_type) {
      const taskTypeStr = response.task_type.toString().toLowerCase();
      if (taskTypeStr.includes('classification')) {
        return taskTypeStr.includes('binary') ? 'binary_classification' : 'multiclass_classification';
      } else if (taskTypeStr.includes('regression')) {
        return 'regression';
      }
      return taskTypeStr;
    }
    
    // Try to determine based on Data field with Task Type
    if (response.Data && typeof response.Data === 'object') {
      const dataObj = response.Data;
      if (dataObj['Task Type'] && typeof dataObj['Task Type'] === 'string') {
        const typeStr = dataObj['Task Type'].toLowerCase();
        if (typeStr.includes('classification')) {
          return typeStr.includes('binary') ? 'binary_classification' : 'multiclass_classification';
        } else if (typeStr.includes('regression')) {
          return 'regression';
        }
        return typeStr;
      }
    }
    
    // Check if the response itself contains the key terms
    const jsonStr = JSON.stringify(response).toLowerCase();
    if (jsonStr.includes('classification')) {
      return jsonStr.includes('binary') ? 'binary_classification' : 'multiclass_classification';
    } else if (jsonStr.includes('regression')) {
      return 'regression';
    }
  }
  
  return null;
};

// Format task type for better display
const formatTaskType = (type: string | null): string => {
  if (!type) return '';
  
  if (type === 'binary_classification') return 'Binary Classification';
  if (type === 'multiclass_classification') return 'Multiclass Classification';
  if (type === 'regression') return 'Regression';
  
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface TaskTypeSelectorProps {
  onTargetColumnChange: (value: string) => void;
}

const TaskTypeSelector: React.FC<TaskTypeSelectorProps> = ({ onTargetColumnChange }) => {
  const { 
    datasetId, 
    previewColumns, 
    targetColumn,
    taskType,
    updateState
  } = useDataset();
  
  const [isDetectingTaskType, setIsDetectingTaskType] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(targetColumn);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Handle target column change and detect task type
  const handleTargetColumnChange = async (value: string) => {
    if (!value || !datasetId) return;
    
    try {
      // Update local state first for UI responsiveness
      setSelectedTarget(value);
      setIsDetectingTaskType(true);
      setError(null);
      
      console.log(`Detecting task type for dataset ${datasetId} with target column ${value}`);
      
      // Call the API to detect task type
      const response = await datasetApi.detectTaskType(datasetId, value);
      
      console.log('🔍 Full task type detection response:', response);
      
      // Extract clean task type
      const detectedTaskType = extractTaskType(response);
      
      // Check if we have a valid task type
      if (!detectedTaskType) {
        console.error('❌ Could not extract task type from response:', response);
        throw new Error('Could not determine task type from API response');
      }
      
      console.log(`✅ Successfully determined task type: ${detectedTaskType}`);
      
      // Call the passed callback with the selected value
      onTargetColumnChange(value);
      
      // Update the task type in the context
      updateState({
        targetColumn: value,
        taskType: detectedTaskType
      });
      
      toast({
        title: "Task type detected",
        description: `Detected task type: ${formatTaskType(detectedTaskType)}`,
        duration: 3000,
      });
      
    } catch (error) {
      console.error('❌ Error detecting task type:', error);
      setError(error instanceof Error ? error.message : 'Failed to detect task type');
      setSelectedTarget(targetColumn); // Reset on error
    } finally {
      setIsDetectingTaskType(false);
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
      <h3 className="font-medium mb-3">Step 1: Select Target Column</h3>
      <div className="flex items-center gap-2 mb-2">
        <label className="text-sm font-medium">Target Column</label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full p-0">
                <HelpCircle className="h-3 w-3" />
                <span className="sr-only">Help</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                This is the variable you want to predict. Selecting a target will
                automatically detect the task type (regression or classification).
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Select
        value={selectedTarget || ''}
        onValueChange={handleTargetColumnChange}
        disabled={isDetectingTaskType}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select target column" />
        </SelectTrigger>
        <SelectContent>
          {previewColumns && previewColumns.map((column) => (
            <SelectItem key={column} value={column}>
              {column}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {isDetectingTaskType && (
        <div className="mt-3">
          <div className="flex items-center gap-2 text-purple-700">
            <Skeleton className="h-4 w-4 rounded-full animate-pulse bg-purple-200" />
            <span className="text-sm">Detecting task type...</span>
          </div>
        </div>
      )}
      
      {selectedTarget && taskType && !isDetectingTaskType && (
        <div className="mt-3">
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex flex-col gap-2">
              <h4 className="font-medium text-purple-800">Detected Task Type</h4>
              <Badge className="capitalize w-fit bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-300">
                {formatTaskType(taskType)}
              </Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskTypeSelector;
