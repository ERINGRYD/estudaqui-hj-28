
import React from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';

interface StudyPlanFloatingButtonProps {
  onClick: () => void;
  visible?: boolean;
}

const StudyPlanFloatingButton: React.FC<StudyPlanFloatingButtonProps> = ({ 
  onClick, 
  visible = true 
}) => {
  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={onClick}
        size="lg"
        className="rounded-full shadow-lg bg-study-primary hover:bg-study-primary/90 text-study-primary-foreground p-4 h-auto"
      >
        <div className="flex flex-col items-center space-y-1">
          <BookOpen className="h-6 w-6" />
          <span className="text-sm font-medium">Plano</span>
        </div>
      </Button>
    </div>
  );
};

export default StudyPlanFloatingButton;
