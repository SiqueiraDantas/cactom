import React from 'react';
import ReactDOM from 'react-dom/client';
import './fonts.css';
import App from './App';
import { UpdateScreen } from './components/UpdateScreen';
import { startTelemetry, setTelemetrySink } from './lib/devEvents';
import { queueEvent, startCloudSync } from './lib/cloud';
import { startPwa } from './lib/pwa';
// eventos vão para o navegador e, com o servidor configurado (.env.local), para o Supabase
setTelemetrySink(queueEvent);
startTelemetry();
startCloudSync();
// app instalável: service worker só no site publicado
startPwa({ PROD: import.meta.env?.PROD });
import './styles.css';
import './remaster.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <UpdateScreen />
  </React.StrictMode>,
);
