// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { Auth0Provider } from "@auth0/auth0-react";
import '@carbon/styles/css/styles.css';
import './index.css';

const domain = "dev-4zd67fg0x8s5yz8z.us.auth0.com";
const clientId = "AbTcT9URkjbRkSafY7O2MgJboIEkKqyU";

ReactDOM.createRoot(document.getElementById('root')).render(
  <Auth0Provider
    domain={domain}
    clientId={clientId}
    authorizationParams={{
      redirect_uri: window.location.origin,
    }}
  >
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Auth0Provider>
);