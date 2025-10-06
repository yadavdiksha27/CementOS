import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'active' | 'warning' | 'error' | 'offline';
  children: React.ReactNode;
  className?: string;
}

const statusStyles = {
  active: 'bg-success-light text-success border-success/20',
  warning: 'bg-warning-light text-warning-foreground border-warning/20',
  error: 'bg-danger-light text-danger border-danger/20',
  offline: 'bg-muted text-muted-foreground border-border'
};

const statusIcons = {
  active: '🟢',
  warning: '🟡',
  error: '🔴',
  offline: '⚫'
};

export const StatusBadge = ({ status, children, className }: StatusBadgeProps) => {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
      statusStyles[status],
      className
    )}>
      <span className="text-xs">{statusIcons[status]}</span>
      {children}
    </span>
  );
};