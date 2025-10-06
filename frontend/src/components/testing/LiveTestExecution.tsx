import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Square, 
  BarChart3, 
  Download, 
  TestTube,
  Clock,
  Target,
  CheckCircle,
  AlertTriangle,
  Activity,
  TrendingUp
} from 'lucide-react';

interface LiveTestExecutionProps {
  testConfig: any;
  onPause: () => void;
  onStop: () => void;
  onViewDetails: () => void;
}

export function LiveTestExecution({ testConfig, onPause, onStop, onViewDetails }: LiveTestExecutionProps) {
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);

  const phases = [
    { name: 'Initial parameter adjustment', status: 'completed', progress: 100 },
    { name: 'Thermal optimization phase', status: 'completed', progress: 100 },
    { name: 'Quality stabilization', status: 'in-progress', progress: 67 },
    { name: 'Final validation', status: 'pending', progress: 0 }
  ];

  const [liveKPIs, setLiveKPIs] = useState({
    quality: 94.8,
    c3s: 57.2,
    fCao: 1.3,
    energy: 3.22,
    emissions: 119,
    cost: 82.1
  });

  // Simulate real-time updates
  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 0.1, 100));
        setElapsedTime(prev => prev + 1);
        
        // Simulate KPI changes
        setLiveKPIs(prev => ({
          quality: Math.max(90, Math.min(98, prev.quality + (Math.random() - 0.5) * 0.5)),
          c3s: Math.max(50, Math.min(65, prev.c3s + (Math.random() - 0.5) * 0.3)),
          fCao: Math.max(0.8, Math.min(2.5, prev.fCao + (Math.random() - 0.5) * 0.1)),
          energy: Math.max(3.0, Math.min(3.5, prev.energy + (Math.random() - 0.5) * 0.02)),
          emissions: Math.max(110, Math.min(130, prev.emissions + (Math.random() - 0.5) * 1)),
          cost: Math.max(75, Math.min(90, prev.cost + (Math.random() - 0.5) * 0.5))
        }));
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isPaused]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getKPIStatus = (current: number, target: any, type: string) => {
    if (type === 'quality') return current >= 95 ? 'success' : current >= 90 ? 'warning' : 'error';
    if (type === 'c3s') return current >= 55 && current <= 60 ? 'success' : 'warning';
    if (type === 'fCao') return current <= 1.5 ? 'success' : 'warning';
    return 'info';
  };

  return (
    <Card className="p-6 border-l-4 border-l-primary">
      {/* Test Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TestTube className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">{testConfig.name}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Running: {formatTime(elapsedTime)}
              </span>
              <span>Speed: {testConfig.speed}x</span>
              <span>ETA: {formatTime((testConfig.duration * 3600 - elapsedTime) / testConfig.speed)}</span>
            </div>
          </div>
        </div>
        <Badge variant="default" className="animate-pulse">
          <Activity className="h-3 w-3 mr-1" />
          RUNNING
        </Badge>
      </div>

      {/* Progress Overview */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm font-bold">{progress.toFixed(1)}%</span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      {/* Real-time KPI Tracking */}
      <div className="mb-6">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Real-time KPI Tracking
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Quality Score */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Quality Score</span>
              <Badge variant={getKPIStatus(liveKPIs.quality, 95, 'quality') === 'success' ? 'default' : 'secondary'}>
                {getKPIStatus(liveKPIs.quality, 95, 'quality') === 'success' ? '✅' : '⚠️'}
              </Badge>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-bold">{liveKPIs.quality.toFixed(1)}%</span>
              <span className="text-xs text-muted-foreground">Target: {'>'}95%</span>
            </div>
            <Progress 
              value={(liveKPIs.quality / 100) * 100} 
              className="h-1 mt-2"
            />
          </div>

          {/* C3S Content */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">C3S Content</span>
              <Badge variant={getKPIStatus(liveKPIs.c3s, 57.5, 'c3s') === 'success' ? 'default' : 'secondary'}>
                {getKPIStatus(liveKPIs.c3s, 57.5, 'c3s') === 'success' ? '✅' : '⚠️'}
              </Badge>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-bold">{liveKPIs.c3s.toFixed(1)}%</span>
              <span className="text-xs text-muted-foreground">Target: 55-60%</span>
            </div>
            <Progress 
              value={((liveKPIs.c3s - 50) / 15) * 100} 
              className="h-1 mt-2"
            />
          </div>

          {/* f-CaO Content */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">f-CaO Content</span>
              <Badge variant={getKPIStatus(liveKPIs.fCao, 1.5, 'fCao') === 'success' ? 'default' : 'secondary'}>
                {getKPIStatus(liveKPIs.fCao, 1.5, 'fCao') === 'success' ? '✅' : '⚠️'}
              </Badge>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-bold">{liveKPIs.fCao.toFixed(1)}%</span>
              <span className="text-xs text-muted-foreground">Target: {'<'}1.5%</span>
            </div>
            <Progress 
              value={Math.max(0, 100 - (liveKPIs.fCao / 2.5) * 100)} 
              className="h-1 mt-2"
            />
          </div>
        </div>
      </div>

      {/* Test Milestones */}
      <div className="mb-6">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Target className="h-4 w-4" />
          Test Milestones
        </h4>
        
        <div className="space-y-3">
          {phases.map((phase, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="flex-shrink-0">
                {phase.status === 'completed' && <CheckCircle className="h-5 w-5 text-success" />}
                {phase.status === 'in-progress' && <Activity className="h-5 w-5 text-primary animate-spin" />}
                {phase.status === 'pending' && <Clock className="h-5 w-5 text-muted-foreground" />}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{phase.name}</span>
                  <Badge variant="outline" className="capitalize">
                    {phase.status === 'in-progress' ? `${phase.progress}% Complete` : phase.status}
                  </Badge>
                </div>
                
                {phase.status === 'in-progress' && (
                  <Progress value={phase.progress} className="h-1" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <div className="mb-6">
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-warning font-medium">Minor temperature fluctuation at 14:23</span>
          </div>
          <p className="text-sm text-warning/80 ml-6">Automatic correction applied. Monitoring continues.</p>
        </div>
      </div>

      {/* Control Actions */}
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => {
            setIsPaused(!isPaused);
            onPause();
          }}
        >
          {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
          {isPaused ? 'Resume' : 'Pause'}
        </Button>
        
        <Button variant="outline" onClick={onStop}>
          <Square className="h-4 w-4 mr-2" />
          Stop Test
        </Button>
        
        <Button variant="outline" onClick={onViewDetails}>
          <BarChart3 className="h-4 w-4 mr-2" />
          Detailed View
        </Button>
        
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>
    </Card>
  );
}