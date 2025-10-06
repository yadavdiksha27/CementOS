import { TrendingUp, TrendingDown, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  change: number;
  target?: string | number;
  icon?: React.ReactNode;
  status: 'success' | 'warning' | 'danger' | 'neutral';
  className?: string;
  onViewDetails?: () => void;
}

const statusStyles = {
  success: 'border-l-success bg-success-light/50',
  warning: 'border-l-warning bg-warning-light/50',
  danger: 'border-l-danger bg-danger-light/50',
  neutral: 'border-l-muted bg-card'
};

export const KPICard = ({ 
  title, 
  value, 
  unit, 
  change, 
  target, 
  icon, 
  status, 
  className,
  onViewDetails 
}: KPICardProps) => {
  const isPositive = change > 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const trendColor = status === 'success' ? 'text-success' : status === 'danger' ? 'text-danger' : 'text-warning';

  return (
    <Card className={cn(
      'p-6 border-l-4 transition-all duration-200 hover:shadow-md',
      statusStyles[status],
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {icon && <div className="text-muted-foreground">{icon}</div>}
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          </div>
          
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-foreground">{value}</span>
            {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
          </div>
          
          <div className="flex items-center gap-4">
            <div className={cn('flex items-center gap-1', trendColor)}>
              <TrendIcon className="h-4 w-4" />
              <span className="text-sm font-medium">
                {isPositive ? '+' : ''}{change}%
              </span>
            </div>
            
            {target && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Target className="h-3 w-3" />
                <span>Target: {target}{unit}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {onViewDetails && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="mt-4 w-full text-primary hover:bg-primary/10"
          onClick={onViewDetails}
        >
          View Details
        </Button>
      )}
    </Card>
  );
};