
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ClassificationReportProps {
  report: Record<string, any> | string;
}

const LOG_PREFIX = '[ClassificationReportTable]';

const isValidStatsObject = (stats: any, label: string) => {
  // Only treat objects as valid if they have at least one of: precision, recall, f1-score
  return stats && typeof stats === 'object' && (
    'precision' in stats || 'recall' in stats || 'f1-score' in stats
  );
};

const ClassificationReportTable: React.FC<ClassificationReportProps> = ({ report }) => {
  console.log(`${LOG_PREFIX} Received report:`, report);
  console.log(`${LOG_PREFIX} Report type:`, typeof report);

  // Handle string report (pre-formatted)
  if (typeof report === 'string') {
    console.log(`${LOG_PREFIX} Detected string report, rendering <pre>`);
    return (
      <pre className="whitespace-pre-wrap bg-muted p-4 rounded-md text-xs font-mono overflow-x-auto">
        {report}
      </pre>
    );
  }

  if (!report || typeof report !== 'object') {
    console.log(`${LOG_PREFIX} Invalid report format:`, report);
    return <p className="text-muted-foreground">No classification report available</p>;
  }

  const reportKeys = Object.keys(report);
  console.log(`${LOG_PREFIX} Report keys:`, reportKeys);

  // Separate class stats and special global metrics like 'accuracy'
  const classRows = reportKeys.filter(key => isValidStatsObject(report[key], key));
  const globalRows = reportKeys.filter(key => !isValidStatsObject(report[key], key));

  console.log(`${LOG_PREFIX} Rows to render as class stats:`, classRows);
  console.log(`${LOG_PREFIX} Rows to skip or handle as special rows:`, globalRows);

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
        {classRows.map(label => {
          const statsObj = report[label];
          if (!statsObj || typeof statsObj !== 'object') {
            console.log(`${LOG_PREFIX} Skipping label (not object): ${label}`, statsObj);
            return null;
          }
          // Validate stats
          if (
            !('precision' in statsObj || 'recall' in statsObj || 'f1-score' in statsObj)
          ) {
            console.log(`${LOG_PREFIX} Skipping label (missing metrics): ${label}`, statsObj);
            return null;
          }
          // Log individual row data
          console.log(`${LOG_PREFIX} Rendering row for class: ${label}`, statsObj);

          return (
            <TableRow key={label}>
              <TableCell className="capitalize">{label.replace('_',' ')}</TableCell>
              <TableCell>
                {typeof statsObj.precision === 'number'
                  ? `${(statsObj.precision * 100).toFixed(1)}%`
                  : statsObj.precision ?? '-'}
              </TableCell>
              <TableCell>
                {typeof statsObj.recall === 'number'
                  ? `${(statsObj.recall * 100).toFixed(1)}%`
                  : statsObj.recall ?? '-'}
              </TableCell>
              <TableCell>
                {typeof statsObj['f1-score'] === 'number'
                  ? `${(statsObj['f1-score'] * 100).toFixed(1)}%`
                  : statsObj['f1-score'] ?? '-'}
              </TableCell>
              <TableCell>{statsObj.support ?? '-'}</TableCell>
            </TableRow>
          );
        })}
        {/* Render global accuracy row if possible */}
        {typeof report.accuracy === 'number' && (
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

