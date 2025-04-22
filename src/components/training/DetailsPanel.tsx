
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DetailsPanelProps {
  experimentId: string;
  algorithm?: string;
  taskType?: string;
  targetColumn?: string;
  columnsToKeep?: string[];
  hyperparameters?: Record<string, any>;
}

const formatTaskType = (type?: string) => {
  if (!type) return "Unknown";
  switch (type) {
    case 'binary_classification':
      return 'Binary Classification';
    case 'multiclass_classification':
      return 'Multiclass Classification';
    case 'regression':
      return 'Regression';
    default:
      return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
};

const DetailsPanel: React.FC<DetailsPanelProps> = ({
  experimentId,
  algorithm,
  taskType,
  targetColumn,
  columnsToKeep = [],
  hyperparameters = {},
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Model Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Algorithm:</span>
              <span className="font-medium">{algorithm || 'AutoML'}</span>

              <span className="text-muted-foreground">Task Type:</span>
              <span className="font-medium">{formatTaskType(taskType)}</span>
              
              <span className="text-muted-foreground">Target Column:</span>
              <span className="font-medium">{targetColumn}</span>
              
              <span className="text-muted-foreground">Experiment ID:</span>
              <span className="font-mono text-xs">{experimentId}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Feature Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {columnsToKeep.map((column, index) => (
                <Badge key={index} variant="secondary" className="bg-primary/5">
                  {column}
                </Badge>
              ))}
              {columnsToKeep.length === 0 && (
                <p className="text-sm text-muted-foreground">No specific columns selected</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {Object.keys(hyperparameters).length > 0 && (
        <Card className="shadow-sm md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Hyperparameters</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parameter</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(hyperparameters).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium">{key}</TableCell>
                    <TableCell>
                      {typeof value === 'object' 
                        ? JSON.stringify(value) 
                        : String(value)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DetailsPanel;
