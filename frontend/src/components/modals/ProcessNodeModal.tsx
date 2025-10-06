import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Flame, 
  Settings, 
  BarChart3, 
  AlertTriangle,
  Bot,
  Thermometer,
  Wind,
  RotateCcw,
  Activity,
  TrendingUp,
  Save,
  History,
  Zap
} from 'lucide-react';

interface ProcessNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeData: {
    name: string;
    stage: string;
    agent: string;
    status: 'active' | 'warning' | 'error';
    parameters: any;
  };
}

export function ProcessNodeModal({ isOpen, onClose, nodeData }: ProcessNodeModalProps) {
  const [manualMode, setManualMode] = useState(false);
  const [parameters, setParameters] = useState({
    fuelRate: 45.2,
    airFlow: 125,
    rpm: 2.5,
    temperature: 1447
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-success';
      case 'warning': return 'text-warning';
      case 'error': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Activity className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
            {nodeData.name} - Detailed Control
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stage Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Process Stage</h3>
              <p className="text-2xl font-bold">{nodeData.stage}</p>
              <p className="text-sm text-muted-foreground">Rotary Kiln Operations</p>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-2">Agent Status</h3>
              <div className="flex items-center gap-2 mb-2">
                <Bot className="h-5 w-5 text-primary" />
                <span className="font-medium">{nodeData.agent}</span>
              </div>
              <Badge 
                variant="outline" 
                className={`${getStatusColor(nodeData.status)} border-current`}
              >
                {getStatusIcon(nodeData.status)}
                <span className="ml-1 capitalize">{nodeData.status}</span>
              </Badge>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-2">Performance</h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Confidence:</span>
                  <span className="font-bold">98.7%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Efficiency:</span>
                  <span className="font-bold">94.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Last Action:</span>
                  <span className="text-sm text-muted-foreground">2m ago</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Current Task */}
          <Card className="p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Current AI Task
            </h3>
            <p className="text-lg">"Optimizing fuel/air ratio for quality improvement"</p>
            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span>Started: 14:23</span>
              <span>•</span>
              <span>Progress: 67%</span>
              <span>•</span>
              <span>ETA: 8 minutes</span>
            </div>
          </Card>

          {/* Temperature Profile */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              Temperature Profile
            </h3>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Inlet</p>
                <p className="text-2xl font-bold">1,050°C</p>
              </div>
              <div className="text-center p-3 bg-orange-500/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Flame</p>
                <p className="text-2xl font-bold text-orange-500">1,447°C</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Outlet</p>
                <p className="text-2xl font-bold">1,350°C</p>
              </div>
            </div>

            {/* Temperature curve placeholder */}
            <div className="h-32 bg-muted/20 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Real-time Temperature Curve</p>
              </div>
            </div>
          </Card>

          {/* Live Parameters Control */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Live Parameter Control
              </h3>
              <div className="flex items-center gap-2">
                <Label htmlFor="manual-mode">Manual Override</Label>
                <input
                  id="manual-mode"
                  type="checkbox"
                  checked={manualMode}
                  onChange={(e) => setManualMode(e.target.checked)}
                  className="rounded border-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fuel Rate */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Fuel Rate</Label>
                  <span className="font-bold">{parameters.fuelRate} kg/h</span>
                </div>
                <Slider
                  value={[parameters.fuelRate]}
                  onValueChange={(value) => setParameters(prev => ({ ...prev, fuelRate: value[0] }))}
                  min={35}
                  max={55}
                  step={0.1}
                  disabled={!manualMode}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>35 kg/h</span>
                  <span>Optimal: 45-50 kg/h</span>
                  <span>55 kg/h</span>
                </div>
              </div>

              {/* Air Flow */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Air Flow</Label>
                  <span className="font-bold">{parameters.airFlow} m³/min</span>
                </div>
                <Slider
                  value={[parameters.airFlow]}
                  onValueChange={(value) => setParameters(prev => ({ ...prev, airFlow: value[0] }))}
                  min={100}
                  max={150}
                  step={1}
                  disabled={!manualMode}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>100 m³/min</span>
                  <span>Target: 120-130 m³/min</span>
                  <span>150 m³/min</span>
                </div>
              </div>

              {/* RPM */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Kiln RPM</Label>
                  <span className="font-bold">{parameters.rpm} rpm</span>
                </div>
                <Slider
                  value={[parameters.rpm]}
                  onValueChange={(value) => setParameters(prev => ({ ...prev, rpm: value[0] }))}
                  min={2.0}
                  max={3.0}
                  step={0.1}
                  disabled={!manualMode}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>2.0 rpm</span>
                  <span>Optimal: 2.4-2.6 rpm</span>
                  <span>3.0 rpm</span>
                </div>
              </div>

              {/* Temperature Setpoint */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Temperature Setpoint</Label>
                  <span className="font-bold">{parameters.temperature}°C</span>
                </div>
                <Slider
                  value={[parameters.temperature]}
                  onValueChange={(value) => setParameters(prev => ({ ...prev, temperature: value[0] }))}
                  min={1400}
                  max={1500}
                  step={1}
                  disabled={!manualMode}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1400°C</span>
                  <span>Target: 1440-1460°C</span>
                  <span>1500°C</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button className="flex-col h-16" disabled={manualMode}>
              <Bot className="h-5 w-5 mb-1" />
              <span className="text-xs">Auto Optimize</span>
            </Button>
            
            <Button variant="outline" className="flex-col h-16">
              <BarChart3 className="h-5 w-5 mb-1" />
              <span className="text-xs">View Trends</span>
            </Button>
            
            <Button variant="outline" className="flex-col h-16">
              <AlertTriangle className="h-5 w-5 mb-1" />
              <span className="text-xs">Set Alert</span>
            </Button>
            
            <Button variant="outline" className="flex-col h-16">
              <History className="h-5 w-5 mb-1" />
              <span className="text-xs">View History</span>
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <div className="flex gap-2">
              <Button disabled={!manualMode}>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
              <Button variant="outline">
                <History className="h-4 w-4 mr-2" />
                View History
              </Button>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}