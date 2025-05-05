
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader } from 'lucide-react';

interface CsvRendererProps {
  fileUrl: string;
  title?: string;
  maxRows?: number;
}

const CsvRenderer: React.FC<CsvRendererProps> = ({ fileUrl, title, maxRows = 50 }) => {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalRows, setTotalRows] = useState(0);

  useEffect(() => {
    const fetchCsv = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(fileUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.status}`);
        }
        
        const text = await response.text();
        const lines = text.split('\n');
        
        if (lines.length === 0) {
          throw new Error("CSV file is empty");
        }
        
        // Parse headers
        const headerLine = lines[0];
        const headerFields = parseCSVLine(headerLine);
        setHeaders(headerFields);
        
        // Parse data rows (limit to maxRows)
        const dataRows = lines.slice(1, maxRows + 1)
          .filter(line => line.trim() !== '')
          .map(parseCSVLine);
          
        setRows(dataRows);
        setTotalRows(lines.length - 1);
      } catch (err) {
        console.error("Error fetching CSV:", err);
        setError(err instanceof Error ? err.message : "Failed to load CSV");
      } finally {
        setIsLoading(false);
      }
    };

    if (fileUrl) {
      fetchCsv();
    }
  }, [fileUrl, maxRows]);

  // Parse a CSV line, handling quoted values
  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let currentField = "";
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(currentField);
        currentField = "";
      } else {
        currentField += char;
      }
    }
    
    result.push(currentField);
    return result;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title || "CSV Data"}</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title || "CSV Data"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">
            Failed to load CSV: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (headers.length === 0 || rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title || "CSV Data"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">
            No data found in CSV
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || "CSV Data"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header, index) => (
                  <TableHead key={index}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <TableCell key={cellIndex}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {totalRows > maxRows && (
          <div className="text-sm text-muted-foreground mt-2 text-center">
            Showing {rows.length} of {totalRows} rows
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CsvRenderer;
