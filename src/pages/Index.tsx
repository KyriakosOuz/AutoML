import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart, Database, LineChart, Upload } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="container max-w-6xl mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            AutoML Web App
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mb-8">
            Your complete platform for data upload, preprocessing, model training and deployment.
            Get powerful machine learning insights without writing code.
          </p>
          <Link to="/dataset">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-indigo-100 p-3 rounded-full w-fit mb-4">
              <Upload className="h-7 w-7 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Dataset Handling</h2>
            <p className="text-gray-600 mb-4">
              Upload CSV datasets, handle missing values, and select important features
              for your machine learning models.
            </p>
            <Link to="/dataset" className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center">
              Upload Data
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-indigo-100 p-3 rounded-full w-fit mb-4">
              <Database className="h-7 w-7 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Model Training</h2>
            <p className="text-gray-600 mb-4">
              Automatically train and evaluate multiple models to find the best performer
              for your specific dataset and task.
            </p>
            <span className="text-gray-400 inline-flex items-center">
              Coming Soon
              <ArrowRight className="ml-1 h-4 w-4" />
            </span>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-indigo-100 p-3 rounded-full w-fit mb-4">
              <BarChart className="h-7 w-7 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Model Deployment</h2>
            <p className="text-gray-600 mb-4">
              Deploy your trained models as APIs and monitor their performance
              in a production environment.
            </p>
            <span className="text-gray-400 inline-flex items-center">
              Coming Soon
              <ArrowRight className="ml-1 h-4 w-4" />
            </span>
          </div>
        </div>
        
        <div className="bg-indigo-900 text-white rounded-2xl p-8 md:p-12">
          <div className="md:flex items-center justify-between">
            <div className="md:w-2/3 mb-6 md:mb-0">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to start your ML journey?</h2>
              <p className="text-indigo-200">
                Begin by uploading your dataset and exploring the power of automated machine learning.
              </p>
            </div>
            <Link to="/dataset">
              <Button size="lg" variant="secondary" className="w-full md:w-auto">
                Go to Dataset Handler
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
