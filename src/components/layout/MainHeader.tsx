import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BarChart2, Upload, HelpCircle, Star, LineChart } from 'lucide-react';
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
import MobileNav from './MobileNav';
import { useIsMobile } from '@/hooks/use-mobile';

const MainHeader = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const isMobile = useIsMobile();

  const getHelpContent = () => {
    if (currentPath.includes('/dataset')) {
      return {
        title: "Dataset Help",
        content: (
          <div className="space-y-4">
            <p>
              In the Datasets tab, you upload your CSV files, clean missing values, select important features, and prepare your data for training. You can also preview or download datasets from here.
            </p>
          </div>
        )
      };
    } else if (currentPath.includes('/training')) {
      return {
        title: "Training Help",
        content: (
          <div className="space-y-4">
            <p>
              Training is where you build your machine learning models.
            </p>
            <p>
              First, select the target column — the thing you want to predict — and the features that should be used to make the prediction.
            </p>
            
            <div className="mt-3">
              <p className="font-medium mb-2">
                Choose your training method:
              </p>
              <div className="ml-4 space-y-3">
                <div>
                  <p className="font-medium">AutoML:</p>
                  <p className="ml-2">
                    Automatically tests different algorithms and settings to find the best model for your data. You don't need to adjust anything manually — just click "Start AutoML" and the system will find the top model for you.
                  </p>
                </div>
                
                <div>
                  <p className="font-medium">Custom Training:</p>
                  <p className="ml-2">
                    You manually pick an algorithm (like Decision Tree, Random Forest, etc.), and optionally adjust its hyperparameters. This gives you more control over the model behavior.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-3">
              <p className="font-medium mb-2">
                After training completes, you will see:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>A summary of results (accuracy, RMSE, F1, or other metrics depending on your task)</li>
                <li>Visualizations like confusion matrices, ROC curves, feature importance charts, and more</li>
                <li>A Download button to get your trained model file</li>
              </ul>
            </div>
            
            <div className="mt-3">
              <p className="font-medium mb-1">Next Steps:</p>
              <p>
                Use your trained model to make predictions manually (by entering data) or by uploading a CSV.
              </p>
              <p className="mt-2">
                If you're not happy with the results, you can retrain with different settings.
              </p>
            </div>
            
            <div className="mt-3">
              <p className="font-medium mb-1">Tip:</p>
              <p>
                After finishing training and predictions, your experiments are stored. You can find them later inside the Dashboard under the Experiments tab.
              </p>
            </div>
          </div>
        )
      };
    } else if (currentPath.includes('/dashboard')) {
      return {
        title: "Dashboard Help",
        content: (
          <div className="space-y-4">
            <p>
              The Dashboard is your workspace overview. Here you can browse and manage all your Datasets, Experiments, and Comparisons in one place.
            </p>
            <p>
              You can view details, download files, delete records, or start new training based on existing work.
            </p>
            <p>
              Think of it like your ML project's control center — everything is accessible here.
            </p>
          </div>
        )
      };
    } else {
      return {
        title: "Help",
        content: (
          <div className="space-y-4">
            <p>
              Welcome to AutoML Web App. Select a section from the navigation to get started.
            </p>
          </div>
        )
      };
    }
  };

  const helpContent = getHelpContent();
  
  return (
    <header className="bg-white border-b border-gray-200 py-3 px-4 sm:px-6">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          {isMobile && <MobileNav />}
          <Link to="/" className="text-xl font-bold text-primary flex items-center gap-2">
            <img 
              src="/lovable-uploads/c9e22fa3-6ca8-4d5e-bcbd-976529ccc178.png" 
              alt="KyrO Logo" 
              className="h-5 w-5 sm:h-6 sm:w-6" 
            />
            <span className="hidden sm:inline">IEE AutoML</span>
            <span className="sm:hidden">IEE</span>
          </Link>
        </div>
        
        {!isMobile && (
          <div className="flex-1 flex justify-center max-w-md mx-4">
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
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3 h-10 bg-black text-white">
                <TabsTrigger 
                  value="dashboard" 
                  asChild 
                  className="rounded-none shadow-none data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-none"
                >
                  <Link to="/dashboard" className="flex items-center justify-center gap-2 w-full h-full">
                    <BarChart2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="dataset" 
                  asChild 
                  className="rounded-none shadow-none data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-none"
                >
                  <Link to="/dataset" className="flex items-center justify-center gap-2 w-full h-full">
                    <Upload className="h-4 w-4" />
                    <span className="hidden sm:inline">Dataset</span>
                  </Link>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="training" 
                  asChild 
                  className="rounded-none shadow-none data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-none"
                >
                  <Link to="/training" className="flex items-center justify-center gap-2 w-full h-full">
                    <LineChart className="h-4 w-4" />
                    <span className="hidden sm:inline">Training</span>
                  </Link>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          {/* Rate App button hidden for now
          <a 
            href="https://docs.google.com/forms/d/e/1FAIpQLSeqZhZw6E08GzSNGTCZnVwGoJJktNCJRZSwaFdtDF4o2rFX-g/viewform?usp=dialog" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="flex items-center gap-1 mr-2">
              <Star className="h-4 w-4" />
              <span className="hidden md:inline">Rate App</span>
            </Button>
          </a>
          */}
          
          <Link to="/feedback">
            <Button variant="outline" size="sm" className="flex items-center gap-1 mr-2">
              <Star className="h-4 w-4 text-amber-500" />
              <span className="hidden md:inline">Feedback</span>
            </Button>
          </Link>
          
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
              </DialogHeader>
              <div className="mt-2 text-sm leading-relaxed max-h-[60vh] overflow-y-auto">
                {helpContent.content}
              </div>
            </DialogContent>
          </Dialog>
          
          <AuthHeader />
        </div>
      </div>
    </header>
  );
};

export default MainHeader;
