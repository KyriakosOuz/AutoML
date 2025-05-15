import React, { useCallback } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { useTraining } from '@/contexts/training/TrainingContext';
import AutoMLTraining from '@/components/training/AutoMLTraining';
import CustomTraining from '@/components/training/CustomTraining';
import ExperimentResultsView from '@/components/training/ExperimentResultsView';
import DynamicPredictionForm from '@/components/training/DynamicPredictionForm';
import { Loader } from 'lucide-react';

const ModelTrainingContent: React.FC = () => {
  const { datasetId } = useDataset();
  const { 
    activeTab, 
    setActiveTab, 
    experimentResults,
    experimentStatus,
    resultsLoaded
  } = useTraining();

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, [setActiveTab]);

  const isActiveTab = (tabName: string): boolean => {
    return activeTab === tabName;
  };

  return (
    <div className="container mx-auto">
      <div className="space-y-6">
        {datasetId ? (
          <>
            {/* Navigation tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-4" aria-label="Tabs">
                <button
                  onClick={() => handleTabChange('automl')}
                  className={`px-3 py-2 text-sm font-medium ${
                    isActiveTab('automl')
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  AutoML Training
                </button>
                <button
                  onClick={() => handleTabChange('custom')}
                  className={`px-3 py-2 text-sm font-medium ${
                    isActiveTab('custom')
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Custom Training
                </button>
                {/* Fix this button to use isActiveTab instead of direct comparison */}
                <button
                  onClick={() => handleTabChange('results')}
                  className={`px-3 py-2 text-sm font-medium ${
                    isActiveTab('results')
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  disabled={!experimentResults}
                >
                  Results {experimentStatus === 'running' && <Loader className="inline-block ml-1 h-4 w-4 animate-spin" />}
                </button>
                {/* Fix this button to use isActiveTab instead of direct comparison */}
                <button
                  onClick={() => handleTabChange('predict')}
                  className={`px-3 py-2 text-sm font-medium ${
                    isActiveTab('predict')
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  disabled={!experimentResults || experimentStatus !== 'completed'}
                >
                  Predict
                </button>
              </nav>
            </div>

            {/* Tab content */}
            {isActiveTab('automl') && <AutoMLTraining />}
            {isActiveTab('custom') && <CustomTraining />}
            {isActiveTab('results') && experimentResults && <ExperimentResultsView />}
            {isActiveTab('predict') && experimentResults && experimentStatus === 'completed' && (
              <DynamicPredictionForm />
            )}
          </>
        ) : (
          <div className="text-center p-8 text-gray-500">
            Please select a dataset to begin.
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelTrainingContent;
