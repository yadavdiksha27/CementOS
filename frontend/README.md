G2K
# CementOS - AI-Powered Cement Plant Optimization Platform

## 🚀 Live Demo with Real API Integration

CementOS is now **fully integrated** with the live Google Cloud Run API! Experience real-time AI-powered cement plant optimization through our interactive web application.

## 🔗 **Live API Endpoint**
```
https://cemenos-904719874116.us-central1.run.app
```

## ✨ **Features**

### 🤖 **AI Chat Assistant** 
- **Real-time chat** with CementOS AI using live API
- **Connection status indicators** showing online/offline modes
- **Processing time display** for API responses
- **Fallback offline mode** for uninterrupted experience
- **Professional error handling** with toast notifications

### 📊 **Interactive Dashboard**
- **Live API optimization** with real plant data
- **System status monitoring** from Google Cloud
- **Real-time KPI tracking** and performance metrics
- **Mobile-responsive design** for all screen sizes

### 🎨 **Modern UI/UX**
- **Professional animations** and micro-interactions
- **Comprehensive mobile responsiveness** 
- **CRUD operations** for all management sections
- **Toast notification system** for user feedback

## 🔧 **API Integration Details**

### **Available Endpoints:**
- **`POST /chat`** - Interactive chat with AI assistant
- **`POST /optimize`** - Direct plant optimization
- **`GET /status`** - System health and status
- **`GET /capabilities`** - API capabilities info
- **`GET /health`** - Health check endpoint

### **Frontend Architecture:**
- **Service Layer**: `src/services/api.ts` - Centralized API management  
- **Session Management**: Automatic session handling with localStorage
- **Error Handling**: Graceful degradation with offline fallbacks
- **Type Safety**: Full TypeScript support for API responses

## 🚀 **Getting Started**

### **Prerequisites:**
- Node.js (v18+ recommended)
- npm or yarn package manager

### **Installation:**
```bash
# Clone the repository
git clone https://github.com/nitishmeswal/cement-nexus-ai.git

# Navigate to project directory
cd cement-nexus-ai

# Install dependencies
npm install

# Start development server
npm run dev
```

### **Access the App:**
- **Local**: http://localhost:8080
- **Network**: http://192.168.1.2:8080

## 🔥 **Key Technology Stack**

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + shadcn/ui
- **API Integration**: Custom service layer with fetch API  
- **State Management**: React Hooks + Context
- **Animations**: CSS animations + Framer Motion concepts
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React icon library

## 🌟 **API Usage Examples**

### **Chat with AI:**
```javascript
import { cementOSAPI } from '@/services/api';

// Send message to AI
const response = await cementOSAPI.sendMessage("Optimize my plant for minimum emissions");
console.log(response.response); // AI's reply
console.log(response.processing_time_ms); // Processing time
```

### **Run Optimization:**
```javascript
// Plant optimization request
const result = await cementOSAPI.optimize({
  plant_capacity: 3000,
  objective: 'balanced',
  constraints: {
    lsf_min: 92,
    lsf_max: 98
  }
});
```

### **Check System Status:**
```javascript
// Get real-time system status
const status = await cementOSAPI.getSystemStatus();
console.log(status.system_health); // System health status
console.log(status.active_sessions); // Active user sessions
```

## 📱 **Mobile Responsiveness Strategy**

### **Breakpoint System:**
- **Mobile**: Default (0px+)
- **Small**: `sm:` (640px+) 
- **Medium**: `md:` (768px+)
- **Large**: `lg:` (1024px+)
- **XL**: `xl:` (1280px+)

### **Adaptive Components:**
- **Grid Systems**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- **Typography**: `text-sm sm:text-base lg:text-lg`
- **Spacing**: `space-y-2 sm:space-y-4 lg:space-y-6`
- **Button Text**: Context-aware show/hide patterns

## 🎯 **Performance Optimizations**

- **Lazy Loading**: Code splitting for optimal bundle sizes
- **API Caching**: Intelligent caching with session management  
- **Responsive Images**: Optimized assets for different screen sizes
- **Connection Management**: Automatic retry and offline detection

## 🔐 **Security & Reliability**

- **CORS Configured**: Proper cross-origin resource sharing
- **Session Management**: Secure session handling with localStorage
- **Error Boundaries**: Graceful error handling throughout app
- **Offline Fallbacks**: Continues to work without internet

## 🚀 **Deployment**

The application is ready for deployment to:
- **Vercel** (recommended for React apps)  
- **Netlify** (static site hosting)
- **AWS S3 + CloudFront** (enterprise scale)
- **Google Cloud Storage** (Google Cloud ecosystem)

## 📝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)  
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 🐛 **API Connection Issues?**

If you experience API connectivity issues:
1. **Check Network**: Ensure internet connectivity
2. **View Console**: Check browser developer tools for errors
3. **Retry Connection**: Click the retry button in chat header  
4. **Offline Mode**: App continues to work with simulated responses

## 📞 **Support**

For technical support or API access issues:
- **GitHub Issues**: Create an issue in this repository
- **API Documentation**: https://cemenos-904719874116.us-central1.run.app/docs

---

**Built with ❤️ by CementOS Team | Powered by Google Cloud Run API**