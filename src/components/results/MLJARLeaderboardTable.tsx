
import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';

interface MLJARLeaderboardTableProps {
  data: any[] | string; // Accept either array or CSV string
  defaultSortMetric?: string;
  selectedModelId?: string | null;
  onBestModelFound?: (modelName: string) => void; // Callback prop for best model
  maxRows?: number; // Control how many rows to display by default
}

const MLJARLeaderboardTable: React.FC<MLJARLeaderboardTableProps> = ({
  data,
  defaultSortMetric = 'logloss',
  selectedModelId,
  onBestModelFound,
  maxRows = 10
}) => {
  const [sortField, setSortField] = useState<string>(defaultSortMetric);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAll, setShowAll] = useState<boolean>(false);

  // Parse CSV data if provided as string
  useEffect(() => {
    const parseData = async () => {
      setLoading(true);
      try {
        // Handle string data (CSV content or URL)
        if (typeof data === 'string') {
          console.log('Parsing CSV data for MLJAR leaderboard');
          
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
          
          // Enhanced CSV parsing for MLJAR format
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
          console.log('Using array data for MLJAR leaderboard, length:', data.length);
          setParsedData(data);
          
          // Extract columns from the first item
          if (data.length > 0) {
            const firstItem = data[0];
            setColumns(Object.keys(firstItem));
          }
        }
        else {
          console.log('No valid MLJAR leaderboard data provided');
          setParsedData([]);
          setColumns([]);
        }
      } catch (error) {
        console.error('Error parsing MLJAR leaderboard data:', error);
        setParsedData([]);
        setColumns([]);
      } finally {
        setLoading(false);
      }
    };
    
    parseData();
  }, [data]);

  // Sort the data based on current sort field and direction
  const sortedData = useMemo(() => {
    if (parsedData.length === 0) return [];
    
    return [...parsedData].sort((a, b) => {
      const aValue = parseFloat(a[sortField]) || 0;
      const bValue = parseFloat(b[sortField]) || 0;
      
      return sortDirection === 'asc' 
        ? aValue - bValue 
        : bValue - aValue;
    });
  }, [parsedData, sortField, sortDirection]);

  // Notify parent component about the best model when data is sorted
  useEffect(() => {
    if (sortedData.length > 0 && onBestModelFound) {
      // Get the model_id from the first (best) model in the sorted data
      const bestModel = sortedData[0];
      const modelId = bestModel.model_id || bestModel.name || bestModel.model_name || bestModel.model || '';
      
      if (modelId) {
        // Format the model name (e.g., "RandomForest_1")
        const parts = modelId.split('_');
        const formattedModelName = parts.length >= 2 
          ? `${parts[0]}_${parts[1]}`
          : modelId;
        
        console.log('Found best MLJAR model:', formattedModelName);
        onBestModelFound(formattedModelName);
      }
    }
  }, [sortedData, onBestModelFound]);

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Format a metric value for display
  const formatValue = (value: string | number, column: string) => {
    if (value === undefined || value === null) return 'N/A';
    
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    
    if (isNaN(numValue)) return value;
    
    // Format as percentage for certain metrics
    const percentageMetrics = ['auc', 'accuracy', 'precision', 'recall', 'f1'];
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

  // Improved display columns logic specifically for MLJAR format
  const displayColumns = useMemo(() => {
    if (columns.length === 0) return [];
    
    // Important model identifier columns that should be shown first - tailored for MLJAR
    const identifierColumns = ['model_id', 'name', 'model_name', 'model', 'algorithm', 'model_type', 'type'];
    
    // Important metric columns - optimized for MLJAR metrics
    const metricColumns = [
      'logloss', 'auc', 'rmse', 'mse', 'mae', 'rmsle', 'r2',
      'accuracy', 'f1', 'precision', 'recall', 'mean_per_class_error',
      'training_time_sec', 'training_time', 'train_time', 'fit_time',
      'score', 'aucpr', 'f1_score', 'r2_score', 'cv_score', 'metric_value',
      'test_score', 'val_score', 'fold_0', 'fold_1', 'fold_2', 'fold_3', 'fold_4'
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
        col.includes('val_') ||
        col.includes('fold_') ||
        col.includes('cv_')
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
        a.download = 'mljar_leaderboard.csv';
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
        a.download = 'mljar_leaderboard.csv';
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
        a.download = 'mljar_leaderboard.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('No valid data to download');
      }
      
      toast({
        title: 'Download started',
        description: 'The MLJAR leaderboard CSV is downloading.',
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

  if (loading) {
    return <div className="text-center p-4">Loading MLJAR leaderboard data...</div>;
  }

  if (parsedData.length === 0) {
    return <div className="text-center p-4">No MLJAR leaderboard data available</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">MLJAR Models Leaderboard</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleDownloadLeaderboard}
          className="flex items-center gap-1"
        >
          <Download className="h-4 w-4" /> Download Full Leaderboard
        </Button>
      </div>
      
      <ResponsiveTable minWidth="800px">
        <TableHeader>
          <TableRow>
            {displayColumns.map((column) => (
              <TableHead key={column} className="whitespace-nowrap">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs font-medium"
                  onClick={() => handleSort(column)}
                >
                  {column
                    .replace(/_/g, ' ')
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedData.map((row, index) => (
            <TableRow key={row.model_id || row.name || row.model_name || row.model || `model-${index}`} className={
              (row.model_id === selectedModelId || row.name === selectedModelId || row.model_name === selectedModelId) 
                ? "bg-primary/10" 
                : ""
            }>
              {displayColumns.map((column) => (
                <TableCell key={column}>
                  {column === 'model_id' || column === 'name' || column === 'model_name' || column === 'model' || column === 'algorithm' || column === 'model_type' || column === 'type' ? (
                    <div className="font-medium">
                      {row[column]}
                      {index === 0 && (
                        <Badge className="ml-2 text-foreground bg-secondary" variant="outline">
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
      </ResponsiveTable>
      
      {sortedData.length > maxRows && (
        <div className="flex justify-center mt-2">
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
    </div>
  );
};

export default MLJARLeaderboardTable;
