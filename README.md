# CounterpartyPulse

> **A modern, full-stack asset management platform for Bitcoin Counterparty assets with real-time data tracking, Vue.js frontend, and Firebase Cloud Functions backend.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-22-green.svg)](https://nodejs.org/)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.5-blue.svg)](https://vuejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-v12-orange.svg)](https://firebase.google.com/)

## 🚀 Features

- **📊 Multi-Source Data Aggregation**: Fetches asset data from Counterparty.io and TokenScan Classic APIs
- **⚡ Real-Time Updates**: Activity scanner monitors blockchain events for live asset updates
- **🎨 Modern Web Interface**: Vue 3 + Tailwind CSS + DaisyUI responsive frontend
- **☁️ Serverless Backend**: Firebase Cloud Functions with automatic scaling
- **🔄 External Scheduling**: HTTP endpoints designed for cron-based external scheduling
- **🔐 Secure API**: Protected endpoints with API key authentication
- **📱 Mobile-First Design**: Responsive UI optimized for all devices
- **🏗️ Modular Architecture**: Clean separation of concerns with extensible design

## 🏗️ Architecture

```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Vue.js Frontend   │    │ Firebase Cloud       │    │   External APIs     │
│   (Tailwind CSS)   │◄──►│ Functions (Node.js)  │◄──►│ • Counterparty.io   │
│   • Asset Browser  │    │ • HTTP Endpoints     │    │ • TokenScan Classic │
│   • Real-time Data │    │ • Lock Management    │    │ • Price Sources     │
│   • Mobile Ready   │    │ • Batch Processing   │    └─────────────────────┘
└─────────────────────┘    └──────────────────────┘              │
           │                           │                         │
           │                  ┌────────────────────┐              │
           └─────────────────►│   Firestore        │◄─────────────┘
                              │   Database         │
                              │ • Assets Collection│
                              │ • Config Storage   │
                              │ • Meta/Cursors     │
                              └────────────────────┘
```

## 📂 Project Structure

```
counterparty-pulse/
├── 🌐 frontend/                    # Vue.js Web Application
│   ├── src/
│   │   ├── App.vue                 # Main application component
│   │   ├── components/             # Reusable Vue components
│   │   └── utils/                  # Frontend utilities
│   ├── public/                     # Static assets
│   ├── package.json                # Frontend dependencies
│   ├── vite.config.js              # Vite build configuration
│   ├── tailwind.config.js          # Tailwind CSS configuration
│   └── firebaseConfig.js           # Firebase client configuration
│
├── ⚡ functions/                   # Firebase Cloud Functions
│   ├── endpoints/                  # HTTP endpoint handlers
│   │   ├── runBatchedFetchersHttp.js      # Batch asset processing
│   │   ├── runCounterpartyActivityScannerHttp.js  # Event monitoring
│   │   ├── cleanupOrphanAssetsHttp.js     # Database cleanup
│   │   └── [8 more endpoints]
│   ├── services/                   # External API handlers
│   │   ├── counterpartyHandler.js  # Counterparty.io API client
│   │   └── tokenScanClassicHandler.js # TokenScan Classic API client
│   ├── fetchers/                   # Data fetching logic
│   │   ├── getXCPAssetInformation.js
│   │   ├── getXCPAssetHolders.js
│   │   └── getXCPAssetIssuances.js
│   ├── lib/                        # Shared utilities
│   │   ├── auth.js                 # API key authentication
│   │   ├── locks.js                # Firestore-based locking
│   │   ├── config.js               # Configuration management
│   │   └── logging.js              # Structured logging
│   ├── core/                       # Business logic
│   │   └── orchestrator.js         # Main processing orchestrator
│   ├── package.json                # Backend dependencies
│   ├── fetchConfig.json            # Asset and service configuration
│   └── fetchConfig.example.json    # Example configuration
│
├── 🔧 Configuration Files
│   ├── firebase.json               # Firebase project configuration
│   ├── firestore.rules             # Firestore security rules
│   ├── .firebaserc                 # Firebase project ID
│   └── .gitignore                  # Git ignore patterns
│
└── 📚 Documentation
    ├── README.md                   # This file
    ├── LICENSE                     # MIT License
    └── functions/README.md         # Detailed API documentation
```

## 🛠️ Technology Stack

### Frontend
- **Vue.js 3.5** with Composition API and `<script setup>`
- **Vite** for fast development and optimized builds  
- **Tailwind CSS 3.3** for utility-first styling
- **DaisyUI 5.1** for beautiful UI components
- **Firebase SDK 12.1** for real-time Firestore connection
- **Decimal.js** for precise numerical calculations

### Backend  
- **Firebase Cloud Functions v2** (2nd Generation)
- **Node.js 22** runtime environment
- **Firestore** NoSQL database for asset storage
- **Axios** for external API communication
- **ESLint** for code quality and consistency

### External APIs
- **Counterparty.io API v2** for official Counterparty data
- **TokenScan Classic API** for classic chain asset information

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** (recommended: 22)
- **Firebase CLI**: `npm install -g firebase-tools`
- **Firebase Project** with Firestore enabled

### 1. Clone Repository
```bash
git clone https://github.com/77656233/counterparty-pulse.git
cd counterparty-pulse
```

### 2. Firebase Setup
```bash
# Login to Firebase
firebase login

# Create or select Firebase project
firebase use --add

# Enable required APIs (Firestore, Functions, Hosting)
```

### 3. Backend Setup
```bash
cd functions

# Install dependencies
npm install

# Copy and configure settings
cp fetchConfig.example.json fetchConfig.json
# Edit fetchConfig.json:
# - Replace "YOUR_API_KEY_HERE" with a secure API key  
# - Add your assets and projects

# Deploy functions
npm run deploy
```

### 4. Frontend Setup  
```bash
cd ../frontend

# Install dependencies
npm install

# Configure Firebase connection
# Edit firebaseConfig.js with your Firebase project config

# Start development server
npm run dev
```

### 5. Initialize Data
```bash
# Upload configuration to Firestore
curl "https://your-function-url/seedConfigFromLocalHttp?key=YOUR_API_KEY"

# Start fetching asset data (classic service)
curl "https://your-function-url/runBatchedFetchersHttp?service=classic&batch=20&key=YOUR_API_KEY"

# Start fetching counterparty data  
curl "https://your-function-url/runBatchedFetchersHttp?service=counterparty&batch=20&key=YOUR_API_KEY"

# Enable activity scanning
curl "https://your-function-url/runCounterpartyActivityScannerHttp?key=YOUR_API_KEY"
```

## 🔄 External Scheduling

CounterpartyPulse is designed for **external scheduling** (no Firebase Schedulers needed):

### Recommended Schedule
```bash
# Batch processing every 3 minutes per service
*/3 * * * * curl "https://your-functions/runBatchedFetchersHttp?service=classic&key=KEY"
*/3 * * * * curl "https://your-functions/runBatchedFetchersHttp?service=counterparty&key=KEY"

# Activity monitoring every 5 minutes  
*/5 * * * * curl "https://your-functions/runCounterpartyActivityScannerHttp?key=KEY"

# Cleanup every 2 hours
0 */2 * * * curl "https://your-functions/cleanupOrphanAssetsHttp?key=KEY"
```

### Scheduling Options
- **GitHub Actions** with cron workflows
- **Google Cloud Scheduler** 
- **VPS Crontab** (simple and reliable)
- **Vercel Cron** or similar services

## 🔐 Security & Configuration

### API Keys
- All endpoints protected with API key authentication
- Keys stored in Firestore `config/fetchConfig.auth.apiKeys`
- Use strong, unique keys for production

### Firebase Service Account
```bash
# Download from Firebase Console → Project Settings → Service Accounts
# Save as: functions/counterpartypulse-firebase-adminsdk-[...].json
# Already ignored by .gitignore for security
```

### Configuration Management
- **Production**: Configuration stored in Firestore (`config/fetchConfig`)
- **Development**: Local `functions/fetchConfig.json` 
- **Backup**: Upload local config with `seedConfigFromLocalHttp` endpoint

## 📊 Data Model

### Asset Document Structure
```javascript
{
  "name": "SJCXCARD",
  "project": "Spells of Genesis", 
  "data": {
    "counterparty": {
      "asset_id": "123456789",
      "divisible": true,
      "locked": false,
      "supply": "1000000000",
      // ... complete Counterparty.io response
    },
    "classic": {
      "asset_id": "123456789", 
      "issuer": "1ABC...",
      // ... complete TokenScan Classic response
    }
  },
  "holders": {
    "counterparty": [/* holder addresses and amounts */],
    "classic": [/* holder data */]
  },
  "issuances": {
    "counterparty": [/* issuance history */],
    "classic": [/* issuance data */]  
  },
  "updatedAt": "2025-09-18T12:00:00Z"
}
```

## 🔧 Development

### Frontend Development
```bash
cd frontend
npm run dev        # Start dev server (http://localhost:5173)
npm run build      # Build for production  
npm run preview    # Preview production build
```

### Backend Development
```bash
cd functions
npm run serve      # Start Firebase emulator
npm run shell      # Firebase functions shell
npm run lint       # Code linting
npm run logs       # View function logs
```

### Environment Variables
```bash
# functions/.env (for local development)
ADMIN_API_KEY=your-local-api-key

# Production keys stored in Firestore config
```

## 🚀 Deployment

### Functions Deployment
```bash
cd functions
npm run deploy     # Deploy all functions
# Or deploy individual functions:
firebase deploy --only functions:runBatchedFetchersHttp
```

### Frontend Deployment  
```bash
cd frontend
npm run build
firebase deploy --only hosting
```

### Full Deployment
```bash
firebase deploy    # Deploy functions + hosting + rules
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`  
5. **Open** a Pull Request

### Development Guidelines
- Follow **Vue 3 Composition API** patterns for frontend
- Use **ESLint** configuration for code style
- Maintain **responsive design** principles
- Write **clear commit messages**
- Update **documentation** for new features

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🏆 Credits

Built with ❤️ for the **Bitcoin Counterparty community**.

### Key Technologies
- [Firebase](https://firebase.google.com/) - Backend infrastructure
- [Vue.js](https://vuejs.org/) - Frontend framework  
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [Counterparty.io](https://counterparty.io/) - Official Counterparty API
- [TokenScan Classic](https://classic.tokenscan.io/) - Classic chain data

---

## 🔗 Live URLs

- **Frontend**: `https://your-project.web.app`
- **API Documentation**: [functions/README.md](functions/README.md)
- **Function URLs**: See deployed Cloud Functions in Firebase Console

**Status**: ✅ **Production Ready** - Fully functional asset tracking platform with real-time capabilities.
