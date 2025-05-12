
import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Badge } from '@/components/ui/badge';

interface H2OLeaderboardTableProps {
  data: any[] | string; // Accept either array or CSV string
  defaultSortMetric?: string;
  selectedModelId?: string | null;
}

const H2OLeaderboardTable: React.FC<H2OLeaderboardTableProps> = ({
  data,
  defaultSortMetric = 'auc',
  selectedModelId
}) => {
  const [sortField, setSortField] = useState<string>(defaultSortMetric);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Parse CSV data if provided as string
  useEffect(() => {
    const parseData = async () => {
      setLoading(true);
      try {
        // Handle string data (CSV content or URL)
        if (typeof data === 'string') {
          console.log('Parsing CSV data for leaderboard');
          
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
          
          // Simple CSV parsing (handles basic CSV format)
          const lines = csvContent.trim().split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          
          const rows = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            return headers.reduce((obj, header, i) => {
              obj[header] = values[i];
              return obj;
            }, {} as Record<string, string>);
          });
          
          setParsedData(rows);
          setColumns(headers);
        }
        // Handle array data
        else if (Array.isArray(data) && data.length > 0) {
          console.log('Using array data for leaderboard, length:', data.length);
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
        console.error('Error parsing leaderboard data:', error);
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

  // Select important columns to display
  const displayColumns = useMemo(() => {
    const priorityColumns = [
      'model_id', 'name', 'algorithm', 'auc', 'logloss', 
      'rmse', 'mse', 'mae', 'rmsle', 'r2',
      'accuracy', 'f1', 'precision', 'recall',
      'training_time_sec', 'mean_per_class_error'
    ];
    
    // Filter columns based on priority and availability
    return columns.filter(col => 
      priorityColumns.includes(col) || 
      col.includes('auc') || 
      col.includes('loss') || 
      col.includes('error') ||
      col.includes('accuracy') ||
      col.includes('score')
    );
  }, [columns]);

  if (loading) {
    return <div className="text-center p-4">Loading leaderboard data...</div>;
  }

  if (parsedData.length === 0) {
    return <div className="text-center p-4">No leaderboard data available</div>;
  }

  return (
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
        {sortedData.map((row, index) => (
          <TableRow key={row.model_id || `model-${index}`} className={
            row.model_id === selectedModelId ? "bg-primary/10" : ""
          }>
            {displayColumns.map((column) => (
              <TableCell key={column}>
                {column === 'model_id' || column === 'name' || column === 'algorithm' ? (
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
  );
};

export default H2OLeaderboardTable;
