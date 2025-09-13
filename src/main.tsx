import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initCrossDomainAuth } from './lib/crossDomainAuth';

// Initialize cross-domain authentication before app starts
initCrossDomainAuth();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
