
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Upload, Cpu, BarChart2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <header className="container max-w-6xl mx-auto px-4 py-6 flex justify-between items-center border-b border-gray-200">
        <Link to="/" className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Cpu className="h-6 w-6" />
          <span className="hidden sm:inline">KyrO AutoML</span>
          <span className="sm:hidden">KyrO</span>
        </Link>
        <div>
          {user ? (
            <Link to="/dataset">
              <Button 
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Get Started</span>
                <span className="sm:hidden">Start</span>
              </Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button 
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800"
              >
                <ArrowRight className="h-4 w-4" />
                <span className="hidden sm:inline">Sign In</span>
                <span className="sm:hidden">Login</span>
              </Button>
            </Link>
          )}
        </div>
      </header>
      
      <div className="container max-w-6xl mx-auto px-4 py-6 sm:py-10">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-8 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            AutoML Web App for Supervised Learning
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mb-6 sm:mb-8">
            A complete platform for automated machine learning — from dataset upload and cleaning 
            to training, evaluation, and prediction. No code required.
          </p>
          <Link to={user ? "/dataset" : "/auth"}>
            <Button size="lg" className="bg-gray-900 text-white hover:bg-gray-800 w-full sm:w-auto">
              {user ? "Get Started" : "Sign In to Start"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
        
        {/* Three Main Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8 sm:mb-16">
          {/* Dataset Handling Card */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-200 hover:border-gray-300">
            <div className="bg-gray-100 p-3 rounded-full w-fit mb-4">
              <Upload className="h-6 w-6 sm:h-7 sm:w-7 text-gray-700" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">Dataset Handling</h2>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              Upload CSV files, handle missing values, and select key features for training.
            </p>
            <Link to={user ? "/dataset" : "/auth"} className="text-gray-900 hover:text-gray-700 font-medium inline-flex items-center">
              Upload & Prepare Data
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          {/* Model Training Card */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-200 hover:border-gray-300">
            <div className="bg-gray-100 p-3 rounded-full w-fit mb-4">
              <Cpu className="h-6 w-6 sm:h-7 sm:w-7 text-gray-700" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">Model Training</h2>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              Run AutoML to discover the best model or configure custom training with your preferred algorithm.
            </p>
            <Link to={user ? "/training" : "/auth"} className="text-gray-900 hover:text-gray-700 font-medium inline-flex items-center">
              Train Your Model
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          {/* Dashboard Card */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-200 hover:border-gray-300">
            <div className="bg-gray-100 p-3 rounded-full w-fit mb-4">
              <BarChart2 className="h-6 w-6 sm:h-7 sm:w-7 text-gray-700" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">Results & Predictions</h2>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              Compare experiments, run predictions, and manage models — all in one place.
            </p>
            <Link to={user ? "/dashboard" : "/auth"} className="text-gray-900 hover:text-gray-700 font-medium inline-flex items-center">
              Explore Dashboard
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
        
        {/* Thesis Footer CTA Section */}
        <div className="bg-gray-900 text-white rounded-2xl p-6 sm:p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-0">
            <div className="md:w-2/3 mb-6 md:mb-0">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3">Ready to start your ML journey?</h2>
              <p className="text-gray-300 text-sm sm:text-base">
                Upload your dataset and follow the guided ML pipeline — designed for students, researchers, and practitioners.
              </p>
            </div>
            <Link to={user ? "/dataset" : "/auth"} className="w-full md:w-auto">
              <Button size="lg" variant="secondary" className="w-full md:w-auto bg-white text-gray-900 hover:bg-gray-100">
                Get Started
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
