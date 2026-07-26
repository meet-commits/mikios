import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { registerSW } from 'virtual:pwa-register'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { initGA } from './utils/analytics.js'

// Initialize service worker
registerSW({ immediate: true })

// Initialize Google Analytics
if (import.meta.env.PROD) {
  initGA();
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <App />
    </ThemeProvider>
  </ErrorBoundary>,
)
