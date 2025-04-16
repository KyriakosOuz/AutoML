
import React from 'react';
import { DatasetProvider } from '@/contexts/DatasetContext';
import FileUpload from '@/components/dataset/FileUpload';
import DataPreview from '@/components/dataset/DataPreview';
import MissingValueHandler from '@/components/dataset/MissingValueHandler';
import FeatureImportanceChart from '@/components/dataset/FeatureImportanceChart';
import TaskDetector from '@/components/dataset/TaskDetector';
import FeatureSelector from '@/components/dataset/FeatureSelector';
import PreprocessingOptions from '@/components/dataset/PreprocessingOptions';

const DatasetPage: React.FC = () => {
  return (
    <DatasetProvider>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container max-w-5xl mx-auto px-4">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dataset Upload & Preprocessing</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Upload, explore, and preprocess your datasets for machine learning. 
              Handle missing values, select features, and prepare your data for modeling.
            </p>
          </header>
          
          <div className="space-y-6">
            <FileUpload />
            <DataPreview />
            <MissingValueHandler />
            <FeatureImportanceChart />
            <TaskDetector />
            <FeatureSelector />
            <PreprocessingOptions />
          </div>
          
          <footer className="mt-12 text-center text-sm text-gray-500">
            <p>© 2025 AutoML Web App. Data processing powered by FastAPI.</p>
          </footer>
        </div>
      </div>
    </DatasetProvider>
  );
};

export default DatasetPage;
