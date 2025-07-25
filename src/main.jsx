// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { Auth0Provider } from "@auth0/auth0-react";
import './index.css';
import './components/GlobalFixes.css';
import './components/SortInstructionsRemover.js';
// import '@carbon/styles/css/styles.css';


ReactDOM.createRoot(document.getElementById('root')).render(
  <Auth0Provider
    domain={'dev-4zd67fg0x8s5yz8z.us.auth0.com'}
    clientId={'7ZUvJSj4fxAqfNJstP8fyqLgvEYN1MZo'}
    authorizationParams={{
      redirect_uri: window.location.origin,
      audience: "AbTcT9URkjbRkSafY7O2MgJboIEkKqyU",
      scope: "openid profile email"
    }}
  >
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Auth0Provider>
);