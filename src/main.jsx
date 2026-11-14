import React from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './styles.css';
import App from './App.jsx';
import { EducationProvider } from './context/EducationContext.jsx';
createRoot(document.getElementById('root')).render(
  <EducationProvider>
    <App />
  </EducationProvider>
);
