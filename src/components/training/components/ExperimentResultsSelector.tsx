
import React from 'react';
import { ExperimentResultsType, ExperimentStatus, ExperimentResults as ExperimentResultsType } from '@/types/training';
import MLJARExperimentResults from '@/components/results/MLJARExperimentResults';
import StandardExperimentResults from '@/components/results/ExperimentResults';
import H2OExperimentResults from '@/components/results/H2OExperimentResults';
import CustomTrainingResults from '../CustomTrainingResults';

interface ExperimentResultsSelectorProps {
  experimentId: string;
  data: ExperimentResultsType;
  resultType: {
    isMljarExperiment: boolean;
    isH2OExperiment: boolean;
    isAutoMLExperiment: boolean;
    isCustomTrainingExperiment: boolean;
  };
  onReset: () => void;
  onRefresh: () => void;
}

const ExperimentResultsSelector: React.FC<ExperimentResultsSelectorProps> = ({
  experimentId,
  data,
  resultType,
  onReset,
  onRefresh
}) => {
  // Additional logging to help diagnose render issues - include model display name
  console.log("[ExperimentResultsSelector] Rendering results component:", {
    isMljarExperiment: resultType.isMljarExperiment,
    isH2OExperiment: resultType.isH2OExperiment,
    isAutoMLExperiment: resultType.isAutoMLExperiment,
    isCustomTrainingExperiment: resultType.isCustomTrainingExperiment,
    training_type: data.training_type,
    automl_engine: data.automl_engine,
    model_name: data.model_display_name,
    filesCount: data.files?.length,
    metricsKeys: data.metrics ? Object.keys(data.metrics) : [],
    perClassMetrics: data.metrics?.per_class ? Object.keys(data.metrics.per_class) : []
  });

  // Render the appropriate component based on experiment type
  if (resultType.isMljarExperiment) {
    return (
      <div className="w-full">
        <MLJARExperimentResults
          experimentId={experimentId}
          status={data.status as ExperimentStatus}
          experimentResults={data}
          isLoading={false}
          error={null}
          onReset={onReset}
          onRefresh={onRefresh}
        />
      </div>
    );
  } else if (resultType.isH2OExperiment) {
    return (
      <div className="w-full">
        <H2OExperimentResults
          experimentId={experimentId}
          status={data.status as ExperimentStatus}
          experimentResults={data}
          isLoading={false}
          error={null}
          onReset={onReset}
          onRefresh={onRefresh}
        />
      </div>
    );
  } else if (resultType.isAutoMLExperiment) {
    return (
      <div className="w-full">
        <StandardExperimentResults
          experimentId={experimentId}
          status={data.status as ExperimentStatus}
          experimentResults={data}
          isLoading={false}
          error={null}
          onReset={onReset}
          onRefresh={onRefresh}
          trainingType={data.training_type as 'automl' | 'custom'}
        />
      </div>
    );
  } else {
    // Default to CustomTrainingResults for custom training experiments
    return (
      <div className="w-full">
        <CustomTrainingResults 
          experimentResults={data} 
          onReset={onReset}
        />
      </div>
    );
  }
};

export default ExperimentResultsSelector;
