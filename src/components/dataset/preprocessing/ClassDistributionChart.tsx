
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ClassDistributionChartProps {
  classData: Record<string, number>;
  targetColumn: string;
}

// Consistent colors that match the application's theme
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const ClassDistributionChart: React.FC<ClassDistributionChartProps> = ({ classData, targetColumn }) => {
  // Early return if no data is provided
  if (!classData || Object.keys(classData).length === 0) {
    return null;
  }

  const data = Object.entries(classData).map(([name, value]) => ({
    name,
    value: Math.round(value * 100), // Convert to percentage
  }));

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Class Distribution for '{targetColumn}'</CardTitle>
        <CardDescription>Distribution of classes in your target column</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value}%`, 'Percentage']} 
                labelFormatter={(label) => `Class ${label}`}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassDistributionChart;
