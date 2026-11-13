import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css'; // <-- DÒNG NÀY QUYẾT ĐỊNH VIỆC HIỂN THỊ MÀU SẮC
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);