
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Accept report can be object OR string
interface ClassificationReportProps {
  report: Record<string, any> | string;
}

const LOG_PREFIX = '[ClassificationReportTable]';

/** Checks if a stats object has at least two classification metrics (no just e.g. support or accuracy). */
const isValidStatsObject = (obj: any) => {
  if (!obj || typeof obj !== "object") return false;
  const metricKeys = ["precision", "recall", "f1-score"];
  const found = metricKeys.filter(k => typeof obj[k] === "number").length;
  return found >= 2;
};

const renderMetricCellFormatted = (value: any, isPercent = false) => {
  if (typeof value === 'number') {
    return isPercent ? `${(value * 100).toFixed(1)}%` : value;
  }
  if (typeof value === 'string') return value;
  if (value === undefined || value === null) return '-';
  return '[invalid]';
};

/** NEVER renders a raw object in JSX: only <pre> for string/unknown, table for proper reports. */
const ClassificationReportTable: React.FC<ClassificationReportProps> = ({ report }) => {
  console.log(`${LOG_PREFIX} Received report:`, report);
  console.log(`${LOG_PREFIX} Report type:`, typeof report);

  // (A) If already formatted as string, show in <pre>
  if (typeof report === 'string') {
    return (
      <pre className="whitespace-pre-wrap bg-muted p-4 rounded-md text-xs font-mono overflow-x-auto">
        {report}
      </pre>
    );
  }

  // (B) Defensive: Must be object, not null, not empty, and not an array
  if (!report || typeof report !== 'object' || Array.isArray(report) || Object.keys(report).length === 0) {
    return <p className="text-muted-foreground">No classification report available.</p>;
  }

  // Only use object keys with at least 2 real metric keys
  const allKeys = Object.keys(report);
  if (allKeys.length === 0) {
    return <p className="text-muted-foreground">No classification metrics available.</p>;
  }

  // top-level keys like "accuracy" should be handled separately
  const classStatKeys = allKeys.filter(k => isValidStatsObject(report[k]));
  const nonStatKeys = allKeys.filter(k => !isValidStatsObject(report[k]));

  console.log(`${LOG_PREFIX} Report keys:`, allKeys);
  console.log(`${LOG_PREFIX} Rows to render as class stats:`, classStatKeys);
  console.log(`${LOG_PREFIX} Rows to skip or handle as special rows:`, nonStatKeys);

  if (classStatKeys.length === 0) {
    // All entries are either accuracy or non-stat; fallback: show pretty JSON
    return (
      <pre className="whitespace-pre-wrap bg-muted p-4 rounded-md text-xs font-mono overflow-x-auto">
        {JSON.stringify(report, null, 2)}
      </pre>
    );
  }

  // Table rendering
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
        {classStatKeys.map(label => {
          const statsObj = report[label];
          if (!isValidStatsObject(statsObj)) return null;
          // Defensive: check all values
          return (
            <TableRow key={label}>
              <TableCell className="capitalize">{label.replace(/_/g, ' ')}</TableCell>
              <TableCell>{renderMetricCellFormatted(statsObj.precision, true)}</TableCell>
              <TableCell>{renderMetricCellFormatted(statsObj.recall, true)}</TableCell>
              <TableCell>{renderMetricCellFormatted(statsObj['f1-score'], true)}</TableCell>
              <TableCell>{statsObj.support !== undefined ? statsObj.support : '-'}</TableCell>
            </TableRow>
          );
        })}
        {/* Special overall accuracy row */}
        {typeof report.accuracy === "number" && (
          <TableRow className="bg-muted/50 font-medium">
            <TableCell colSpan={3}><strong>Overall Accuracy</strong></TableCell>
            <TableCell colSpan={2}>{(report.accuracy * 100).toFixed(1)}%</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default ClassificationReportTable;
