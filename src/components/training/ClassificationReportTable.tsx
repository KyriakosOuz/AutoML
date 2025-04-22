
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Accept report can be object OR string
interface ClassificationReportProps {
  report: Record<string, any> | string;
}

const LOG_PREFIX = '[ClassificationReportTable]';

const isValidStatsObject = (obj: any) => {
  // Only treat objects as valid if they have at least TWO of: precision, recall, f1-score
  // (not just support or arbitrary keys)
  if (!obj || typeof obj !== "object") return false;
  const keys = Object.keys(obj);
  const metricKeys = ["precision", "recall", "f1-score"];
  const found = metricKeys.filter(k => typeof obj[k] === "number").length;
  return found >= 2;
};

const renderMetricCell = (value: any) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return value;
  if (value === undefined || value === null) return '-';
  try { return JSON.stringify(value); } catch { return '[object]'; }
};

const renderMetricCellFormatted = (value: any, isPercent: boolean = false) => {
  if (typeof value === 'number') {
    return isPercent ? `${(value * 100).toFixed(1)}%` : value;
  }
  if (typeof value === 'string') return value;
  if (value === undefined || value === null) return '-';
  return '[invalid]';
};

const ClassificationReportTable: React.FC<ClassificationReportProps> = ({ report }) => {
  console.log(`${LOG_PREFIX} Received report:`, report);

  // If a pre-formatted string, just render it in a <pre>
  if (typeof report === 'string') {
    return (
      <pre className="whitespace-pre-wrap bg-muted p-4 rounded-md text-xs font-mono overflow-x-auto">
        {report}
      </pre>
    );
  }

  // Defensive: Must be object, not null, and must not be empty
  if (!report || typeof report !== 'object' || Object.keys(report).length === 0) {
    return <p className="text-muted-foreground">No classification report available.</p>;
  }

  // Use only object keys with at least two metric keys (avoid "accuracy" or nonsense)
  const validClassKeys = Object.keys(report).filter(
    key => isValidStatsObject(report[key])
  );

  if (validClassKeys.length === 0) {
    // No rows to show, so this is probably a regression or unsupported report
    return <p className="text-muted-foreground">
      No per-class metrics found — this is not a classification report or the provided report is in an unexpected format.
    </p>;
  }

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
        {validClassKeys.map(label => {
          const statsObj = report[label];
          if (!isValidStatsObject(statsObj)) return null;
          return (
            <TableRow key={label}>
              <TableCell className="capitalize">{label.replace('_', ' ')}</TableCell>
              <TableCell>{renderMetricCellFormatted(statsObj.precision, true)}</TableCell>
              <TableCell>{renderMetricCellFormatted(statsObj.recall, true)}</TableCell>
              <TableCell>{renderMetricCellFormatted(statsObj['f1-score'], true)}</TableCell>
              <TableCell>{renderMetricCell(statsObj.support)}</TableCell>
            </TableRow>
          );
        })}
        {/* Show overall accuracy in a special row, but only if number */}
        {'accuracy' in report && typeof report.accuracy === 'number' && (
          <TableRow>
            <TableCell colSpan={3}><strong>Overall Accuracy</strong></TableCell>
            <TableCell colSpan={2}>{(report.accuracy * 100).toFixed(1)}%</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default ClassificationReportTable;
