import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StudyProvider } from "@/contexts/StudyContext";
import { DatabaseLoadingProvider } from "@/components/DatabaseLoadingProvider";
import { DBProvider } from "@/contexts/DBProvider";
import BottomNavigation from "@/components/BottomNavigation";
import Index from "./pages/Index";
import Configuration from "./pages/Configuration";
import StudySessionPage from "./pages/StudySessionPage";
import QuestionsManager from "./pages/QuestionsManager";
import BattleFieldPage from "./pages/BattleFieldPage";
import ColiseumPage from "./pages/ColiseumPage";
import NotFound from "./pages/NotFound";

// Only import DatabaseViewer in development
const DatabaseViewer = import.meta.env.DEV ? 
  React.lazy(() => import("./pages/DatabaseViewer")) : 
  null;

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DBProvider>
        <DatabaseLoadingProvider>
          <StudyProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="pb-20">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/configuration" element={<Configuration />} />
                  <Route path="/study-session" element={<StudySessionPage />} />
                  <Route path="/questions" element={<QuestionsManager />} />
                  <Route path="/battle" element={<BattleFieldPage />} />
                  <Route path="/coliseum" element={<ColiseumPage />} />
                  {import.meta.env.DEV && DatabaseViewer && (
                    <Route 
                      path="/database" 
                      element={
                        <React.Suspense fallback={<div>Loading...</div>}>
                          <DatabaseViewer />
                        </React.Suspense>
                      } 
                    />
                  )}
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
              <BottomNavigation />
            </BrowserRouter>
          </StudyProvider>
        </DatabaseLoadingProvider>
      </DBProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
