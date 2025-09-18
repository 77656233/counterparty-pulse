# CounterpartyPulse Frontend

A Vue 3 frontend application for browsing and managing Counterparty and Classic Chain assets with real-time Firestore integration.

## Tech Stack

- **Vue 3** with Composition API and `<script setup>` syntax
- **Vite** for fast development and building
- **Tailwind CSS** for utility-first styling
- **DaisyUI** for pre-built component themes
- **Firebase** for Firestore database connection
- **Decimal.js** for precise numerical calculations

## Features

- **Project-based Asset Management**: Browse assets organized by projects (Spells of Genesis, etc.)
- **Real-time Data**: Live connection to Firestore for asset information, issuances, and holders
- **Advanced Filtering**: Filter by divisible/locked status, search by name
- **Responsive Design**: Mobile-first design with collapsible sidebar
- **Pagination**: Efficient browsing of large asset collections
- **Loading States**: Progressive loading with visual feedback
- **Asset Details**: Detailed views with price calculations and holder distributions

## Project Structure

```
frontend/
├── src/
│   ├── App.vue              # Main application component
│   ├── main.js              # Vue app initialization
│   ├── style.css            # Global styles
│   ├── components/          # Reusable Vue components
│   ├── assets/              # Static assets
│   └── utils/               # Utility functions
├── public/                  # Public static files
├── firebaseConfig.js        # Firebase configuration
├── package.json             # Dependencies and scripts
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── postcss.config.js        # PostCSS configuration
```

## Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Firebase:**
   - Ensure `firebaseConfig.js` contains valid Firebase project configuration
   - Firestore rules should allow read access to `assets` and `config` collections

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Preview production build:**
   ```bash
   npm run preview
   ```

## Firebase Integration

The frontend connects to Firestore collections:

- **`assets`**: Asset documents with counterparty/classic data, holders, issuances
- **`config/fetchConfig`**: Project configuration and asset definitions
- **`meta/crypto_prices`**: Current cryptocurrency prices for calculations

## Key Components

- **FiltersSidebar**: Project selection and filtering controls
- **Pagination**: Navigate through large asset collections
- **Asset Cards**: Display asset information with real-time data
- **Loading States**: Progressive loading indicators

## Environment

The app automatically connects to the Firebase project configured in `firebaseConfig.js`. No additional environment variables needed for basic functionality.

## Deployment

The frontend can be deployed using:
- **Firebase Hosting** (recommended)
- **Vercel**
- **Netlify**
- Any static hosting service

For Firebase Hosting:
```bash
npm run build
firebase deploy --only hosting
```

## Browser Support

- Modern browsers with ES6+ support
- Mobile-responsive design
- Progressive Web App capabilities (if PWA features are enabled)

## Contributing

1. Follow Vue 3 Composition API patterns
2. Use Tailwind CSS for styling
3. Maintain responsive design principles
4. Test on both desktop and mobile viewports
