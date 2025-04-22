
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ClassificationReportProps {
  report: Record<string, any> | string;
}

const ClassificationReportTable: React.FC<ClassificationReportProps> = ({ report }) => {
  console.log('[ClassificationReportTable] Received report:', report);
  console.log('[ClassificationReportTable] Report type:', typeof report);
  
  // Handle string report (pre-formatted)
  if (typeof report === 'string') {
    return (
      <pre className="whitespace-pre-wrap bg-muted p-4 rounded-md text-xs font-mono overflow-x-auto">
        {report}
      </pre>
    );
  }
  
  // Handle empty or null report
  if (!report || typeof report !== 'object') {
    console.log('[ClassificationReportTable] Invalid report format:', report);
    return <p className="text-muted-foreground">No classification report available</p>;
  }
  
  console.log('[ClassificationReportTable] Report keys:', Object.keys(report));
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Class</TableHead>
          <TableHead>Precision</TableHead>
          <TableHead>Recall</TableHead>
          <TableHead>F1-Score</TableHead>
          <TableHead>Support</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Object.entries(report).map(([label, stats]) => {
          // Skip non-object entries like accuracy
          if (typeof stats !== 'object' || stats === null) {
            console.log(`[ClassificationReportTable] Skipping non-object entry: ${label}`);
            return null;
          }
          
          // Safely cast stats to avoid TypeScript errors
          const statsObj = stats as Record<string, any>;
          
          // Check if this is a class stats object with the required properties
          if (!('precision' in statsObj || 'recall' in statsObj || 'f1-score' in statsObj)) {
            console.log(`[ClassificationReportTable] Skipping entry missing required properties: ${label}`);
            return null;
          }
          
          // Log individual row data
          console.log(`[ClassificationReportTable] Rendering row for class: ${label}`, statsObj);
          
          return (
            <TableRow key={label}>
              <TableCell className="capitalize">{label.replace('_',' ')}</TableCell>
              <TableCell>
                {typeof statsObj.precision === 'number' 
                  ? `${(statsObj.precision * 100).toFixed(1)}%` 
                  : statsObj.precision || '-'}
              </TableCell>
              <TableCell>
                {typeof statsObj.recall === 'number' 
                  ? `${(statsObj.recall * 100).toFixed(1)}%` 
                  : statsObj.recall || '-'}
              </TableCell>
              <TableCell>
                {typeof statsObj['f1-score'] === 'number' 
                  ? `${(statsObj['f1-score'] * 100).toFixed(1)}%` 
                  : statsObj['f1-score'] || '-'}
              </TableCell>
              <TableCell>{statsObj.support}</TableCell>
            </TableRow>
          );
        })}
        {typeof report.accuracy === "number" && (
          <TableRow>
            <TableCell colSpan={3}><strong>Overall Accuracy</strong></TableCell>
            <TableCell colSpan={2}>
              {(report.accuracy * 100).toFixed(1)}%
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default ClassificationReportTable;
