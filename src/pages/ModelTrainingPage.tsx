
import React, { useEffect } from 'react';
import { useTraining } from '@/contexts/training/TrainingContext';
import ModelTrainingContent from '@/components/training/ModelTrainingContent';
import TrainingHeader from '@/components/training/TrainingHeader';
import { Toaster } from '@/components/ui/toaster';
import TrainingSidePanel from '@/components/ai-assistant/TrainingSidePanel';
import { TrainingProvider } from '@/contexts/training/TrainingContext';

const ModelTrainingPageContent: React.FC = () => {
  const { checkLastExperiment, lastTrainingType, isTraining, isPredicting, activeTab } = useTraining();
  
  // Debug: Log training state on mount and changes
  useEffect(() => {
    console.log("[ModelTrainingPage] Training state:", {
      isTraining,
      isPredicting,
      trainingType: lastTrainingType || 'none',
      activeTab // ✅ FIXED: Also log the current activeTab
    });
  }, [isTraining, isPredicting, lastTrainingType, activeTab]);
  
  // Check for the most recent experiment when the component mounts
  useEffect(() => {
    console.log("[ModelTrainingPage] Component mounted, checking for most recent experiment");
    checkLastExperiment();
    // Empty dependency array ensures this only runs once on mount, regardless of checkLastExperiment changes
  }, []); 
  
  return (
    <div className="flex flex-col min-h-screen">
      <TrainingHeader />
      <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden">
        <ModelTrainingContent />
      </div>
      <TrainingSidePanel />
      <Toaster />
    </div>
  );
};

// Wrapper component that provides the TrainingProvider context
const ModelTrainingPage: React.FC = () => {
  return (
    <TrainingProvider>
      <ModelTrainingPageContent />
    </TrainingProvider>
  );
};

export default ModelTrainingPage;
