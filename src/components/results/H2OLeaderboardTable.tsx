
import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface H2OLeaderboardTableProps {
  data: any[] | string; // Accept either array or CSV string
  defaultSortMetric?: string;
  selectedModelId?: string | null;
  onBestModelFound?: (modelName: string) => void; // New callback prop
  maxRows?: number; // New prop to control how many rows to display by default
  engineType?: 'h2o' | 'mljar'; // New prop to specify engine type
  className?: string; // Allow passing className for styling
}

const H2OLeaderboardTable: React.FC<H2OLeaderboardTableProps> = ({
  data,
  defaultSortMetric = 'auc',
  selectedModelId,
  onBestModelFound, // New prop
  maxRows = 10, // Default to showing 10 rows
  engineType = 'h2o', // Default to H2O
  className
}) => {
  const [sortField, setSortField] = useState<string>(defaultSortMetric);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAll, setShowAll] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Parse CSV data if provided as string
  useEffect(() => {
    const parseData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Handle string data (CSV content or URL)
        if (typeof data === 'string') {
          console.log(`Parsing CSV data for ${engineType} leaderboard`);
          
          let csvContent: string;
          
          // Check if it's a URL or direct CSV content
          if (data.startsWith('http')) {
            console.log('Fetching CSV from URL:', data);
            const response = await fetch(data);
            if (!response.ok) throw new Error('Failed to fetch CSV');
            csvContent = await response.text();
          } else {
            csvContent = data;
          }
          
          // Enhanced CSV parsing for MLJAR and H2O formats
          const lines = csvContent.trim().split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          
          const rows = lines.slice(1).map(line => {
            // Handle quoted values correctly (they might contain commas)
            const values: string[] = [];
            let inQuotes = false;
            let currentValue = '';
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                values.push(currentValue.replace(/"/g, '').trim());
                currentValue = '';
              } else {
                currentValue += char;
              }
            }
            
            // Don't forget to add the last value
            values.push(currentValue.replace(/"/g, '').trim());
            
            // Create object from headers and values
            return headers.reduce((obj, header, i) => {
              // Convert numeric strings to numbers
              const value = values[i] || '';
              const numValue = parseFloat(value);
              obj[header] = !isNaN(numValue) && value !== '' ? numValue : value;
              return obj;
            }, {} as Record<string, any>);
          });
          
          setParsedData(rows);
          setColumns(headers);
        }
        // Handle array data
        else if (Array.isArray(data) && data.length > 0) {
          console.log(`Using array data for ${engineType} leaderboard, length:`, data.length);
          setParsedData(data);
          
          // Extract columns from the first item
          if (data.length > 0) {
            const firstItem = data[0];
            setColumns(Object.keys(firstItem));
          }
        }
        else {
          console.log('No valid leaderboard data provided');
          setParsedData([]);
          setColumns([]);
        }
      } catch (error) {
        console.error(`Error parsing ${engineType} leaderboard data:`, error);
        setError(error instanceof Error ? error.message : 'Unknown error parsing data');
        setParsedData([]);
        setColumns([]);
      } finally {
        setLoading(false);
      }
    };
    
    parseData();
  }, [data, engineType]);

  // Sort the data based on current sort field and direction
  const sortedData = useMemo(() => {
    if (parsedData.length === 0) return [];
    
    // Determine if this metric is one where lower is better
    const lowerIsBetter = ['logloss', 'rmse', 'mse', 'mae', 'error', 'loss'].some(
      metric => sortField.toLowerCase().includes(metric.toLowerCase())
    );
    
    return [...parsedData].sort((a, b) => {
      // Ensure we're working with numeric values for comparison
      const aValue = typeof a[sortField] === 'number' ? a[sortField] : parseFloat(a[sortField]) || 0;
      const bValue = typeof b[sortField] === 'number' ? b[sortField] : parseFloat(b[sortField]) || 0;
      
      // Fixed: Always sort ALL rows consistently
      if (lowerIsBetter) {
        // Lower values are better, so ascending sort means smallest first
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        // Higher values are better, so ascending sort means largest first
        return sortDirection === 'asc' ? bValue - aValue : aValue - bValue;
      }
    });
  }, [parsedData, sortField, sortDirection]);

  // Notify parent component about the best model when data is sorted
  useEffect(() => {
    if (sortedData.length > 0 && onBestModelFound) {
      // Get the model_id from the first (best) model in the sorted data
      const bestModel = sortedData[0];
      const modelId = bestModel.model_id || bestModel.name || bestModel.model_name || '';
      
      if (modelId) {
        // Format the model name (e.g., "DRF_1")
        const parts = modelId.split('_');
        const formattedModelName = parts.length >= 2 
          ? `${parts[0]}_${parts[1]}`
          : modelId;
        
        console.log(`Found best ${engineType} model:`, formattedModelName);
        onBestModelFound(formattedModelName);
      }
    }
  }, [sortedData, onBestModelFound, engineType]);

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and determine default sort direction based on metric type
      setSortField(field);
      
      // For metrics where lower is better, default to ascending
      const lowerIsBetter = ['logloss', 'rmse', 'mse', 'mae', 'error', 'loss'].some(
        metric => field.toLowerCase().includes(metric.toLowerCase())
      );
      
      setSortDirection(lowerIsBetter ? 'asc' : 'desc');
    }
  };

  // Format a metric value for display
  const formatValue = (value: string | number, column: string) => {
    if (value === undefined || value === null) return 'N/A';
    
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    
    if (isNaN(numValue)) return value;
    
    // Format as percentage for certain metrics
    const percentageMetrics = ['auc', 'accuracy', 'precision', 'recall', 'f1', 'r2'];
    const isPercentage = percentageMetrics.some(metric => 
      column.toLowerCase().includes(metric.toLowerCase())
    );
    
    if (isPercentage && numValue >= 0 && numValue <= 1) {
      return `${(numValue * 100).toFixed(2)}%`;
    }
    
    // Format as time for training_time
    if (column.includes('time') || column.includes('duration')) {
      if (numValue >= 60) {
        const minutes = Math.floor(numValue / 60);
        const seconds = Math.round(numValue % 60);
        return `${minutes}m ${seconds}s`;
      }
      return `${numValue.toFixed(1)}s`;
    }
    
    // Default number formatting
    return numValue.toFixed(4);
  };

  // Improved display columns logic to handle both H2O and MLJAR formats
  const displayColumns = useMemo(() => {
    if (columns.length === 0) return [];
    
    // Important model identifier columns that should be shown first
    const identifierColumns = ['model_id', 'name', 'model_name', 'algorithm', 'model_type', 'model', 'type'];
    
    // Important metric columns (more comprehensive list)
    const metricColumns = [
      'auc', 'logloss', 'rmse', 'mse', 'mae', 'rmsle', 'r2',
      'accuracy', 'f1', 'precision', 'recall', 'mean_per_class_error',
      'training_time_sec', 'training_time', 'train_time', 'fit_time',
      'score', 'aucpr', 'f1_score', 'r2_score', 'cv_score', 'metric_value'
    ];
    
    // First, include identifier columns in the order they appear
    const orderedColumns: string[] = [];
    
    // Add identifier columns first if they exist
    identifierColumns.forEach(idCol => {
      if (columns.includes(idCol)) {
        orderedColumns.push(idCol);
      }
    });
    
    // Then add metric columns if they exist
    metricColumns.forEach(metricCol => {
      if (columns.includes(metricCol)) {
        orderedColumns.push(metricCol);
      }
    });
    
    // Finally, add any remaining columns that might be metrics
    columns.forEach(col => {
      if (!orderedColumns.includes(col) && (
        col.includes('score') || 
        col.includes('metric') || 
        col.includes('error') || 
        col.includes('loss') || 
        col.includes('accuracy') || 
        col.includes('auc') || 
        col.includes('time') ||
        col.includes('val_')
      )) {
        orderedColumns.push(col);
      }
    });
    
    // If we have less than 3 columns, include all columns
    if (orderedColumns.length < 3) {
      return columns;
    }
    
    return orderedColumns;
  }, [columns]);

  // Handle download of the leaderboard CSV
  const handleDownloadLeaderboard = async () => {
    try {
      // If we have a URL, fetch the CSV file
      if (typeof data === 'string' && data.startsWith('http')) {
        const response = await fetch(data);
        if (!response.ok) throw new Error('Failed to fetch leaderboard data');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${engineType}_leaderboard.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } 
      // If we have CSV string data
      else if (typeof data === 'string' && !data.startsWith('http')) {
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${engineType}_leaderboard.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      // If we have array data, convert to CSV
      else if (Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0]).join(',');
        const csvRows = data.map(row => Object.values(row).join(','));
        const csvContent = [headers, ...csvRows].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${engineType}_leaderboard.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('No valid data to download');
      }
      
      toast({
        title: 'Download started',
        description: 'The leaderboard CSV is downloading.',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download failed',
        description: 'Failed to download leaderboard data.',
        variant: 'destructive'
      });
    }
  };

  // Get displayed data based on showAll setting
  const displayedData = useMemo(() => {
    return showAll ? sortedData : sortedData.slice(0, maxRows);
  }, [sortedData, showAll, maxRows]);

  // Add component rendering with Card layout for consistent styling with MLJAR components
  if (error) {
    return (
      <Card className={`mt-4 border-destructive/50 ${className || ''}`}>
        <CardHeader>
          <CardTitle className="text-destructive">Leaderboard Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={`mt-4 ${className || ''}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center justify-between">
            <span>Models Leaderboard</span>
            <Skeleton className="h-9 w-36" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (parsedData.length === 0) {
    return (
      <Card className={`mt-4 ${className || ''}`}>
        <CardHeader>
          <CardTitle>Models Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">No models data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`mt-4 ${className || ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Model Leaderboard</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownloadLeaderboard}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" /> Download CSV
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <ResponsiveTable minWidth="800px">
          <Table>
            <TableHeader>
              <TableRow>
                {displayColumns.map((column) => (
                  <TableHead key={column} className="whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 font-medium"
                      onClick={() => handleSort(column)}
                    >
                      {column
                        .replace(/_/g, ' ')
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')}
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                      {sortField === column && (
                        <span className="ml-1 text-xs">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </Button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedData.map((row, index) => (
                <TableRow 
                  key={row.model_id || row.name || row.model_name || row.model || `model-${index}`} 
                  className={
                    (row.model_id === selectedModelId || 
                     row.name === selectedModelId || 
                     row.model_name === selectedModelId) 
                      ? "bg-primary/10" 
                      : ""
                  }
                >
                  {displayColumns.map((column) => (
                    <TableCell key={column}>
                      {column === 'model_id' || column === 'name' || column === 'model_name' || 
                       column === 'model' || column === 'algorithm' || column === 'model_type' ? (
                        <div className="font-medium flex items-center gap-2">
                          {row[column]}
                          {index === 0 && (
                            <Badge className="bg-primary/20 text-primary border-primary/30" variant="outline">
                              Best
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <div className={
                          column === sortField ? "font-medium" : ""
                        }>
                          {formatValue(row[column], column)}
                        </div>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ResponsiveTable>
        
        {sortedData.length > maxRows && (
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-1"
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4" /> Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" /> Show All ({sortedData.length} models)
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default H2OLeaderboardTable;
