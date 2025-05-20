
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RocPoint { 
  fpr: number; 
  tpr: number; 
}

interface RocCurveChartProps {
  fpr?: number[];
  tpr?: number[];
  auc?: number;
}

const RocCurveChart: React.FC<RocCurveChartProps> = ({ fpr, tpr, auc }) => {
  if (!fpr || !tpr || fpr.length === 0 || tpr.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ROC Curve</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No ROC curve data available</p>
        </CardContent>
      </Card>
    );
  }

  const data: RocPoint[] = fpr.map((x, i) => ({ fpr: x, tpr: tpr[i] }));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>ROC Curve {auc !== undefined && <span className="text-sm font-normal ml-2">(AUC: {auc.toFixed(4)})</span>}</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="fpr" 
              label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -15 }}
              domain={[0, 1]}
              tickFormatter={(value) => value.toFixed(1)}
            />
            <YAxis 
              label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', offset: -5 }}
              domain={[0, 1]}
              tickFormatter={(value) => value.toFixed(1)}
            />
            <Tooltip 
              formatter={(value: number) => [value.toFixed(4), '']}
              labelFormatter={(label) => `FPR: ${Number(label).toFixed(4)}`}
            />
            <Legend verticalAlign="top" height={36} />
            <ReferenceLine x={0} y={0} stroke="#666" />
            <ReferenceLine x={1} y={1} stroke="#666" strokeDasharray="3 3" />
            <Line 
              type="monotone" 
              dataKey="tpr" 
              name="ROC Curve" 
              stroke="#8884d8" 
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

export default RocCurveChart;
