
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';
import { StudySession, StudySubject, StudyPlan } from '@/types/study';
import StudyProgressModal from './StudyProgressModal';

interface StudyProgressFloatingButtonProps {
  studySessions: StudySession[];
  subjects: StudySubject[];
  studyPlan?: StudyPlan | null;
  visible: boolean;
}

const StudyProgressFloatingButton: React.FC<StudyProgressFloatingButtonProps> = ({
  studySessions,
  subjects,
  studyPlan,
  visible
}) => {
  const [showModal, setShowModal] = useState(false);

  if (!visible || !studyPlan) return null;

  return (
    <>
      <div className="fixed bottom-20 right-4 z-50">
        <Button
          onClick={() => setShowModal(true)}
          className="rounded-full w-14 h-14 shadow-lg bg-study-primary hover:bg-study-primary/90 text-study-primary-foreground"
          size="lg"
        >
          <TrendingUp className="h-6 w-6" />
        </Button>
      </div>
      
      <StudyProgressModal
        open={showModal}
        onClose={() => setShowModal(false)}
        studySessions={studySessions}
        studyPlan={studyPlan}
      />
    </>
  );
};

export default StudyProgressFloatingButton;
