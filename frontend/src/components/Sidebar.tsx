import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Activity, 
  Bot, 
  Monitor, 
  TestTube, 
  BarChart3, 
  Settings,
  ChevronRight,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
}

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Dashboard', href: '/dashboard', icon: Activity },
  { name: 'Testing Lab', href: '/testing', icon: TestTube },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Solution', href: '/solution', icon: Lightbulb },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar = ({ collapsed }: SidebarProps) => {
  return (
    <aside className={cn(
      "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card border-r border-card-border transition-all duration-300 z-40",
      "hidden md:block",
      collapsed ? "w-16" : "w-64"
    )}>
      <nav className="p-2 sm:p-4">
        <ul className="space-y-1 sm:space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors group",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  )
                }
              >
                <item.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="truncate">{item.name}</span>
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};