import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element with id "root" not found. Please ensure the HTML contains <div id="root"></div>');
  }

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (error) {
  console.error('Failed to initialize React application:', error);
  document.body.innerHTML = '<div style="color: red; padding: 20px;">Failed to load application. Please check the console for details.</div>';
}
