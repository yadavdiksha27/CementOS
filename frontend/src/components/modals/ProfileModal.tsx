import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { 
  User, 
  Building, 
  MapPin, 
  Calendar, 
  Mail, 
  Phone, 
  Award, 
  Target, 
  TrendingUp, 
  Users, 
  FileText, 
  Settings,
  CheckCircle,
  Clock,
  BarChart3,
  Shield,
  Leaf,
  Zap,
  Plus,
  Trash2
} from 'lucide-react';

interface ProfileModalProps {
  children: React.ReactNode;
}

const plantData = {
    name: "Delhi Manufacturing Unit",
    capacity: "5,000 tonnes/day",
    established: "1987",
    location: "Sector 45, Gurgaon, Haryana",
    license: "ENV-2024-DL-445",
    coordinates: "28.4595° N, 77.0266° E"
  };

  const managementTeam = [
    {
      name: "Rajesh Kumar",
      role: "Plant Manager",
      email: "rajesh.k@plant.com",
      phone: "+91-9876543210",
      experience: "15 years",
      department: "Operations"
    },
    {
      name: "Priya Sharma", 
      role: "Operations Head",
      email: "priya.s@plant.com",
      phone: "+91-9876543211",
      experience: "12 years",
      department: "Production"
    },
    {
      name: "Amit Singh",
      role: "Maintenance Chief", 
      email: "amit.s@plant.com",
      phone: "+91-9876543212",
      experience: "18 years",
      department: "Maintenance"
    },
    {
      name: "Neha Gupta",
      role: "Quality Controller",
      email: "neha.g@plant.com", 
      phone: "+91-9876543213",
      experience: "10 years",
      department: "Quality"
    }
  ];

  const operationalMetrics = [
    {
      metric: "Production (MTD)",
      value: "127,450 tons",
      target: "130,000 tons",
      percentage: 98,
      status: "warning"
    },
    {
      metric: "Energy Efficiency",
      value: "87.5%",
      target: "85%",
      percentage: 103,
      status: "success"
    },
    {
      metric: "Quality Score",
      value: "94.2%",
      target: "92%",
      percentage: 102,
      status: "success"
    },
    {
      metric: "Safety Days",
      value: "156 days",
      target: "365 days",
      percentage: 43,
      status: "info"
    }
  ];

  const initiatives = [
    {
      name: "Alternative Fuel Project",
      current: "47%",
      target: "60%",
      deadline: "Q4 2024",
      status: "in-progress",
      description: "Increase alternative fuel usage to reduce carbon footprint"
    },
    {
      name: "Digital Twin Implementation",
      current: "Phase 2",
      target: "Phase 3",
      deadline: "Q1 2025", 
      status: "on-track",
      description: "Complete digital twin integration for predictive maintenance"
    },
    {
      name: "ISO 50001 Certification",
      current: "Under Audit",
      target: "Certified",
      deadline: "Q2 2024",
      status: "pending",
      description: "Energy management system certification"
    }
  ];

  const certifications = [
    {
      name: "ISO 9001:2015",
      type: "Quality Management",
      status: "active",
      expiry: "Dec 2025",
      issuer: "Bureau Veritas"
    },
    {
      name: "ISO 14001:2015", 
      type: "Environmental Management",
      status: "active",
      expiry: "Oct 2025",
      issuer: "TÜV SÜD"
    },
    {
      name: "OHSAS 45001:2018",
      type: "Safety Management", 
      status: "active",
      expiry: "Jan 2026",
      issuer: "SGS"
    },
    {
      name: "ISO 50001:2018",
      type: "Energy Management",
      status: "in-progress",
      expiry: "Pending",
      issuer: "DNV GL"
    }
  ];

export function ProfileModal({ children }: ProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [plantInfo, setPlantInfo] = useState(plantData);
  const [teamMembers, setTeamMembers] = useState(managementTeam);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    experience: '',
    department: ''
  });
  
  // Metrics state
  const [metrics, setMetrics] = useState(operationalMetrics);
  const [isEditingMetrics, setIsEditingMetrics] = useState(false);
  
  // Projects state  
  const [projects, setProjects] = useState(initiatives);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    current: '',
    target: '',
    deadline: '',
    status: 'pending',
    description: ''
  });
  
  // Compliance state
  const [compliance, setCompliance] = useState(certifications);
  const [isAddingCert, setIsAddingCert] = useState(false);
  const [newCert, setNewCert] = useState({
    name: '',
    type: '',
    status: 'in-progress',
    expiry: '',
    issuer: ''
  });

  const handleSaveProfile = () => {
    console.log('Saving profile:', plantInfo);
    setIsEditing(false);
    toast({
      title: "Profile Updated",
      description: "Plant information has been successfully updated.",
    });
  };

  const handleAddMember = () => {
    if (newMember.name && newMember.role && newMember.email) {
      setTeamMembers([...teamMembers, newMember]);
      setNewMember({
        name: '',
        role: '',
        email: '',
        phone: '',
        experience: '',
        department: ''
      });
      setIsAddingMember(false);
      toast({
        title: "Team Member Added",
        description: `${newMember.name} has been successfully added to the management team.`,
      });
    } else {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (Name, Role, Email).",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMember = (index: number) => {
    const memberName = teamMembers[index].name;
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
    toast({
      title: "Team Member Removed",
      description: `${memberName} has been removed from the management team.`,
    });
  };

  // Project handlers
  const handleAddProject = () => {
    if (newProject.name && newProject.target && newProject.deadline) {
      setProjects([...projects, newProject]);
      setNewProject({
        name: '',
        current: '',
        target: '',
        deadline: '',
        status: 'pending',
        description: ''
      });
      setIsAddingProject(false);
      toast({
        title: "Project Added",
        description: `${newProject.name} has been added to your initiatives.`,
      });
    } else {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (Name, Target, Deadline).",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = (index: number) => {
    const projectName = projects[index].name;
    setProjects(projects.filter((_, i) => i !== index));
    toast({
      title: "Project Removed",
      description: `${projectName} has been removed from your initiatives.`,
    });
  };

  // Compliance handlers
  const handleAddCertification = () => {
    if (newCert.name && newCert.type && newCert.issuer) {
      setCompliance([...compliance, newCert]);
      setNewCert({
        name: '',
        type: '',
        status: 'in-progress',
        expiry: '',
        issuer: ''
      });
      setIsAddingCert(false);
      toast({
        title: "Certification Added",
        description: `${newCert.name} certification has been added.`,
      });
    } else {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (Name, Type, Issuer).",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCertification = (index: number) => {
    const certName = compliance[index].name;
    setCompliance(compliance.filter((_, i) => i !== index));
    toast({
      title: "Certification Removed",
      description: `${certName} certification has been removed.`,
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building className="h-6 w-6 text-primary" />
            </div>
            Plant Enterprise Profile
            <Badge className="bg-success/10 text-success">Online</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="team" className="text-xs sm:text-sm">Management</TabsTrigger>
            <TabsTrigger value="metrics" className="text-xs sm:text-sm">Metrics</TabsTrigger>
            <TabsTrigger value="initiatives" className="text-xs sm:text-sm">Projects</TabsTrigger>
            <TabsTrigger value="compliance" className="text-xs sm:text-sm">Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Plant Information */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Plant Information
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Label className="text-muted-foreground">Plant Name:</Label>
                    {isEditing ? (
                      <Input 
                        className="col-span-2"
                        value={plantInfo.name}
                        onChange={(e) => setPlantInfo({...plantInfo, name: e.target.value})}
                      />
                    ) : (
                      <span className="col-span-2 font-medium">{plantInfo.name}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Label className="text-muted-foreground">Capacity:</Label>
                    {isEditing ? (
                      <Input 
                        className="col-span-2"
                        value={plantInfo.capacity}
                        onChange={(e) => setPlantInfo({...plantInfo, capacity: e.target.value})}
                      />
                    ) : (
                      <span className="col-span-2 font-medium">{plantInfo.capacity}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Label className="text-muted-foreground">Established:</Label>
                    {isEditing ? (
                      <Input 
                        className="col-span-2"
                        value={plantInfo.established}
                        onChange={(e) => setPlantInfo({...plantInfo, established: e.target.value})}
                      />
                    ) : (
                      <span className="col-span-2 font-medium">{plantInfo.established}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Label className="text-muted-foreground">Location:</Label>
                    {isEditing ? (
                      <Input 
                        className="col-span-2"
                        value={plantInfo.location}
                        onChange={(e) => setPlantInfo({...plantInfo, location: e.target.value})}
                      />
                    ) : (
                      <span className="col-span-2 font-medium flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {plantInfo.location}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Label className="text-muted-foreground">License:</Label>
                    {isEditing ? (
                      <Input 
                        className="col-span-2"
                        value={plantInfo.license}
                        onChange={(e) => setPlantInfo({...plantInfo, license: e.target.value})}
                      />
                    ) : (
                      <span className="col-span-2 font-medium">{plantInfo.license}</span>
                    )}
                  </div>
                </div>
                
                {/* Edit Controls */}
                <div className="flex gap-2 mt-4">
                  {isEditing ? (
                    <>
                      <Button size="sm" onClick={handleSaveProfile}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setIsEditing(false);
                        setPlantInfo(plantData); // Reset to original
                      }}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Info
                    </Button>
                  )}
                </div>
              </Card>

              {/* Quick Stats */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Today's Performance
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-success/10 rounded-lg">
                    <div className="text-2xl font-bold text-success">94.2%</div>
                    <div className="text-xs text-muted-foreground">Quality Score</div>
                  </div>
                  <div className="text-center p-3 bg-primary/10 rounded-lg">
                    <div className="text-2xl font-bold text-primary">87.5%</div>
                    <div className="text-xs text-muted-foreground">Efficiency</div>
                  </div>
                  <div className="text-center p-3 bg-warning/10 rounded-lg">
                    <div className="text-2xl font-bold text-warning">118</div>
                    <div className="text-xs text-muted-foreground">CO2 kg/t</div>
                  </div>
                  <div className="text-center p-3 bg-info/10 rounded-lg">
                    <div className="text-2xl font-bold text-info">156</div>
                    <div className="text-xs text-muted-foreground">Safety Days</div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Management Team</h3>
              <Button onClick={() => setIsAddingMember(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>

            {/* Add Member Form */}
            {isAddingMember && (
              <Card className="p-6 border-2 border-primary/20">
                <h4 className="font-semibold mb-4">Add New Team Member</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={newMember.name}
                      onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={newMember.role}
                      onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                      placeholder="Enter role"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email" 
                      type="email"
                      value={newMember.email}
                      onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newMember.phone}
                      onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience">Experience</Label>
                    <Input
                      id="experience"
                      value={newMember.experience}
                      onChange={(e) => setNewMember({...newMember, experience: e.target.value})}
                      placeholder="e.g., 10 years"
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={newMember.department}
                      onChange={(e) => setNewMember({...newMember, department: e.target.value})}
                      placeholder="Enter department"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAddMember}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingMember(false)}>
                    Cancel
                  </Button>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teamMembers.map((member, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{member.name}</h4>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteMember(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{member.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <span>{member.experience} experience</span>
                    </div>
                    <Badge variant="outline">{member.department}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Operational Metrics</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditingMetrics(!isEditingMetrics)}
              >
                <Settings className="h-4 w-4 mr-2" />
                {isEditingMetrics ? 'Save Targets' : 'Edit Targets'}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {metrics.map((metric, index) => (
                <Card key={index} className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium">{metric.metric}</h4>
                    <Badge variant={
                      metric.status === 'success' ? 'default' : 
                      metric.status === 'warning' ? 'secondary' : 'outline'
                    }>
                      {metric.percentage}%
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current: <strong>{metric.value}</strong></span>
                      <span>Target: 
                        {isEditingMetrics ? (
                          <Input
                            className="inline w-20 ml-2 text-xs h-6"
                            value={metric.target}
                            onChange={(e) => {
                              const newMetrics = [...metrics];
                              newMetrics[index].target = e.target.value;
                              setMetrics(newMetrics);
                            }}
                          />
                        ) : (
                          ` ${metric.target}`
                        )}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          metric.status === 'success' ? 'bg-success' : 
                          metric.status === 'warning' ? 'bg-warning' : 'bg-info'
                        }`}
                        style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="initiatives" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Strategic Initiatives</h3>
              <Button onClick={() => setIsAddingProject(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </div>

            {/* Add Project Form */}
            {isAddingProject && (
              <Card className="p-6 border-2 border-primary/20">
                <h4 className="font-semibold mb-4">Add New Project</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="project-name">Project Name</Label>
                    <Input
                      id="project-name"
                      value={newProject.name}
                      onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                      placeholder="Enter project name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="project-target">Target</Label>
                    <Input
                      id="project-target"
                      value={newProject.target}
                      onChange={(e) => setNewProject({...newProject, target: e.target.value})}
                      placeholder="Enter target"
                    />
                  </div>
                  <div>
                    <Label htmlFor="project-current">Current Status</Label>
                    <Input
                      id="project-current"
                      value={newProject.current}
                      onChange={(e) => setNewProject({...newProject, current: e.target.value})}
                      placeholder="Enter current status"
                    />
                  </div>
                  <div>
                    <Label htmlFor="project-deadline">Deadline</Label>
                    <Input
                      id="project-deadline"
                      value={newProject.deadline}
                      onChange={(e) => setNewProject({...newProject, deadline: e.target.value})}
                      placeholder="e.g., Q4 2024"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="project-description">Description</Label>
                    <Input
                      id="project-description"
                      value={newProject.description}
                      onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                      placeholder="Enter project description"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAddProject}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Add Project
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingProject(false)}>
                    Cancel
                  </Button>
                </div>
              </Card>
            )}

            <div className="space-y-4">
              {projects.map((initiative, index) => (
                <Card key={index} className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{initiative.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{initiative.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        initiative.status === 'on-track' ? 'default' :
                        initiative.status === 'in-progress' ? 'secondary' : 'outline'
                      }>
                        {initiative.status}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteProject(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Current:</Label>
                      <div className="font-medium">{initiative.current}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Target:</Label>
                      <div className="font-medium">{initiative.target}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Deadline:</Label>
                      <div className="font-medium flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {initiative.deadline}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Certifications & Compliance</h3>
              <Button onClick={() => setIsAddingCert(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Certification
              </Button>
            </div>

            {/* Add Certification Form */}
            {isAddingCert && (
              <Card className="p-6 border-2 border-primary/20">
                <h4 className="font-semibold mb-4">Add New Certification</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cert-name">Certification Name</Label>
                    <Input
                      id="cert-name"
                      value={newCert.name}
                      onChange={(e) => setNewCert({...newCert, name: e.target.value})}
                      placeholder="e.g., ISO 9001:2015"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cert-type">Type</Label>
                    <Input
                      id="cert-type"
                      value={newCert.type}
                      onChange={(e) => setNewCert({...newCert, type: e.target.value})}
                      placeholder="e.g., Quality Management"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cert-issuer">Issuer</Label>
                    <Input
                      id="cert-issuer"
                      value={newCert.issuer}
                      onChange={(e) => setNewCert({...newCert, issuer: e.target.value})}
                      placeholder="e.g., Bureau Veritas"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cert-expiry">Expiry Date</Label>
                    <Input
                      id="cert-expiry"
                      value={newCert.expiry}
                      onChange={(e) => setNewCert({...newCert, expiry: e.target.value})}
                      placeholder="e.g., Dec 2025"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAddCertification}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Add Certification
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingCert(false)}>
                    Cancel
                  </Button>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {compliance.map((cert, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        cert.status === 'active' ? 'bg-success/10' : 'bg-warning/10'
                      }`}>
                        {cert.status === 'active' ? 
                          <CheckCircle className="h-5 w-5 text-success" /> :
                          <Clock className="h-5 w-5 text-warning" />
                        }
                      </div>
                      <div>
                        <h4 className="font-semibold">{cert.name}</h4>
                        <p className="text-sm text-muted-foreground">{cert.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={cert.status === 'active' ? 'default' : 'secondary'}>
                        {cert.status}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteCertification(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Issuer:</span>
                      <span className="font-medium">{cert.issuer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expires:</span>
                      <span className="font-medium">{cert.expiry}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                toast({
                  title: "Performance Report",
                  description: "Generating comprehensive performance report...",
                });
              }}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Performance Report
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                toast({
                  title: "Benchmarking Analysis",
                  description: "Comparing your plant with industry standards...",
                });
              }}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Benchmarking
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                toast({
                  title: "Contact Initiated",
                  description: "Opening communication channel with management team...",
                });
              }}
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact Team
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
