
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { DownloadCloud, ArrowDown, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CSVPreviewProps {
  fileUrl: string;
  downloadUrl?: string;
  maxRows?: number;
  engineName?: string;
  initialSortColumn?: string;
  initialSortDirection?: 'asc' | 'desc';
}

const CSVPreview: React.FC<CSVPreviewProps> = ({ 
  fileUrl, 
  downloadUrl,
  maxRows,
  engineName,
  initialSortColumn,
  initialSortDirection = 'asc'
}) => {
  const [data, setData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalRowCount, setTotalRowCount] = useState<number>(0);
  const [sortedData, setSortedData] = useState<string[][]>([]);
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDirection);

  // Re-fetch data when maxRows changes to support collapsible functionality
  useEffect(() => {
    const fetchCSV = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(fileUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
        }
        
        const text = await response.text();
        const rows = text.split('\n');
        setTotalRowCount(Math.max(0, rows.length - 1)); // Total rows minus header
        
        // Extract headers from the first row
        if (rows.length > 0) {
          // Handle quoted CSV values
          const headerRow = rows[0];
          const extractedHeaders = parseCSVRow(headerRow);
          setHeaders(extractedHeaders);
          
          // Parse data rows (skip header row)
          // Only limit to maxRows if it's defined, otherwise show all rows
          const rowsToProcess = maxRows ? rows.slice(1, maxRows + 1) : rows.slice(1);
          const parsedData = rowsToProcess.map(row => parseCSVRow(row)).filter(row => 
            // Filter out empty rows (last row might be empty)
            row.some(cell => cell.trim() !== '')
          );
          
          setData(parsedData);

          // If initialSortColumn is provided, find its index
          if (initialSortColumn) {
            const columnIndex = extractedHeaders.findIndex(
              header => header.toLowerCase() === initialSortColumn.toLowerCase()
            );
            
            if (columnIndex !== -1) {
              setSortColumn(columnIndex);
              sortDataByColumn(parsedData, columnIndex, sortDirection);
            } else {
              setSortedData(parsedData);
            }
          } else {
            setSortedData(parsedData);
          }
        }
        
      } catch (err) {
        console.error("Error fetching CSV:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch CSV data");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (fileUrl) {
      fetchCSV();
    }
  }, [fileUrl, maxRows, initialSortColumn, initialSortDirection]); // Ensure refetch when maxRows changes

  // Helper function to handle CSV parsing with quotes
  const parseCSVRow = (row: string): string[] => {
    const result = [];
    let insideQuote = false;
    let currentValue = '';
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        result.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // Add the last value
    result.push(currentValue);
    
    return result;
  };

  // Helper function to sort data by column
  const sortDataByColumn = (dataToSort: string[][], column: number, direction: 'asc' | 'desc') => {
    // Clone the data to avoid modifying the original
    const newData = [...dataToSort];
    
    newData.sort((a, b) => {
      const valueA = a[column] || '';
      const valueB = b[column] || '';

      // Try to convert to numbers for numeric sorting
      const numA = parseFloat(valueA);
      const numB = parseFloat(valueB);

      if (!isNaN(numA) && !isNaN(numB)) {
        return direction === 'asc' ? numA - numB : numB - numA;
      }
      
      // Default to string comparison
      if (valueA < valueB) return direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setSortedData(newData);
  };

  // Handle clicking on a column header to sort
  const handleSort = (columnIndex: number) => {
    const newDirection = sortColumn === columnIndex && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newDirection);
    setSortColumn(columnIndex);
    sortDataByColumn(data, columnIndex, newDirection);
  };
  
  // Function to trigger file download instead of opening in a new tab
  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      
      // Create filename with engine name if available, or use default
      const fileName = engineName 
        ? `${engineName}_Predictions.csv`
        : `dataset_${new Date().toISOString().slice(0, 10)}.csv`;
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
    } catch (err) {
      console.error("Error downloading CSV:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 w-full">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive p-4 border border-destructive/30 rounded-md">
        <p>Error loading CSV: {error}</p>
        {downloadUrl && (
          <div className="mt-4">
            <Button 
              onClick={() => handleDownload(downloadUrl)} 
              size="sm"
            >
              <DownloadCloud className="h-4 w-4 mr-2" />
              Download Full CSV
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header, index) => (
                <TableHead 
                  key={index} 
                  className={`bg-muted/50 font-medium cursor-pointer hover:bg-muted/70 ${sortColumn === index ? 'bg-muted/70' : ''}`}
                  onClick={() => handleSort(index)}
                >
                  <div className="flex items-center justify-between">
                    {header}
                    {sortColumn === index && (
                      sortDirection === 'asc' ? 
                        <ArrowUp className="w-4 h-4 ml-1" /> : 
                        <ArrowDown className="w-4 h-4 ml-1" />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <TableCell key={cellIndex} className="font-mono text-xs">
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {maxRows && sortedData.length < totalRowCount 
          ? `Showing ${sortedData.length} of ${totalRowCount} rows.` 
          : `Showing all ${sortedData.length} rows.`}
      </p>
    </div>
  );
};

export default CSVPreview;
