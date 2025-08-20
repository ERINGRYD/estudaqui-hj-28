import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  BarChart3, 
  Settings, 
  Clock,
  Database,
  Target,
  Sword,
  Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      path: '/',
      tab: 'dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      isDefault: true
    },
    {
      path: '/',
      tab: 'planner',
      icon: BookOpen,
      label: 'Planner'
    },
    {
      path: '/study-session',
      icon: Clock,
      label: 'Sessão',
      isHighlighted: true
    },
    {
      path: '/',
      tab: 'statistics',
      icon: BarChart3,
      label: 'Estatísticas'
    },
    {
      path: '/questions',
      icon: Target,
      label: 'Questões'
    },
    {
      path: '/battle',
      icon: Sword,
      label: 'Batalha'
    },
    {
      path: '/coliseum',
      icon: Trophy,
      label: 'Coliseu'
    },
    {
      path: '/configuration',
      icon: Settings,
      label: 'Config'
    },
    // Add database viewer only in development
    ...(import.meta.env.DEV ? [{
      path: '/database',
      icon: Database,
      label: 'Database'
    }] : [])
  ];

  const handleNavigation = (item: typeof navItems[0]) => {
    if (item.path === '/' && item.tab) {
      navigate('/', { state: { activeTab: item.tab } });
    } else {
      navigate(item.path);
    }
  };

  const isActive = (item: typeof navItems[0]) => {
    if (location.pathname === item.path) {
      if (item.tab) {
        return location.state?.activeTab === item.tab || (item.isDefault && !location.state?.activeTab);
      }
      return true;
    }
    return false;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            
            return (
              <Button
                key={`${item.path}-${item.tab || 'default'}`}
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation(item)}
                className={`flex flex-col items-center space-y-1 px-3 py-2 h-auto min-w-0 ${
                  active 
                    ? 'text-study-primary bg-study-primary/10' 
                    : item.isHighlighted 
                      ? 'text-study-accent hover:text-study-accent hover:bg-study-accent/10' 
                      : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`h-5 w-5 ${item.isHighlighted ? 'drop-shadow-sm' : ''}`} />
                <span className="text-xs font-medium leading-none">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomNavigation;