import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// VITE_BASE_PATH is '/SyncScribe/' on GitHub Pages, '/' locally
const basePath = import.meta.env.VITE_BASE_PATH || '/';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter basename={basePath === '/' ? undefined : basePath}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
