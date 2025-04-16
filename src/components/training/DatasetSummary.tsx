
import React from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Database, ListTree, Target, FileBarChart, Table } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const DatasetSummary: React.FC = () => {
  const { 
    datasetId, 
    overview, 
    targetColumn, 
    taskType,
    previewColumns,
    columnsToKeep,
    numClasses
  } = useDataset();
  
  if (!datasetId || !overview) {
    return null;
  }
  
  const numSelectedFeatures = columnsToKeep?.length || 0;
  const totalFeatures = previewColumns?.length || 0;
  
  const getTaskTypeBadge = () => {
    if (!taskType) return null;
    
    let color = 'bg-gray-100 text-gray-800';
    let icon = null;
    
    if (taskType === 'binary_classification') {
      color = 'bg-blue-100 text-blue-800';
      icon = <Target className="h-3 w-3" />;
    } else if (taskType === 'multiclass_classification') {
      color = 'bg-purple-100 text-purple-800';
      icon = <ListTree className="h-3 w-3" />;
    } else if (taskType === 'regression') {
      color = 'bg-green-100 text-green-800';
      icon = <FileBarChart className="h-3 w-3" />;
    }
    
    return (
      <Badge variant="outline" className={`${color} flex items-center gap-1`}>
        {icon}
        {taskType.replace('_', ' ')}
      </Badge>
    );
  };
  
  return (
    <Card className="w-full mb-6 rounded-2xl shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" /> 
          Selected Dataset
        </CardTitle>
        <CardDescription>
          Overview of the dataset used for model training
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Rows</p>
            <p className="text-lg font-medium">{overview.num_rows}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Features</p>
            <p className="text-lg font-medium">
              {numSelectedFeatures} 
              {totalFeatures > 0 && ` / ${totalFeatures - 1}`}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Target</p>
            <p className="text-lg font-medium truncate" title={targetColumn || ''}>
              {targetColumn || 'Not selected'}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Task Type</p>
            <div>{getTaskTypeBadge()}</div>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Numerical Features</p>
            <div className="flex flex-wrap gap-1">
              {overview.numerical_features?.length ? (
                overview.numerical_features.map(feat => (
                  <Badge key={feat} variant="outline" className="bg-blue-50">
                    {feat}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">None</span>
              )}
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Categorical Features</p>
            <div className="flex flex-wrap gap-1">
              {overview.categorical_features?.length ? (
                overview.categorical_features
                  .filter(feat => feat !== targetColumn)
                  .slice(0, 5)
                  .map(feat => (
                    <Badge key={feat} variant="outline" className="bg-amber-50">
                      {feat}
                    </Badge>
                  ))
              ) : (
                <span className="text-sm text-muted-foreground">None</span>
              )}
              {overview.categorical_features?.length > 6 && (
                <Badge variant="outline">+{overview.categorical_features.length - 5} more</Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatasetSummary;
