import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './contexts/LanguageContext';
import './index.css'; // Assuming there might be a global css file, adding it just in case if it was implicit or forgot in previous reads. If not, I will remove it. Wait, checking project layout again. index.html exists. Usually css is imported. I'll stick to minimal changes.

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>
);