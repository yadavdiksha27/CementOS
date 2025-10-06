// CementOS API Service Layer
const BASE_URL = 'https://cemenos-904719874116.us-central1.run.app';

export interface ChatMessage {
  message: string;
  session_id: string;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  session_id: string;
  timestamp: string;
  processing_time_ms: number;
}

export interface OptimizationRequest {
  plant_capacity: number;
  objective: 'efficiency' | 'emissions' | 'cost' | 'balanced';
  constraints?: {
    lsf_min?: number;
    lsf_max?: number;
    sm_min?: number;
    sm_max?: number;
    am_min?: number;
    am_max?: number;
  };
}

export interface SystemStatus {
  system_health: string;
  active_sessions: number;
  uptime: string;
  last_optimization: string;
  api_version: string;
}

export interface PlantCapabilities {
  optimization_types: string[];
  supported_parameters: string[];
  max_capacity_tpd: number;
  ai_models_active: string[];
}

class CementOSAPI {
  private sessionId: string;

  constructor() {
    // Generate or retrieve session ID
    this.sessionId = this.getSessionId();
  }

  private getSessionId(): string {
    let sessionId = localStorage.getItem('cemenos_session_id');
    if (!sessionId) {
      sessionId = 'cemenos_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('cemenos_session_id', sessionId);
    }
    return sessionId;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, finalOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Chat Interface
  async sendMessage(message: string, customSessionId?: string): Promise<ChatResponse> {
    return this.makeRequest<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        session_id: customSessionId || this.sessionId,
      }),
    });
  }

  // Direct Optimization
  async optimize(request: OptimizationRequest): Promise<any> {
    return this.makeRequest('/optimize', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Health Check
  async healthCheck(): Promise<{ status: string }> {
    return this.makeRequest('/health');
  }

  // System Status
  async getSystemStatus(): Promise<SystemStatus> {
    return this.makeRequest('/status');
  }

  // Get Capabilities
  async getCapabilities(): Promise<PlantCapabilities> {
    return this.makeRequest('/capabilities');
  }

  // Session Management
  async getSessions(): Promise<any> {
    return this.makeRequest('/sessions');
  }

  async deleteSession(sessionId?: string): Promise<any> {
    const id = sessionId || this.sessionId;
    return this.makeRequest(`/sessions/${id}`, {
      method: 'DELETE',
    });
  }

  // Root Information
  async getRootInfo(): Promise<any> {
    return this.makeRequest('/');
  }

  // Get current session ID
  getCurrentSessionId(): string {
    return this.sessionId;
  }

  // Reset session (generate new ID)
  resetSession(): void {
    this.sessionId = 'cemenos_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('cemenos_session_id', this.sessionId);
  }
}

// Export singleton instance
export const cementOSAPI = new CementOSAPI();
export default cementOSAPI;
