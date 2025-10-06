import { useState } from 'react';
import { KPICard } from '@/components/KPICard';
import { StatusBadge } from '@/components/StatusBadge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LiveViewModal } from '@/components/modals/LiveViewModal';
import { EnergyEfficiencyPanel } from '@/components/modals/EnergyEfficiencyPanel';
import { CO2EmissionsModal } from '@/components/modals/CO2EmissionsModal';
import { ProcessNodeModal } from '@/components/modals/ProcessNodeModal';
import { ProcessAgentModal } from '@/components/modals/ProcessAgentModal';
import { AltFuelModal } from '@/components/modals/AltFuelModal';
import { NotificationCenter } from '@/components/modals/NotificationCenter';
import { QuickActionsPanel } from '@/components/dashboard/QuickActionsPanel';
import { APIDemo } from '@/components/dashboard/APIDemo';
import { 
  Zap, 
  Leaf, 
  Target, 
  Flame,
  Activity,
  AlertTriangle,
  CheckCircle,
  Info,
  Settings,
  BarChart3,
  TestTube,
  MessageSquare,
  Bell
} from 'lucide-react';

const kpiData = [
  {
    title: 'Energy Efficiency',
    value: 87.5,
    unit: '%',
    change: 2.3,
    target: 85,
    icon: <Zap className="h-5 w-5" />,
    status: 'success' as const
  },
  {
    title: 'CO2 Emissions',
    value: 118,
    unit: ' kg/t',
    change: -5,
    target: '<125',
    icon: <Leaf className="h-5 w-5" />,
    status: 'success' as const
  },
  {
    title: 'Quality Score',
    value: 94.2,
    unit: '%',
    change: 1.1,
    target: '>90',
    icon: <Target className="h-5 w-5" />,
    status: 'success' as const
  },
  {
    title: 'Alt Fuel Usage',
    value: 47,
    unit: '%',
    change: 3,
    target: '>45',
    icon: <Flame className="h-5 w-5" />,
    status: 'success' as const
  }
];

const processStages = [
  {
    id: 'raw-materials',
    name: 'Raw Materials',
    status: 'active',
    agent: 'Material Agent',
    metrics: {
      'CaCO3 Content': { value: '94.8%', status: 'success' },
      'Moisture': { value: '2.3%', status: 'success' },
      'Feed Rate': { value: '145 t/h', status: 'success' }
    },
    controls: ['Adjust Rate', 'Quality History']
  },
  {
    id: 'grinding',
    name: 'Raw Mill',
    status: 'warning',
    agent: 'Grinding Agent',
    metrics: {
      'Power': { value: '2.8 MW', status: 'warning' },
      'Temperature': { value: '95°C', status: 'success' },
      'Speed': { value: '16.2 rpm', status: 'success' },
      'Fineness': { value: '3,200 cm²/g', status: 'success' }
    },
    controls: ['Reduce Power', 'Target Fineness']
  },
  {
    id: 'preheating',
    name: 'Preheater Tower',
    status: 'active',
    agent: 'Preheater Agent',
    metrics: {
      'Temperature': { value: '1,050°C', status: 'success' },
      'Draft': { value: '-12 mbar', status: 'success' },
      'Heat Recovery': { value: '89%', status: 'success' },
      'Efficiency': { value: '91.2%', status: 'success' }
    },
    controls: ['Adjust Fuel', 'Check Draft']
  },
  {
    id: 'clinkerization',
    name: 'Rotary Kiln',
    status: 'active',
    agent: 'Clinker Agent',
    metrics: {
      'Flame Temp': { value: '1,450°C', status: 'success' },
      'Clinker Temp': { value: '1,350°C', status: 'success' },
      'RPM': { value: '2.5', status: 'success' },
      'Alt Fuel': { value: '47%', status: 'success' },
      'O2 Level': { value: '3.2%', status: 'success' },
      'Quality Pred': { value: '94.2%', status: 'success' }
    },
    controls: ['Temp Control', 'Fuel Mix', 'Quality Check']
  },
  {
    id: 'cooling',
    name: 'Cooler',
    status: 'active',
    agent: 'Cooling Agent',
    metrics: {
      'Inlet Temp': { value: '1,350°C', status: 'success' },
      'Outlet Temp': { value: '65°C', status: 'success' },
      'Air Flow': { value: '385 m³/min', status: 'success' },
      'Recovery': { value: '92%', status: 'success' }
    },
    controls: ['Air Flow', 'Heat Recovery']
  },
  {
    id: 'storage',
    name: 'Cement Storage',
    status: 'active',
    agent: 'Storage Agent',
    metrics: {
      'Silo Level': { value: '78%', status: 'success' },
      'Quality': { value: '94.5%', status: 'success' },
      'Dispatch Rate': { value: '45 t/h', status: 'success' }
    },
    controls: ['Monitor Level', 'Quality Test']
  }
];

const agents = [
  { name: 'Orchestrator', status: 'active', uptime: '99.8%', tasks: 1247 },
  { name: 'TSR Agent', status: 'warning', uptime: '98.2%', tasks: 856 },
  { name: 'Quality Agent', status: 'active', uptime: '99.5%', tasks: 432 },
  { name: 'Clinker Agent', status: 'active', uptime: '99.9%', tasks: 1023 }
];

const alerts = [
  { type: 'warning', message: 'Clinker Temperature High', time: '2m ago' },
  { type: 'info', message: 'Fuel Switch Ready', time: '5m ago' },
  { type: 'success', message: 'Maintenance Completed', time: '1h ago' },
  { type: 'info', message: 'Quality Check Passed', time: '2h ago' }
];

export default function Dashboard() {
  const [liveViewOpen, setLiveViewOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);

  const handleNodeClick = (nodeData: any) => {
    setSelectedAgent(nodeData);
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Plant Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Real-time monitoring and AI optimization</p>
        </div>
        
        <div className="flex items-center gap-2">
          <StatusBadge status="active" className="text-xs sm:text-sm">System Online</StatusBadge>
        </div>
      </div>

      {/* Enhanced KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {kpiData.map((kpi, index) => {
          // Energy Efficiency Card with Panel
          if (kpi.title === 'Energy Efficiency') {
            return (
              <EnergyEfficiencyPanel key={index}>
                <div className="cursor-pointer">
                  <KPICard
                    title={kpi.title}
                    value={kpi.value}
                    unit={kpi.unit}
                    change={kpi.change}
                    target={kpi.target}
                    icon={kpi.icon}
                    status={kpi.status}
                    onViewDetails={() => {}}
                  />
                </div>
              </EnergyEfficiencyPanel>
            );
          }
          
          // CO2 Emissions Card with Modal
          if (kpi.title === 'CO2 Emissions') {
            return (
              <CO2EmissionsModal key={index}>
                <div className="cursor-pointer">
                  <KPICard
                    title={kpi.title}
                    value={kpi.value}
                    unit={kpi.unit}
                    change={kpi.change}
                    target={kpi.target}
                    icon={kpi.icon}
                    status={kpi.status}
                    onViewDetails={() => {}}
                  />
                </div>
              </CO2EmissionsModal>
            );
          }
          
          // Quality Score Card (temporarily without modal)
          if (kpi.title === 'Quality Score') {
            return (
              <KPICard
                key={index}
                title={kpi.title}
                value={kpi.value}
                unit={kpi.unit}
                change={kpi.change}
                target={kpi.target}
                icon={kpi.icon}
                status={kpi.status}
                onViewDetails={() => console.log('Quality Score modal temporarily disabled')}
              />
            );
          }
          
          // Alt Fuel Usage Card with Modal
          if (kpi.title === 'Alt Fuel Usage') {
            return (
              <AltFuelModal key={index}>
                <div className="cursor-pointer">
                  <KPICard
                    title={kpi.title}
                    value={kpi.value}
                    unit={kpi.unit}
                    change={kpi.change}
                    target={kpi.target}
                    icon={kpi.icon}
                    status={kpi.status}
                    onViewDetails={() => {}}
                  />
                </div>
              </AltFuelModal>
            );
          }
          
          // Default KPI Card
          return (
            <KPICard
              key={index}
              title={kpi.title}
              value={kpi.value}
              unit={kpi.unit}
              change={kpi.change}
              target={kpi.target}
              icon={kpi.icon}
              status={kpi.status}
              onViewDetails={() => console.log(`View details for ${kpi.title}`)}
            />
          );
        })}
      </div>

      {/* Quick Status Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">System Status</h3>
                <p className="text-xs text-muted-foreground">All systems operational</p>
              </div>
            </div>
            <StatusBadge status="active" className="text-xs">Online</StatusBadge>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Active Alerts</h3>
                <p className="text-xs text-muted-foreground">2 warnings, 1 notice</p>
              </div>
            </div>
            <NotificationCenter>
              <Button variant="ghost" size="sm" className="text-xs">
                View (3)
              </Button>
            </NotificationCenter>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Live Monitoring</h3>
                <p className="text-xs text-muted-foreground">Real-time data stream</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setLiveViewOpen(true)}>
              View Live
            </Button>
          </div>
        </Card>
      </div>

      {/* Process Flow */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Production Process Flow
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {processStages.map((stage, index) => (
            <div 
              key={stage.id}
              className="group cursor-pointer"
              onClick={() => handleNodeClick(stage)}
            >
              <Card className="p-4 h-full hover:shadow-md transition-all duration-200 group-hover:scale-105">
                <div className="flex flex-col items-center text-center space-y-3">
                  {/* Status Indicator */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    stage.status === 'active' ? 'bg-success/20 border-2 border-success' :
                    stage.status === 'warning' ? 'bg-warning/20 border-2 border-warning' :
                    'bg-muted border-2 border-border'
                  }`}>
                    {stage.status === 'active' ? (
                      <CheckCircle className="h-6 w-6 text-success" />
                    ) : stage.status === 'warning' ? (
                      <AlertTriangle className="h-6 w-6 text-warning" />
                    ) : (
                      <Activity className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  
                  {/* Stage Name */}
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{stage.name}</h3>
                    <p className="text-xs text-muted-foreground">{stage.agent}</p>
                  </div>
                  
                  {/* Key Metrics */}
                  <div className="w-full space-y-1">
                    {Object.entries(stage.metrics).slice(0, 2).map(([key, metric]) => (
                      <div key={key} className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground truncate">{key}</span>
                        <div className="flex items-center gap-1">
                          <span className={`font-medium ${
                            metric.status === 'success' ? 'text-success' :
                            metric.status === 'warning' ? 'text-warning' :
                            'text-destructive'
                          }`}>
                            {metric.value}
                          </span>
                          <div className={`w-2 h-2 rounded-full ${
                            metric.status === 'success' ? 'bg-success' :
                            metric.status === 'warning' ? 'bg-warning' :
                            'bg-destructive'
                          }`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </Card>

      {/* API Integration Demo */}
      <APIDemo />
      
      {/* Modals */}
      <LiveViewModal isOpen={liveViewOpen} onClose={() => setLiveViewOpen(false)} />
      
      {selectedAgent && (
        <ProcessAgentModal
          isOpen={!!selectedAgent}
          onClose={() => setSelectedAgent(null)}
          stageData={selectedAgent}
        />
      )}
    </div>
  );
}