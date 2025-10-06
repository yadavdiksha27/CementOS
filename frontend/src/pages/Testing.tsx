import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge } from '@/components/StatusBadge';
import { KPITestConfiguration } from '@/components/testing/KPITestConfiguration';
import { LiveTestExecution } from '@/components/testing/LiveTestExecution';
import { SavedScenariosManager } from '@/components/testing/SavedScenariosManager';
import { 
  TestTube, 
  Play, 
  Pause, 
  Square, 
  Settings, 
  Copy, 
  Trash2,
  Plus,
  Eye,
  Download,
  BarChart3,
  Clock,
  Target,
  Zap,
  Flame
} from 'lucide-react';

const savedScenarios = [
  {
    id: 1,
    name: 'Energy Crisis Mode',
    created: '2 days ago',
    modified: '1 hour ago',
    successRate: '94%',
    runs: 23,
    status: 'completed'
  },
  {
    id: 2,
    name: 'Quality Optimization',
    created: 'Yesterday',
    modified: 'Yesterday',
    successRate: '87%',
    runs: 15,
    status: 'completed'
  }
];

export default function Testing() {
  const [newScenarioName, setNewScenarioName] = useState('');
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [activeTest, setActiveTest] = useState<any>(null);
  const [isCreatingTest, setIsCreatingTest] = useState(false);

  const handleStartTest = (testConfig: any) => {
    setActiveTest(testConfig);
    setIsCreatingTest(false);
  };

  const handleStopTest = () => {
    setActiveTest(null);
  };

  const objectives = [
    'Energy Efficiency',
    'Quality Control', 
    'Emissions Reduction',
    'Cost Minimization'
  ];

  const handleObjectiveChange = (objective: string) => {
    setSelectedObjectives(prev => 
      prev.includes(objective) 
        ? prev.filter(o => o !== objective)
        : [...prev, objective]
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Virtual Testing Lab</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Digital twin simulation and scenario testing</p>
        </div>
        
        <div className="flex items-center gap-2">
          <StatusBadge status={activeTest ? "active" : "offline"} className="text-xs sm:text-sm">
            {activeTest ? "Test Running" : "Lab Ready"}
          </StatusBadge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsCreatingTest(true)}
            className="text-xs sm:text-sm"
          >
            <TestTube className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">New Test</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Active Test or Create New Test */}
      {activeTest ? (
        <LiveTestExecution
          testConfig={activeTest}
          onPause={() => console.log('Pause test')}
          onStop={handleStopTest}
          onViewDetails={() => console.log('View details')}
        />
      ) : isCreatingTest ? (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Create New Optimization Test</h3>
            <Button variant="outline" onClick={() => setIsCreatingTest(false)}>
              Cancel
            </Button>
          </div>
          <KPITestConfiguration onStartTest={handleStartTest} />
        </Card>
      ) : (
        // Getting Started Guide
        <Card className="p-6 border-l-4 border-l-muted">
          <div className="text-center py-8">
            <div className="p-4 bg-muted/50 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <TestTube className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Ready to Start Testing</h3>
            <p className="text-muted-foreground mb-6">
              Create a new simulation test or load a saved scenario to begin virtual testing
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left mb-6">
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">1</span>
                  Configure Test
                </h4>
                <p className="text-xs text-muted-foreground">Set up parameters, objectives, and constraints for your simulation</p>
              </div>
              
              <div className="p-4 bg-warning/5 rounded-lg border border-warning/20">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-warning text-warning-foreground rounded-full flex items-center justify-center text-xs">2</span>
                  Run Simulation
                </h4>
                <p className="text-xs text-muted-foreground">Execute the digital twin test with real-time monitoring and control</p>
              </div>
              
              <div className="p-4 bg-success/5 rounded-lg border border-success/20">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-success text-success-foreground rounded-full flex items-center justify-center text-xs">3</span>
                  Analyze Results
                </h4>
                <p className="text-xs text-muted-foreground">Review performance metrics and save successful configurations</p>
              </div>
            </div>
            
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setIsCreatingTest(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Test
              </Button>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Browse Templates
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Quick Start */}
        {!isCreatingTest && !activeTest && (
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              Quick Start
            </h3>
            
            <div className="space-y-3">
              <Button 
                className="w-full justify-start" 
                onClick={() => setIsCreatingTest(true)}
              >
                <TestTube className="h-4 w-4 mr-2" />
                New KPI Test
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Copy className="h-4 w-4 mr-2" />
                Clone Existing
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Load Template
              </Button>
            </div>
          </Card>
        )}

        {/* Enhanced Saved Scenarios Manager */}
        <div className={`${!isCreatingTest && !activeTest ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <SavedScenariosManager 
            onLoadScenario={(scenario) => {
              console.log('Loading scenario:', scenario);
              setIsCreatingTest(true);
            }}
            onRunScenario={(scenario) => {
              console.log('Running scenario:', scenario);
              setActiveTest({
                name: scenario.name,
                objective: scenario.parameters.objective,
                duration: scenario.parameters.duration,
                speed: scenario.parameters.speed
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}