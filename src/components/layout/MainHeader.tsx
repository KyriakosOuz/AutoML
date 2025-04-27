import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Database, PieChart, BarChart2, HelpCircle, User } from 'lucide-react';
import AuthHeader from '@/components/auth/AuthHeader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MainHeader = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const getHelpContent = () => {
    if (currentPath.includes('/dataset')) {
      return {
        title: "Dataset Help",
        content: "In the Datasets tab, you upload your CSV files, clean missing values, select important features, and prepare your data for training. You can also preview or download datasets from here."
      };
    } else if (currentPath.includes('/training')) {
      return {
        title: "Training Help",
        content: "Training is where you build your machine learning models. First, select the target column — the thing you want to predict — and the features that should be used to make the prediction. Choose your training method: AutoML: Automatically tests different algorithms and settings to find the best model for your data. You don't need to adjust anything manually — just click \"Start AutoML\" and the system will find the top model for you. Custom Training: You manually pick an algorithm (like Decision Tree, Random Forest, etc.), and optionally adjust its hyperparameters. This gives you more control over the model behavior. After training completes, you will see: A summary of results (accuracy, RMSE, F1, or other metrics depending on your task). Visualizations like confusion matrices, ROC curves, feature importance charts, and more. A Download button to get your trained model file. Next Steps: Use your trained model to make predictions manually (by entering data) or by uploading a CSV. If you're not happy with the results, you can retrain with different settings. Tip: After finishing training and predictions, your experiments are stored. You can find them later inside the Dashboard under the Experiments tab."
      };
    } else if (currentPath.includes('/dashboard')) {
      return {
        title: "Dashboard Help",
        content: "The Dashboard is your workspace overview. Here you can browse and manage all your Datasets, Experiments, and Comparisons in one place. You can view details, download files, delete records, or start new training based on existing work. Think of it like your ML project's control center — everything is accessible here."
      };
    } else {
      return {
        title: "Help",
        content: "Welcome to AutoML Web App. Select a section from the navigation to get started."
      };
    }
  };

  const helpContent = getHelpContent();
  
  return (
    <header className="bg-white border-b border-gray-200 py-3 px-4 sm:px-6">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-primary flex items-center gap-2">
          <Database className="h-5 w-5" />
          AutoML Web App
        </Link>
        
        <div className="flex-1 flex justify-center">
          <Tabs 
            value={
              currentPath.includes('/dashboard') 
                ? 'dashboard' 
                : currentPath.includes('/dataset') 
                  ? 'dataset' 
                  : currentPath.includes('/training') 
                    ? 'training' 
                    : 'home'
            } 
            className="w-full max-w-md"
          >
            <TabsList className="grid w-full grid-cols-3 h-10 bg-black text-white">
              <TabsTrigger 
                value="dashboard" 
                asChild 
                className="rounded-none shadow-none data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-none"
              >
                <Link to="/dashboard" className="flex items-center justify-center gap-2 w-full h-full">
                  <PieChart className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              </TabsTrigger>
              
              <TabsTrigger 
                value="dataset" 
                asChild 
                className="rounded-none shadow-none data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-none"
              >
                <Link to="/dataset" className="flex items-center justify-center gap-2 w-full h-full">
                  <Database className="h-4 w-4" />
                  <span className="hidden sm:inline">Dataset</span>
                </Link>
              </TabsTrigger>
              
              <TabsTrigger 
                value="training" 
                asChild 
                className="rounded-none shadow-none data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-none"
              >
                <Link to="/training" className="flex items-center justify-center gap-2 w-full h-full">
                  <BarChart2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Training</span>
                </Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <HelpCircle className="h-4 w-4" />
                <span className="hidden md:inline">Help</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{helpContent.title}</DialogTitle>
                <DialogDescription className="mt-4 text-sm leading-relaxed whitespace-pre-wrap">
                  {helpContent.content}
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
          
          <AuthHeader />
        </div>
      </div>
    </header>
  );
};

export default MainHeader;
