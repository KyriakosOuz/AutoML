
import React, { useEffect, useState } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Database, ListTree, Target, FileBarChart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { datasetApi } from '@/lib/api';

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
  
  const [numericalFeatures, setNumericalFeatures] = useState<string[]>([]);
  const [categoricalFeatures, setCategoricalFeatures] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Fetch the processed data to get accurate feature information
  useEffect(() => {
    const fetchProcessedData = async () => {
      if (!datasetId) return;
      
      try {
        setIsLoading(true);
        const response = await datasetApi.previewDataset(datasetId, 'processed');
        
        // Extract data from response
        const responseData = response.data || response;
        
        // Handle numerical features
        const numFeatures = responseData.numerical_features;
        if (Array.isArray(numFeatures)) {
          setNumericalFeatures(numFeatures);
        } else if (typeof numFeatures === 'number') {
          // If it's a number (count), we'll show that later
          setNumericalFeatures([]);
        }
        
        // Handle categorical features
        const catFeatures = responseData.categorical_features;
        if (Array.isArray(catFeatures)) {
          setCategoricalFeatures(catFeatures);
        } else if (typeof catFeatures === 'number') {
          // If it's a number (count), we'll show that later
          setCategoricalFeatures([]);
        }
      } catch (error) {
        console.error("Error fetching processed data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProcessedData();
  }, [datasetId]);
  
  if (!datasetId || !overview) {
    return null;
  }
  
  const numSelectedFeatures = columnsToKeep?.length || 0;
  const totalFeatures = previewColumns?.length || 0;
  
  // Use fetched features if available, otherwise fall back to context values
  const useNumericalFeatures = numericalFeatures.length > 0 
    ? numericalFeatures 
    : (overview.numerical_features || []);
    
  const useCategoricalFeatures = categoricalFeatures.length > 0
    ? categoricalFeatures
    : (overview.categorical_features || []);
  
  // Make sure we're correctly filtering numerical and categorical features to display only those that are selected
  const filteredNumericalFeatures = useNumericalFeatures.filter(
    feat => columnsToKeep?.includes(feat) || feat === targetColumn
  );
  
  const filteredCategoricalFeatures = useCategoricalFeatures.filter(
    feat => columnsToKeep?.includes(feat) || feat === targetColumn
  );
  
  // Filter out the target column from features display (if it exists in the filtered arrays)
  const displayNumericalFeatures = targetColumn ? 
    filteredNumericalFeatures.filter(f => f !== targetColumn) : 
    filteredNumericalFeatures;
    
  const displayCategoricalFeatures = targetColumn ? 
    filteredCategoricalFeatures.filter(f => f !== targetColumn) : 
    filteredCategoricalFeatures;
  
  // If the numerical/categorical values are numbers rather than arrays, display them accordingly
  const numericalFeaturesCount = typeof overview.numerical_features === 'number' 
    ? overview.numerical_features 
    : displayNumericalFeatures.length;
    
  const categoricalFeaturesCount = typeof overview.categorical_features === 'number'
    ? overview.categorical_features
    : displayCategoricalFeatures.length;
  
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
        {taskType === 'binary_classification' ? 'Binary Classification' :
         taskType === 'multiclass_classification' ? 'Multiclass Classification' :
         taskType === 'regression' ? 'Regression' : 
         taskType.replace('_', ' ')}
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
            <p className="text-xs text-muted-foreground">
              Numerical Features {typeof numericalFeaturesCount === 'number' && `(${numericalFeaturesCount})`}
            </p>
            <div className="flex flex-wrap gap-1">
              {Array.isArray(displayNumericalFeatures) && displayNumericalFeatures.length > 0 ? (
                displayNumericalFeatures.map(feat => (
                  <Badge key={feat} variant="outline" className="bg-blue-50">
                    {feat}
                  </Badge>
                ))
              ) : numericalFeaturesCount > 0 ? (
                <span className="text-sm">{numericalFeaturesCount} numerical feature(s)</span>
              ) : (
                <span className="text-sm text-muted-foreground">None</span>
              )}
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Categorical Features {typeof categoricalFeaturesCount === 'number' && `(${categoricalFeaturesCount})`}
            </p>
            <div className="flex flex-wrap gap-1">
              {Array.isArray(displayCategoricalFeatures) && displayCategoricalFeatures.length > 0 ? (
                displayCategoricalFeatures
                  .slice(0, 5)
                  .map(feat => (
                    <Badge key={feat} variant="outline" className="bg-amber-50">
                      {feat}
                    </Badge>
                  ))
              ) : categoricalFeaturesCount > 0 ? (
                <span className="text-sm">{categoricalFeaturesCount} categorical feature(s)</span>
              ) : (
                <span className="text-sm text-muted-foreground">None</span>
              )}
              {Array.isArray(displayCategoricalFeatures) && displayCategoricalFeatures.length > 5 && (
                <Badge variant="outline">+{displayCategoricalFeatures.length - 5} more</Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatasetSummary;
