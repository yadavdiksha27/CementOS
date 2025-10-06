import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  Settings, 
  Download, 
  Search,
  Volume2,
  VolumeX,
  Filter,
  X,
  Eye,
  Wrench,
  Bot,
  Clock,
  FileText
} from 'lucide-react';

interface NotificationCenterProps {
  children: React.ReactNode;
}

interface Notification {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  time: string;
  location?: string;
  action?: string;
  isRead: boolean;
  category: 'system' | 'agent' | 'process' | 'maintenance';
}

export function NotificationCenter({ children }: NotificationCenterProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'critical',
      title: 'Kiln temperature exceeded 1500°C',
      message: 'Critical temperature spike detected in clinkerization stage',
      time: '2 minutes ago',
      location: 'Clinkerization Stage',
      action: 'Auto-corrected',
      isRead: false,
      category: 'process'
    },
    {
      id: '2',
      type: 'warning',
      title: 'Mill bearing temperature rising',
      message: 'Current: 85°C | Threshold: 90°C | Trend: +2°C/hour',
      time: '5 minutes ago',
      location: 'Raw Mill Unit',
      action: 'Monitoring',
      isRead: false,
      category: 'maintenance'
    },
    {
      id: '3',
      type: 'info',
      title: 'TSR Agent optimized fuel mix',
      message: 'New mix: 52% alt fuel | Savings: 8% energy, 12% CO2',
      time: '8 minutes ago',
      location: 'Fuel System',
      action: 'Completed',
      isRead: false,
      category: 'agent'
    },
    {
      id: '4',
      type: 'info',
      title: 'Quality prediction updated',
      message: 'Predicted score: 94.2% | Confidence: 98.7%',
      time: '12 minutes ago',
      location: 'Quality Lab',
      action: 'Updated',
      isRead: true,
      category: 'system'
    },
    {
      id: '5',
      type: 'success',
      title: 'Maintenance cycle completed',
      message: 'Scheduled maintenance on Fan #3 completed successfully',
      time: '1 hour ago',
      location: 'Cooling System',
      action: 'Completed',
      isRead: true,
      category: 'maintenance'
    }
  ]);

  const filterCounts = {
    all: notifications.length,
    critical: notifications.filter(n => n.type === 'critical').length,
    warning: notifications.filter(n => n.type === 'warning').length,
    info: notifications.filter(n => n.type === 'info').length,
    unread: notifications.filter(n => !n.isRead).length
  };

  const getIcon = (type: string, category: string) => {
    if (type === 'critical') return <AlertTriangle className="h-4 w-4 text-destructive" />;
    if (type === 'warning') return <AlertTriangle className="h-4 w-4 text-warning" />;
    if (type === 'success') return <CheckCircle className="h-4 w-4 text-success" />;
    if (category === 'agent') return <Bot className="h-4 w-4 text-primary" />;
    return <Info className="h-4 w-4 text-info" />;
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'unread' && !notification.isRead) ||
                         notification.type === selectedFilter;
    
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-base sm:text-lg">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <span className="truncate">Notification Center</span>
            <Badge variant="destructive" className="ml-auto text-xs">
              {notifications.filter(n => !n.isRead).length}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {/* Search and Controls */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={markAllAsRead}>
                  Mark All Read
                </Button>
              </div>
              <Button size="sm" variant="ghost">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {[
              { key: 'all', label: 'All', count: filterCounts.all },
              { key: 'critical', label: 'Critical', count: filterCounts.critical },
              { key: 'warning', label: 'Warning', count: filterCounts.warning },
              { key: 'info', label: 'Info', count: filterCounts.info },
              { key: 'unread', label: 'Unread', count: filterCounts.unread }
            ].map((filter) => (
              <Button
                key={filter.key}
                size="sm"
                variant={selectedFilter === filter.key ? 'default' : 'ghost'}
                onClick={() => setSelectedFilter(filter.key)}
                className="flex-1 text-xs"
              >
                {filter.label}
                {filter.count > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                    {filter.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Notifications List */}
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border rounded-lg transition-colors ${
                    !notification.isRead ? 'bg-muted/50 border-primary/20' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getIcon(notification.type, notification.category)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`font-medium text-sm ${!notification.isRead ? 'font-semibold' : ''}`}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{notification.time}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      
                      {notification.location && (
                        <p className="text-xs text-muted-foreground mb-2">
                          📍 {notification.location}
                        </p>
                      )}

                      {notification.action && (
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {notification.action}
                          </Badge>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {notification.type === 'warning' && (
                          <Button size="sm" variant="outline" className="h-6 text-xs">
                            <Wrench className="h-3 w-3 mr-1" />
                            Schedule Check
                          </Button>
                        )}
                        
                        <Button size="sm" variant="ghost" className="h-6 text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                        
                        {!notification.isRead && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 text-xs"
                            onClick={() => markAsRead(notification.id)}
                          >
                            Mark Read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Footer Actions */}
          <div className="flex gap-2 pt-3 border-t">
            <Button variant="outline" size="sm" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Export Log
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <FileText className="h-4 w-4 mr-2" />
              View All
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}