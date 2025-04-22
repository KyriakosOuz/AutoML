
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ConfusionMatrixChartProps {
  matrix?: number[][];
  labels?: string[];
}

const ConfusionMatrixChart: React.FC<ConfusionMatrixChartProps> = ({ matrix, labels = ['Negative', 'Positive'] }) => {
  if (!matrix || matrix.length === 0) {
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

  // For binary classification, we expect a 2x2 matrix
  // [[TN, FP], [FN, TP]]
  const isBinary = matrix.length === 2 && matrix[0].length === 2;
  
  // Calculate the total predictions for color intensity scaling
  const total = matrix.flat().reduce((sum, val) => sum + val, 0);
  
  // Function to determine color intensity based on value
  const getColorIntensity = (value: number) => {
    const normalizedValue = value / total;
    return {
      backgroundColor: `rgba(79, 70, 229, ${Math.min(0.1 + normalizedValue * 5, 0.9)})`,
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confusion Matrix</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div className="grid grid-cols-[auto,repeat(auto-fill,minmax(80px,1fr))] gap-1 my-4">
            {/* Top-left empty cell */}
            <div className="w-20 h-20 flex items-center justify-center font-bold border p-2">
              <div className="text-xs text-muted-foreground">Actual ↓ / Predicted →</div>
            </div>
            
            {/* Column headers */}
            {labels.map((label, i) => (
              <div key={`col-${i}`} className="w-20 h-20 flex items-center justify-center font-bold border p-2">
                {label}
              </div>
            ))}
            
            {/* Rows */}
            {matrix.map((row, i) => (
              <React.Fragment key={`row-${i}`}>
                {/* Row header */}
                <div className="w-20 h-20 flex items-center justify-center font-bold border p-2">
                  {labels[i]}
                </div>
                
                {/* Matrix cells */}
                {row.map((value, j) => (
                  <div 
                    key={`cell-${i}-${j}`} 
                    className="w-20 h-20 flex flex-col items-center justify-center border transition-colors hover:bg-muted/50"
                    style={getColorIntensity(value)}
                  >
                    <div className="text-lg font-bold">{value}</div>
                    <div className="text-xs text-muted-foreground">
                      {isBinary && (
                        <>
                          {i === 0 && j === 0 && "TN"}
                          {i === 0 && j === 1 && "FP"}
                          {i === 1 && j === 0 && "FN"}
                          {i === 1 && j === 1 && "TP"}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
          
          {isBinary && (
            <div className="grid grid-cols-2 gap-4 text-sm mt-2 text-muted-foreground">
              <div>TN: True Negative</div>
              <div>FP: False Positive</div>
              <div>FN: False Negative</div>
              <div>TP: True Positive</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfusionMatrixChart;
