
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import DatasetPage from "./pages/DatasetPage";
import ModelTrainingPage from "./pages/ModelTrainingPage";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import AuthPage from "./pages/AuthPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import ExperimentDetailPage from "./pages/ExperimentDetailPage";
import FeedbackPage from "./pages/FeedbackPage";
import SettingsPage from "./pages/SettingsPage";
import { AIAssistantProvider } from "./contexts/AIAssistantContext";
import FloatingChatButton from "./components/ai-assistant/FloatingChatButton";
import { AssistantInsightsProvider } from "./contexts/AssistantInsightsContext";
import { DatasetProvider } from "./contexts/DatasetContext";
import { TrainingProvider } from "./contexts/training/TrainingContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <div className="min-h-screen overflow-x-hidden">
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AIAssistantProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route element={<MainLayout />}>
                  <Route path="/dataset/*" element={
                    <ProtectedRoute>
                      <DatasetProvider>
                        <AssistantInsightsProvider>
                          <DatasetPage />
                        </AssistantInsightsProvider>
                      </DatasetProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/training" element={
                    <ProtectedRoute>
                      <DatasetProvider>
                        <TrainingProvider>
                          <AssistantInsightsProvider>
                            <ModelTrainingPage />
                          </AssistantInsightsProvider>
                        </TrainingProvider>
                      </DatasetProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/feedback" element={
                    <ProtectedRoute>
                      <FeedbackPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/experiment/:experimentId" element={
                    <ProtectedRoute>
                      <DatasetProvider>
                        <TrainingProvider>
                          <AssistantInsightsProvider>
                            <ExperimentDetailPage />
                          </AssistantInsightsProvider>
                        </TrainingProvider>
                      </DatasetProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  } />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
              <FloatingChatButton />
            </AIAssistantProvider>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
