
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PrPoint {
  recall: number;
  precision: number;
}

interface PrecisionRecallChartProps {
  precision?: number[];
  recall?: number[];
  f1Score?: number;
}

const PrecisionRecallChart: React.FC<PrecisionRecallChartProps> = ({ precision, recall, f1Score }) => {
  // Log data to help debug
  console.log("[PrecisionRecallChart] Rendering with data:", { precision, recall, f1Score });
  
  if (!precision || !recall || precision.length === 0 || recall.length === 0) {
    console.log("[PrecisionRecallChart] Missing or empty data");
    return (
      <Card>
        <CardHeader>
          <CardTitle>Precision-Recall Curve</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No precision-recall data available</p>
        </CardContent>
      </Card>
    );
  }

  const data: PrPoint[] = precision.map((p, i) => ({ recall: recall[i], precision: p }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Precision-Recall Curve {f1Score !== undefined && <span className="text-sm font-normal ml-2">(F1: {f1Score.toFixed(4)})</span>}</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="recall" 
              label={{ value: 'Recall', position: 'insideBottom', offset: -15 }}
              domain={[0, 1]}
              tickFormatter={(value) => value.toFixed(1)}
            />
            <YAxis 
              label={{ value: 'Precision', angle: -90, position: 'insideLeft', offset: -5 }}
              domain={[0, 1]}
              tickFormatter={(value) => value.toFixed(1)}
            />
            <Tooltip 
              formatter={(value: number) => [value.toFixed(4), '']}
              labelFormatter={(label) => `Recall: ${Number(label).toFixed(4)}`}
            />
            <Legend verticalAlign="top" height={36} />
            <Line 
              type="monotone" 
              dataKey="precision" 
              name="PR Curve" 
              stroke="#82ca9d" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PrecisionRecallChart;
