
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ConfusionMatrixChartProps {
  matrix: number[][] | null;
  labels?: string[];
}

const ConfusionMatrixChart: React.FC<ConfusionMatrixChartProps> = ({ matrix, labels = [] }) => {
  // Check if matrix is valid
  if (!matrix || !Array.isArray(matrix) || matrix.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Confusion Matrix</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No confusion matrix data available</p>
        </CardContent>
      </Card>
    );
  }

  // For binary classification, use default labels if none provided
  if (labels.length === 0 && matrix.length === 2) {
    labels = ['Negative', 'Positive'];
  }

  // Fill in missing labels with indices
  const matrixLabels = labels.length >= matrix.length
    ? labels.slice(0, matrix.length)
    : Array.from({ length: matrix.length }, (_, i) => labels[i] || `Class ${i}`);

  // Calculate maximum value for color intensity
  const maxValue = Math.max(...matrix.flatMap(row => row));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confusion Matrix</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div className="overflow-x-auto">
          <table className="min-w-max border-collapse">
            <thead>
              <tr>
                <th className="p-2 border border-border bg-muted/50"></th>
                <th className="p-2 border border-border bg-muted/50 text-center" colSpan={matrixLabels.length}>
                  Predicted
                </th>
              </tr>
              <tr>
                <th className="p-2 border border-border bg-muted/50"></th>
                {matrixLabels.map((label, i) => (
                  <th key={i} className="p-2 border border-border bg-muted/50">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, i) => (
                <tr key={i}>
                  <th className="p-2 border border-border bg-muted/50">
                    {i === 0 && (
                      <div className="absolute -ml-14 mt-12 transform -rotate-90">
                        <span className="whitespace-nowrap font-normal">Actual</span>
                      </div>
                    )}
                    {matrixLabels[i]}
                  </th>
                  {row.map((cell, j) => {
                    // Calculate intensity based on value
                    const intensity = maxValue > 0 ? cell / maxValue : 0;
                    return (
                      <td 
                        key={j} 
                        className={cn(
                          "p-2 border border-border text-center font-bold",
                          i === j ? "bg-primary/10" : ""
                        )}
                        style={{ 
                          backgroundColor: i === j 
                            ? `rgba(var(--primary), ${0.1 + intensity * 0.2})` 
                            : `rgba(217, 119, 6, ${intensity * 0.2})`
                        }}
                      >
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfusionMatrixChart;
