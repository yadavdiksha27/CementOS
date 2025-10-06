import { Bell, Settings, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationCenter } from '@/components/modals/NotificationCenter';
import { ProfileModal } from '@/components/modals/ProfileModal';
import { APIStatusIndicator } from '@/components/dashboard/APIStatusIndicator';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

export const Header = ({ onToggleSidebar }: HeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-card border-b border-card-border flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">C</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">CementOS</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* API Status Indicator */}
        <APIStatusIndicator />
        
        <div className="hidden sm:block text-sm text-muted-foreground">
          Last Updated: <span className="text-foreground font-medium">2m ago</span>
        </div>
        
        <NotificationCenter>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 text-xs bg-danger text-danger-foreground">
              5
            </Badge>
          </Button>
        </NotificationCenter>
        
        <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
          <Settings className="h-5 w-5" />
        </Button>
        
        <ProfileModal>
          <Button variant="ghost" size="sm">
            <User className="h-5 w-5" />
          </Button>
        </ProfileModal>
      </div>
    </header>
  );
};