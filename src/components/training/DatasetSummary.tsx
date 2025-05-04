import React, { useEffect, useState } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Database, ListTree, Target, FileBarChart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { datasetApi } from '@/lib/api';
import { useLocation } from 'react-router-dom';

const DatasetSummary: React.FC = () => {
  const { 
    datasetId, 
    overview, 
    targetColumn, 
    taskType,
    previewColumns,
    columnsToKeep,
    numClasses,
    fileUrls
  } = useDataset();
  
  const [numericalFeatures, setNumericalFeatures] = useState<string[]>([]);
  const [categoricalFeatures, setCategoricalFeatures] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const location = useLocation();
  
  // Check if we're on the training route
  const isTrainingRoute = location.pathname.includes('/training');
  
  // Debug current overview and numerical features
  useEffect(() => {
    console.log('DatasetSummary - Current overview:', overview);
    console.log('DatasetSummary - Current numerical features:', 
      Array.isArray(overview?.numerical_features) ? overview?.numerical_features : 'not an array');
  }, [overview]);
  
  // Fetch the processed data to get accurate feature information
  useEffect(() => {
    if (!datasetId) return;
    
    const fetchDatasetFeatures = async () => {
      try {
        setIsLoading(true);
        
        let responseData;
        
        // For training route, use preview-dataset with processed stage
        if (isTrainingRoute) {
          const response = await datasetApi.previewDataset(datasetId, 'processed');
          responseData = response.data || response;
          console.log("Training route - preview dataset response:", responseData);
        } else {
          // For other routes, use preview-dataset endpoint with latest
          const response = await datasetApi.previewDataset(datasetId, 'latest');
          responseData = response.data || response;
          console.log("Preview dataset response:", responseData);
        }
        
        // Handle numerical features - first check for array data
        if (Array.isArray(responseData?.numerical_features)) {
          setNumericalFeatures(responseData.numerical_features);
          console.log("Setting numerical features from response:", responseData.numerical_features);
        } else if (Array.isArray(responseData?.numerical_columns)) {
          // Alternative field name from API
          setNumericalFeatures(responseData.numerical_columns);
          console.log("Setting numerical features from numerical_columns:", responseData.numerical_columns);
        } else if (overview && Array.isArray(overview.numerical_features)) {
          // Fallback to overview if already set
          setNumericalFeatures(overview.numerical_features);
          console.log("Using numerical features from overview:", overview.numerical_features);
        }
        
        // Handle categorical features
        if (Array.isArray(responseData?.categorical_features)) {
          setCategoricalFeatures(responseData.categorical_features);
        } else if (Array.isArray(responseData?.categorical_columns)) {
          setCategoricalFeatures(responseData.categorical_columns);
        } else if (overview && Array.isArray(overview.categorical_features)) {
          setCategoricalFeatures(overview.categorical_features);
        }
      } catch (error) {
        console.error("Error fetching dataset features:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDatasetFeatures();
  }, [datasetId, isTrainingRoute, overview]);
  
  if (!datasetId || !overview) {
    return null;
  }
  
  const numSelectedFeatures = columnsToKeep?.length || 0;
  const totalFeatures = previewColumns?.length || 0;
  
  // Use fetched features if available, otherwise fall back to context values
  const useNumericalFeatures = numericalFeatures.length > 0 
    ? numericalFeatures 
    : (Array.isArray(overview.numerical_features) ? overview.numerical_features : []);
    
  const useCategoricalFeatures = categoricalFeatures.length > 0
    ? categoricalFeatures
    : (Array.isArray(overview.categorical_features) ? overview.categorical_features : []);
  
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
  
  // Always use the actual length of the numerical/categorical features arrays if available
  const numericalFeaturesCount = displayNumericalFeatures.length;
  const categoricalFeaturesCount = displayCategoricalFeatures.length;
  
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
              Numerical Features ({numericalFeaturesCount})
            </p>
            <div className="flex flex-wrap gap-1">
              {displayNumericalFeatures.length > 0 ? (
                displayNumericalFeatures.map(feat => (
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
            <p className="text-xs text-muted-foreground">
              Categorical Features ({categoricalFeaturesCount})
            </p>
            <div className="flex flex-wrap gap-1">
              {displayCategoricalFeatures.length > 0 ? (
                displayCategoricalFeatures
                  .slice(0, 5)
                  .map(feat => (
                    <Badge key={feat} variant="outline" className="bg-amber-50">
                      {feat}
                    </Badge>
                  ))
              ) : (
                <span className="text-sm text-muted-foreground">None</span>
              )}
              {displayCategoricalFeatures.length > 5 && (
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
