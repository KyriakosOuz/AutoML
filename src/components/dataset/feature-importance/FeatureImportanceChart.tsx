
import React from 'react';
import { FeatureImportance } from '@/contexts/DatasetContext';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  LabelList,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

// Custom tooltip component for the chart
const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-md shadow-md">
        <p className="font-medium text-sm">{payload[0].payload.feature}</p>
        <p className="text-purple-600 font-mono">
          {(payload[0].value * 100).toFixed(2)}% importance
        </p>
      </div>
    );
  }
  return null;
};

interface FeatureImportanceChartProps {
  featureImportance: FeatureImportance[];
}

const FeatureImportanceChart: React.FC<FeatureImportanceChartProps> = ({ featureImportance }) => {
  // Set colors for feature bars based on importance
  const getBarColor = (importance: number, index: number) => {
    const baseColors = [
      '#8B5CF6', // Purple
      '#6366F1', // Indigo
      '#3B82F6', // Blue
      '#0EA5E9', // Light blue
      '#14B8A6', // Teal
    ];
    
    // Use the index to get different colors for different features
    const baseColor = baseColors[index % baseColors.length];
    
    // Adjust opacity based on importance
    const opacity = 0.3 + (importance * 0.7);
    
    // Convert hex to rgba
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Calculate the chart height based on the number of features
  // Each feature row needs about 40px of height, plus margins
  const chartHeight = Math.max(500, featureImportance.length * 40 + 100);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Feature Importance Analysis</CardTitle>
        <CardDescription>
          Higher importance scores indicate features with greater predictive power
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className={`h-[${chartHeight}px] w-full bg-white rounded-lg p-4 border border-gray-200`} 
             style={{ height: `${chartHeight}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={featureImportance}
              layout="vertical"
              margin={{ top: 20, right: 50, left: 140, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis 
                type="number" 
                domain={[0, 1]} 
                tickFormatter={(value) => `${Math.round(value * 100)}%`} 
              />
              <YAxis 
                type="category" 
                dataKey="feature" 
                width={130}
                tick={{ fontSize: 13 }}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="importance" 
                name="Importance Score"
                radius={[0, 4, 4, 0]}
                barSize={28}
              >
                {featureImportance.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBarColor(entry.importance, index)} 
                  />
                ))}
                <LabelList 
                  dataKey="importance" 
                  position="right" 
                  formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                  style={{ fill: '#6B7280', fontSize: 13, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureImportanceChart;
