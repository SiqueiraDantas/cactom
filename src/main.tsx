import React from 'react';
import ReactDOM from 'react-dom/client';
import './fonts.css';
import App from './App';
import { startTelemetry, setTelemetrySink } from './lib/devEvents';
import { queueEvent, startCloudSync } from './lib/cloud';
// eventos vão para o navegador e, com o servidor configurado (.env.local), para o Supabase
setTelemetrySink(queueEvent);
startTelemetry();
startCloudSync();
import './styles.css';
import './remaster.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
