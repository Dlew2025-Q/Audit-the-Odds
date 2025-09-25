import React from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';
// FIX: Changed import to lowercase 'app' to match the actual filename.
import App from './app';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

