import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Bot, 
  Activity, 
  Settings, 
  BarChart3, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Target,
  Zap,
  X
} from 'lucide-react';

interface ProcessAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  stageData: {
    name: string;
    agent: string;
    status: string;
  };
}

const agentDetails = {
  'Material Agent': {
    description: 'Monitors and optimizes raw material composition and quality',
    parameters: [
      { name: 'CaCO3 Content', value: '94.8%', status: 'optimal', target: '94-96%' },
      { name: 'Moisture', value: '2.3%', status: 'good', target: '<3%' },
      { name: 'Feed Rate', value: '145 t/h', status: 'optimal', target: '140-150 t/h' }
    ],
    performance: { uptime: '99.8%', tasks: 1023, successRate: 97.2 },
    actions: ['Adjust Rate', 'Quality History']
  },
  'Grinding Agent': {
    description: 'Controls raw mill operations and fineness optimization',
    parameters: [
      { name: 'Power', value: '2.8 MW', status: 'warning', target: '2.5-3.0 MW' },
      { name: 'Temperature', value: '95°C', status: 'good', target: '<100°C' },
      { name: 'Speed', value: '16.2 rpm', status: 'optimal', target: '15-17 rpm' },
      { name: 'Fineness', value: '3,200 cm²/g', status: 'optimal', target: '3,000-3,500 cm²/g' }
    ],
    performance: { uptime: '98.2%', tasks: 856, successRate: 96.8 },
    actions: ['Reduce Power', 'Target Fineness']
  },
  'Preheater Agent': {
    description: 'Manages preheater tower operations and heat recovery',
    parameters: [
      { name: 'Temperature', value: '1,050°C', status: 'optimal', target: '1,000-1,100°C' },
      { name: 'Draft', value: '-12 mbar', status: 'optimal', target: '-10 to -15 mbar' },
      { name: 'Heat Recovery', value: '89%', status: 'good', target: '>85%' },
      { name: 'Efficiency', value: '91.2%', status: 'optimal', target: '>90%' }
    ],
    performance: { uptime: '99.5%', tasks: 432, successRate: 98.7 },
    actions: ['Adjust Fuel', 'Check Draft']
  },
  'Clinker Agent': {
    description: 'Optimizes kiln operations and clinker formation',
    parameters: [
      { name: 'Flame Temp', value: '1,450°C', status: 'optimal', target: '1,400-1,500°C' },
      { name: 'Clinker Temp', value: '1,350°C', status: 'optimal', target: '1,300-1,400°C' },
      { name: 'RPM', value: '2.5', status: 'optimal', target: '2.0-3.0' },
      { name: 'Alt Fuel', value: '47%', status: 'good', target: '>45%' },
      { name: 'O2 Level', value: '3.2%', status: 'optimal', target: '2.8-3.5%' },
      { name: 'Quality Pred', value: '94.2%', status: 'optimal', target: '>92%' }
    ],
    performance: { uptime: '99.9%', tasks: 1247, successRate: 97.9 },
    actions: ['Temp Control', 'Fuel Mix', 'Quality Check']
  },
  'TSR Agent': {
    description: 'Controls cooling system and thermal shock recovery',
    parameters: [
      { name: 'Air Flow', value: '125 m³/min', status: 'optimal', target: '120-130 m³/min' },
      { name: 'Inlet Temp', value: '1,200°C', status: 'optimal', target: '1,150-1,250°C' },
      { name: 'Outlet Temp', value: '100°C', status: 'optimal', target: '<120°C' },
      { name: 'Cooling Rate', value: '12°C/min', status: 'optimal', target: '10-15°C/min' }
    ],
    performance: { uptime: '98.7%', tasks: 734, successRate: 96.1 },
    actions: ['Air Control', 'Temperature Monitor']
  },
  'Storage Agent': {
    description: 'Manages cement storage and quality preservation',
    parameters: [
      { name: 'Silo Level', value: '78%', status: 'good', target: '60-85%' },
      { name: 'Temperature', value: '45°C', status: 'optimal', target: '<50°C' },
      { name: 'Humidity', value: '2.1%', status: 'optimal', target: '<3%' },
      { name: 'Discharge Rate', value: '95 t/h', status: 'optimal', target: '80-100 t/h' }
    ],
    performance: { uptime: '99.1%', tasks: 423, successRate: 98.4 },
    actions: ['Level Monitor', 'Quality Check']
  }
};

export function ProcessAgentModal({ isOpen, onClose, stageData }: ProcessAgentModalProps) {
  const agent = agentDetails[stageData.agent as keyof typeof agentDetails];
  
  if (!agent) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'text-success';
      case 'good': return 'text-primary';
      case 'warning': return 'text-warning';
      case 'critical': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'optimal': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'good': return <CheckCircle className="h-4 w-4 text-primary" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            {stageData.agent} - {stageData.name}
            <Badge variant={stageData.status === 'active' ? 'default' : 'secondary'} className="ml-auto">
              {stageData.status.toUpperCase()}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Agent Overview */}
          <Card className="p-4">
            <p className="text-muted-foreground mb-4">{agent.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{agent.performance.uptime}</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{agent.performance.tasks}</div>
                <div className="text-sm text-muted-foreground">Tasks Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-info">{agent.performance.successRate}%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </Card>

          {/* Live Parameters */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Live Parameters
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agent.parameters.map((param, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{param.name}</span>
                    {getStatusIcon(param.status)}
                  </div>
                  
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xl font-bold ${getStatusColor(param.status)}`}>
                      {param.value}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Target: {param.target}
                    </span>
                  </div>
                  
                  <Progress 
                    value={param.status === 'optimal' ? 100 : param.status === 'good' ? 80 : 60} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Quick Actions
            </h3>
            
            <div className="flex flex-wrap gap-2">
              {agent.actions.map((action, index) => (
                <Button key={index} variant="outline" size="sm">
                  {action}
                </Button>
              ))}
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Trends
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 bg-success/10 rounded-lg">
                <CheckCircle className="h-4 w-4 text-success" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Parameter optimization completed</div>
                  <div className="text-xs text-muted-foreground">2 minutes ago</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-2 bg-primary/10 rounded-lg">
                <Target className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Quality prediction updated</div>
                  <div className="text-xs text-muted-foreground">5 minutes ago</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-2 bg-warning/10 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Minor parameter adjustment</div>
                  <div className="text-xs text-muted-foreground">12 minutes ago</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
