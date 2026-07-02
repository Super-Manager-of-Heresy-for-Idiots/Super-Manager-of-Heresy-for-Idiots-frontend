import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { installBugReportCollectors } from './lib/bugReport';

installBugReportCollectors();

// A tab opened before a redeploy will 404 when it lazy-loads a chunk whose hash
// changed. Recover by reloading once to pull the fresh index.html; the timestamp
// guard stops an infinite loop if the import keeps failing (offline, real 404).
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  const KEY = 'vite:preloadError:lastReload';
  const last = Number(sessionStorage.getItem(KEY) ?? 0);
  if (Date.now() - last > 10_000) {
    sessionStorage.setItem(KEY, String(Date.now()));
    window.location.reload();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
