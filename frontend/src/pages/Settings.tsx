import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings as SettingsIcon, 
  Bot, 
  Link, 
  Users, 
  Bell,
  Save,
  RefreshCw,
  TestTube,
  Download,
  Upload,
  Trash2,
  Edit,
  Plus
} from 'lucide-react';

const agentSettings = [
  {
    name: 'Orchestrator',
    settings: {
      timeout: 5,
      retries: 3,
      learning: true
    }
  },
  {
    name: 'TSR Agent',
    settings: {
      frequency: 15,
      fuelLimit: 60,
      costWeight: 50
    }
  },
  {
    name: 'Quality Agent', 
    settings: {
      interval: 30,
      threshold: 2.0,
      checkFreq: 10
    }
  }
];

const apiEndpoints = [
  { name: 'Orchestrator', url: 'http://localhost:8000', status: 'connected' },
  { name: 'TSR Agent', url: 'http://localhost:8001', status: 'connected' },
  { name: 'Clinker Agent', url: 'http://localhost:8002', status: 'connected' },
  { name: 'Quality Agent', url: 'http://localhost:8003', status: 'warning' }
];

const users = [
  { name: 'Admin (You)', role: 'Full Access', status: 'active' },
  { name: 'Plant Manager', role: 'Dashboard + Process View', status: 'active' },
  { name: 'Operator', role: 'Dashboard Only', status: 'active' },
  { name: 'Guest', role: 'Read Only Access', status: 'inactive' }
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('agents');
  const [agentConfig, setAgentConfig] = useState(agentSettings);
  const [apiConfig, setApiConfig] = useState(apiEndpoints);
  const [usersList, setUsersList] = useState(users);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);

  const handleSaveAgentConfig = () => {
    console.log('Saving agent configuration:', agentConfig);
    // Here you would typically send this to your backend
    alert('Configuration saved successfully!');
  };

  const handleDeleteUser = (index: number) => {
    if (index > 0) { // Can't delete admin
      setUsersList(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleEditUser = (index: number) => {
    setIsEditing(`user-${index}`);
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">System Configuration</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage agents, APIs, users, and notifications</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs sm:text-sm">
            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Export Config</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Button size="sm" className="text-xs sm:text-sm">
            <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Save All</span>
            <span className="sm:hidden">Save</span>
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
          <TabsTrigger value="agents" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
            <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:inline">AI Agents</span>
            <span className="xs:hidden sm:hidden">Agents</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
            <Link className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:inline">API & Integration</span>
            <span className="xs:hidden sm:hidden">API</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:inline">User Management</span>
            <span className="xs:hidden sm:hidden">Users</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
            <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:inline">Alerts & Notifications</span>
            <span className="xs:hidden sm:hidden">Alerts</span>
          </TabsTrigger>
        </TabsList>

        {/* AI Agent Configuration */}
        <TabsContent value="agents" className="space-y-4 sm:space-y-6">
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
              <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
              Agent Parameters
            </h3>
            
            <div className="space-y-6">
              {agentSettings.map((agent, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">{agent.name} Settings</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {agent.name === 'Orchestrator' && (
                      <>
                        <div>
                          <Label htmlFor={`timeout-${index}`}>Response Timeout (seconds)</Label>
                          <Input
                            id={`timeout-${index}`}
                            type="number"
                            value={agent.settings.timeout}
                            min="1"
                            max="30"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`retries-${index}`}>Max Retry Attempts</Label>
                          <Input
                            id={`retries-${index}`}
                            type="number"
                            value={agent.settings.retries}
                            min="1"
                            max="10"
                            className="mt-1"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id={`learning-${index}`} checked={agent.settings.learning} />
                          <Label htmlFor={`learning-${index}`}>Learning Mode</Label>
                        </div>
                      </>
                    )}
                    
                    {agent.name === 'TSR Agent' && (
                      <>
                        <div>
                          <Label htmlFor={`freq-${index}`}>Optimization Frequency (minutes)</Label>
                          <Input
                            id={`freq-${index}`}
                            type="number"
                            value={agent.settings.frequency}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`fuel-${index}`}>Alternative Fuel Limit (%)</Label>
                          <Input
                            id={`fuel-${index}`}
                            type="number"
                            value={agent.settings.fuelLimit}
                            max="80"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`cost-${index}`}>Cost Weight (%)</Label>
                          <Input
                            id={`cost-${index}`}
                            type="number"
                            value={agent.settings.costWeight}
                            max="100"
                            className="mt-1"
                          />
                        </div>
                      </>
                    )}
                    
                    {agent.name === 'Quality Agent' && (
                      <>
                        <div>
                          <Label htmlFor={`interval-${index}`}>Image Analysis Interval (seconds)</Label>
                          <Input
                            id={`interval-${index}`}
                            type="number"
                            value={agent.settings.interval}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`threshold-${index}`}>f-CaO Alert Threshold (%)</Label>
                          <Input
                            id={`threshold-${index}`}
                            type="number"
                            step="0.1"
                            value={agent.settings.threshold}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`check-${index}`}>Quality Check Frequency (minutes)</Label>
                          <Input
                            id={`check-${index}`}
                            type="number"
                            value={agent.settings.checkFreq}
                            className="mt-1"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button>
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </Button>
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* API & Integration */}
        <TabsContent value="api" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Link className="h-5 w-5" />
              API Endpoints Configuration
            </h3>
            
            <div className="space-y-4">
              {apiEndpoints.map((endpoint, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{endpoint.name}</h4>
                    <div className={`px-2 py-1 rounded-full text-xs ${
                      endpoint.status === 'connected' ? 'bg-success-light text-success' :
                      endpoint.status === 'warning' ? 'bg-warning-light text-warning' :
                      'bg-danger-light text-danger'
                    }`}>
                      {endpoint.status.toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input value={endpoint.url} className="flex-1" />
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <TestTube className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 border rounded-lg">
              <h4 className="font-medium mb-3">Authentication</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="api-key">API Key</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="api-key"
                      type="password"
                      value="••••••••••••••••"
                      className="flex-1"
                    />
                    <Button size="sm" variant="outline">Show</Button>
                    <Button size="sm" variant="outline">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="bearer-token">Bearer Token</Label>
                  <div className="flex gap-2 mt-1">
                    <Button variant="outline" className="flex-1">Configure OAuth</Button>
                    <Button size="sm" variant="outline">Test</Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* User Management */}
        <TabsContent value="users" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Roles & Permissions
              </h3>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
            
            <div className="space-y-4">
              {users.map((user, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{user.name}</h4>
                      <p className="text-sm text-muted-foreground">{user.role}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        user.status === 'active' ? 'bg-success-light text-success' : 'bg-muted text-muted-foreground'
                      }`}>
                        {user.status.toUpperCase()}
                      </div>
                      {index > 0 && (
                        <>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 border rounded-lg">
              <h4 className="font-medium mb-3">Permission Levels</h4>
              <div className="space-y-2">
                {[
                  'Dashboard Access',
                  'Agent Control',
                  'Testing Lab Access',
                  'Settings Configuration',
                  'Report Generation'
                ].map((permission, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input type="checkbox" id={`perm-${index}`} defaultChecked />
                    <Label htmlFor={`perm-${index}`} className="text-sm">{permission}</Label>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Alerts & Notifications */}
        <TabsContent value="alerts" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Configuration
            </h3>
            
            <div className="space-y-6">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3">Alert Channels</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <div>
                      <div className="font-medium">Email Alerts</div>
                      <div className="text-sm text-muted-foreground">admin@plant.com, manager@plant.com</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch defaultChecked />
                      <Button size="sm" variant="ghost">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <div>
                      <div className="font-medium">SMS Alerts</div>
                      <div className="text-sm text-muted-foreground">+91-XXXX-XXXX-XX</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch />
                      <Button size="sm" variant="ghost">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <div>
                      <div className="font-medium">Audio Alerts</div>
                      <div className="text-sm text-muted-foreground">System sounds enabled</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch defaultChecked />
                      <Button size="sm" variant="ghost">Test Sound</Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3">Alert Thresholds</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quality-threshold">Quality Drop Threshold</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input id="quality-threshold" value="< 90%" className="flex-1" />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="energy-threshold">Energy Spike Threshold</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input id="energy-threshold" value="> 110%" className="flex-1" />
                      <span className="text-sm text-muted-foreground">of normal</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="temp-threshold">Equipment Temperature</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input id="temp-threshold" value="> 1500" className="flex-1" />
                      <span className="text-sm text-muted-foreground">°C</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="agent-failure" defaultChecked />
                    <Label htmlFor="agent-failure">Agent Failure (Immediate)</Label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button>
                <TestTube className="h-4 w-4 mr-2" />
                Test Alerts
              </Button>
              <Button variant="outline">
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}