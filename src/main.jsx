import React from 'react';
import { createRoot } from 'react-dom/client';
import { ReactFlowProvider } from 'reactflow';
import App from './App.jsx';
import 'reactflow/dist/style.css';
import './styles.css';

createRoot(document.getElementById('root')).render(<React.StrictMode><ReactFlowProvider><App /></ReactFlowProvider></React.StrictMode>);
