
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
  
  // Check for both sklearn and custom format keys
  const metricKeys = ["precision", "recall", "f1-score", "f1_score"];
  // Count how many valid metric keys we find
  const found = metricKeys.filter(k => typeof obj[k] === "number").length;
  return found >= 1; // At least one metric should be present
};

// Normalize keys with spaces or underscores
const normalizeKey = (key: string) => {
  return key.replace(/_/g, '-').trim();
};

// Safely get a metric value regardless of key format (f1-score or f1_score)
const getMetricValue = (obj: any, metric: string) => {
  // Try different format variations
  const variations = [
    metric,
    metric.replace(/-/g, '_'),
    metric.replace(/_/g, '-')
  ];
  
  for (const key of variations) {
    if (obj[key] !== undefined) {
      return obj[key];
    }
  }
  
  return undefined;
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

  // Only use object keys with at least 1 real metric key
  const allKeys = Object.keys(report);
  if (allKeys.length === 0) {
    return <p className="text-muted-foreground">No classification metrics available.</p>;
  }

  console.log(`${LOG_PREFIX} Report keys:`, allKeys);
  
  // Classify keys into class stats vs. overall stats
  // Class stats are individual classes and aggregates like macro/weighted avg
  // Non-stat keys are top-level metrics like accuracy
  const specialAggregateKeywords = ['avg', 'average', 'total', 'macro', 'weighted', 'samples'];
  
  const isAggregateKey = (key: string) => {
    const normalized = key.toLowerCase();
    return specialAggregateKeywords.some(keyword => normalized.includes(keyword));
  };
  
  const isClassKey = (key: string) => {
    return (
      isValidStatsObject(report[key]) && 
      !['accuracy', 'support'].includes(key.toLowerCase()) &&
      !key.includes('_')  // Avoid metrics with underscores being treated as classes
    );
  };
  
  // Separate normal classes from aggregate metrics
  const classKeys = allKeys.filter(k => isClassKey(k) && !isAggregateKey(k));
  const aggregateKeys = allKeys.filter(k => isValidStatsObject(report[k]) && isAggregateKey(k));
  const nonStatKeys = allKeys.filter(k => !isValidStatsObject(report[k]) || k === 'accuracy');

  console.log(`${LOG_PREFIX} Rows to render as class stats:`, [...classKeys, ...aggregateKeys]);
  console.log(`${LOG_PREFIX} Rows to skip or handle as special rows:`, nonStatKeys);

  if ([...classKeys, ...aggregateKeys].length === 0) {
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
        {/* First render the class rows */}
        {classKeys.map(label => {
          const statsObj = report[label];
          if (!isValidStatsObject(statsObj)) return null;
          
          return (
            <TableRow key={label}>
              <TableCell className="capitalize">{label.replace(/_/g, ' ')}</TableCell>
              <TableCell>{renderMetricCellFormatted(getMetricValue(statsObj, 'precision'), true)}</TableCell>
              <TableCell>{renderMetricCellFormatted(getMetricValue(statsObj, 'recall'), true)}</TableCell>
              <TableCell>{renderMetricCellFormatted(getMetricValue(statsObj, 'f1-score'), true)}</TableCell>
              <TableCell>{statsObj.support !== undefined ? statsObj.support : '-'}</TableCell>
            </TableRow>
          );
        })}
        
        {/* Then render aggregate rows (macro avg, weighted avg, etc.) */}
        {aggregateKeys.map(label => {
          const statsObj = report[label];
          if (!isValidStatsObject(statsObj)) return null;
          
          return (
            <TableRow key={label} className="bg-muted/30">
              <TableCell className="font-medium">{label.replace(/_/g, ' ')}</TableCell>
              <TableCell>{renderMetricCellFormatted(getMetricValue(statsObj, 'precision'), true)}</TableCell>
              <TableCell>{renderMetricCellFormatted(getMetricValue(statsObj, 'recall'), true)}</TableCell>
              <TableCell>{renderMetricCellFormatted(getMetricValue(statsObj, 'f1-score'), true)}</TableCell>
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
