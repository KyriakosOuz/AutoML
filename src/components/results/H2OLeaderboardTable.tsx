
import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ArrowUpDown, Check, Info } from 'lucide-react';
import { formatTrainingTime } from '@/utils/formatUtils';

interface Model {
  model_id: string;
  logloss?: number;
  auc?: number;
  aucpr?: number;
  mean_per_class_error?: number;
  rmse?: number;
  mse?: number;
  training_time_sec?: number;
  // For proper display
  name?: string;
  rank?: number;
}

interface H2OLeaderboardTableProps {
  data: string | Model[];
  defaultSortMetric?: string;
  onModelSelect?: (modelId: string) => void;
  selectedModelId?: string | null;
}

// Format metric for display
const formatMetricValue = (value: number | undefined, isPercentage: boolean = false) => {
  if (value === undefined) return 'N/A';
  if (isPercentage) {
    return `${(value * 100).toFixed(2)}%`;
  }
  return value.toFixed(4);
};

// Helper to extract a readable model name from model_id
const extractModelName = (modelId: string): string => {
  // Extract the algorithm name from the model_id (e.g., "GBM", "DRF", "XGBoost")
  const match = modelId.match(/^(\w+)_\d+/);
  if (match && match[1]) {
    return match[1];
  }
  return modelId;
};

// Parse CSV data into models array
const parseLeaderboardCsv = (csvText: string): Model[] => {
  // Split by lines and remove empty lines
  const lines = csvText.split('\n').filter(line => line.trim());
  
  if (lines.length <= 1) {
    return []; // Only header or empty
  }
  
  // Extract header and data rows
  const header = lines[0].split(',');
  const dataRows = lines.slice(1);
  
  // Map rows to model objects
  return dataRows.map(row => {
    const values = row.split(',');
    const model: any = {};
    
    // Map each value to its corresponding header
    header.forEach((key, index) => {
      if (index < values.length) {
        const value = values[index].trim();
        // Convert numeric values
        model[key] = key !== 'model_id' ? parseFloat(value) : value;
      }
    });
    
    // Add a readable name
    model.name = extractModelName(model.model_id);
    
    return model;
  });
};

// Determine if a metric is a percentage metric
const isPercentageMetric = (metricName: string): boolean => {
  return ['auc', 'aucpr', 'accuracy', 'f1', 'precision', 'recall'].some(m => 
    metricName.toLowerCase().includes(m)
  );
};

// Check if lower value is better for metric
const isLowerBetter = (metricName: string): boolean => {
  return ['logloss', 'error', 'loss', 'mse', 'rmse', 'mae'].some(m => 
    metricName.toLowerCase().includes(m)
  );
};

const H2OLeaderboardTable: React.FC<H2OLeaderboardTableProps> = ({
  data,
  defaultSortMetric = 'auc',
  onModelSelect,
  selectedModelId
}) => {
  // Parse data if it's a CSV string
  const initialModels = useMemo(() => {
    if (typeof data === 'string') {
      return parseLeaderboardCsv(data);
    }
    return data;
  }, [data]);
  
  // State for sorting
  const [sortBy, setSortBy] = useState<string>(defaultSortMetric);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    isLowerBetter(defaultSortMetric) ? 'asc' : 'desc'
  );
  
  // Handle sort click
  const handleSort = (metric: string) => {
    if (sortBy === metric) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(metric);
      setSortDirection(isLowerBetter(metric) ? 'asc' : 'desc');
    }
  };
  
  // Sort and rank models
  const models = useMemo(() => {
    if (!initialModels || initialModels.length === 0) return [];
    
    // Sort models by the selected metric
    const sorted = [...initialModels].sort((a, b) => {
      const aValue = a[sortBy as keyof Model];
      const bValue = b[sortBy as keyof Model];
      
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;
      
      // Default to numeric comparison
      const comparison = (aValue as number) - (bValue as number);
      
      // Adjust based on sort direction
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    // Add rank to each model
    return sorted.map((model, index) => ({
      ...model,
      rank: index + 1
    }));
  }, [initialModels, sortBy, sortDirection]);
  
  // Extract metrics from the first model to determine table columns
  const metrics = useMemo(() => {
    if (!models || models.length === 0) return [];
    
    return Object.keys(models[0]).filter(key => 
      !['model_id', 'name', 'rank', 'training_time_sec'].includes(key) && 
      typeof models[0][key as keyof Model] === 'number'
    );
  }, [models]);
  
  if (!models || models.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No leaderboard data available</p>
      </div>
    );
  }
  
  return (
    <ResponsiveTable>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[60px]">Rank</TableHead>
          <TableHead className="min-w-[180px]">Model</TableHead>
          
          {/* Dynamic columns for metrics */}
          {metrics.map(metric => (
            <TableHead 
              key={metric}
              className="min-w-[120px] cursor-pointer"
              onClick={() => handleSort(metric)}
            >
              <div className="flex items-center">
                <span>
                  {metric.charAt(0).toUpperCase() + metric.slice(1)}
                </span>
                <ArrowUpDown className="ml-2 h-4 w-4" />
                {sortBy === metric && (
                  <span className="ml-1 text-primary">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </div>
            </TableHead>
          ))}
          
          <TableHead className="min-w-[120px]">Training Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {models.map((model, index) => (
          <TableRow 
            key={model.model_id}
            className={`
              ${selectedModelId === model.model_id ? 'bg-primary/10' : ''}
              ${index === 0 ? 'font-medium' : ''}
              ${onModelSelect ? 'cursor-pointer' : ''}
            `}
            onClick={() => onModelSelect && onModelSelect(model.model_id)}
          >
            <TableCell>
              {model.rank === 1 ? (
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  {model.rank}
                </Badge>
              ) : (
                model.rank
              )}
            </TableCell>
            <TableCell className="font-medium">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      {model.name}
                      {model.rank === 1 && (
                        <Badge className="ml-1 bg-primary/20 text-primary">
                          Best
                        </Badge>
                      )}
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-mono text-xs">{model.model_id}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableCell>
            
            {/* Dynamic cells for metrics */}
            {metrics.map(metric => (
              <TableCell key={`${model.model_id}-${metric}`}>
                <span className={
                  model.rank === 1 
                    ? 'font-medium text-primary' 
                    : ''
                }>
                  {formatMetricValue(
                    model[metric as keyof Model] as number | undefined,
                    isPercentageMetric(metric)
                  )}
                </span>
              </TableCell>
            ))}
            
            <TableCell>
              {model.training_time_sec 
                ? formatTrainingTime(model.training_time_sec)
                : 'N/A'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </ResponsiveTable>
  );
};

export default H2OLeaderboardTable;
