import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, BarChart3, BookOpen } from 'lucide-react';
import StudyPlanner from '@/components/StudyPlanner';
import Dashboard from '@/components/Dashboard';
import Statistics from '@/components/Statistics';
import { useStudyContext } from '@/contexts/StudyContext';
const IndexContent = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const {
    studySessions,
    subjects,
    studyPlan,
    examDate,
    selectedExam
  } = useStudyContext();
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);
  return <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          
          <TabsContent value="dashboard" className="mt-0">
            <Dashboard studySessions={studySessions} subjects={subjects} studyPlan={studyPlan} examDate={examDate} selectedExam={selectedExam} />
          </TabsContent>
          
          <TabsContent value="planner" className="mt-0">
            <StudyPlanner />
          </TabsContent>
          
          <TabsContent value="statistics" className="mt-0">
            <Statistics studySessions={studySessions} subjects={subjects} />
          </TabsContent>
        </Tabs>
      </div>
    </div>;
};
const Index = () => {
  return <IndexContent />;
};
export default Index;