import React, { useMemo } from 'react';

interface FeatureTypes {
  hasNumerical: boolean;
  hasCategorical: boolean;
  isMixed: boolean;
  numericalCount: number;
  categoricalCount: number;
}

interface DatasetFeatureExtractorProps {
  previewData: any;
  columnsToKeep: string[] | null;
  children: (featureTypes: FeatureTypes, hasNumericalToNormalize: boolean) => React.ReactNode;
}

const DatasetFeatureExtractor: React.FC<DatasetFeatureExtractorProps> = ({
  previewData,
  columnsToKeep,
  children
}) => {
  // Feature type detection for appropriate balancing methods
  const featureTypes = useMemo(() => {
    if (!previewData) {
      return {
        hasNumerical: false,
        hasCategorical: false,
        isMixed: false,
        numericalCount: 0,
        categoricalCount: 0
      };
    }
    
    // Direct usage of numerical_columns and categorical_columns from API
    const numericalFeatures = previewData.numerical_columns || [];
    const categoricalFeatures = previewData.categorical_columns || [];
    
    const hasNumerical = numericalFeatures.length > 0;
    const hasCategorical = categoricalFeatures.length > 0;
    const isMixed = hasNumerical && hasCategorical;
    
    return {
      hasNumerical,
      hasCategorical,
      isMixed,
      numericalCount: numericalFeatures.length,
      categoricalCount: categoricalFeatures.length
    };
  }, [previewData]);

  // Determine if normalization should be enabled based on preview data
  const hasNumericalToNormalize = useMemo(() => {
    if (!previewData || !columnsToKeep) {
      return false;
    }

    // Check if any of the columns to keep are in the numerical_columns from preview
    const hasNumerical = columnsToKeep.some(col => 
      (previewData.numerical_columns || []).includes(col)
    );
    
    return hasNumerical && (previewData.numerical_features > 0);
  }, [previewData, columnsToKeep]);

  return <>{children(featureTypes, hasNumericalToNormalize)}</>;
};

export default DatasetFeatureExtractor;
