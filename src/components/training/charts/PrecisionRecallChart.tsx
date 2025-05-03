
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { InfoCircle } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
  if (!precision || !recall || precision.length === 0 || recall.length === 0) {
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
        <div className="flex items-center justify-between">
          <CardTitle>Precision-Recall Curve 
            {f1Score !== undefined && <span className="text-sm font-normal ml-2">(F1: {f1Score.toFixed(4)})</span>}
          </CardTitle>
          
          <UITooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <InfoCircle className="h-4 w-4 text-gray-400" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>What is F1 Score? It's the harmonic mean of precision and recall, providing a balance between them.</p>
            </TooltipContent>
          </UITooltip>
        </div>
        
        <CardDescription>
          This chart shows the tradeoff between precision (correct positive predictions) and recall (found positive samples).
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="recall" 
              label={{ value: 'Recall (% of actual positives found)', position: 'insideBottom', offset: -15 }}
              domain={[0, 1]}
              tickFormatter={(value) => value.toFixed(1)}
            />
            <YAxis 
              label={{ value: 'Precision (% of predictions correct)', angle: -90, position: 'insideLeft', offset: -5 }}
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
