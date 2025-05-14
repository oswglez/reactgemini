// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ReactKeycloakProvider } from '@react-keycloak/web'; // <-- Importar Provider
import keycloak from './services/keycloak'; // Updated import path to match your structure
import App from './App';

// Estilos (sin cambios)
import '@carbon/styles/css/styles.css';
import './App.css';
import './index.css';

// Componente de Carga mientras Keycloak inicializa
const KeycloakLoading = () => <div>Loading Keycloak...</div>; // Puedes usar <Loading /> de Carbon aquí

// Handler para eventos de tokens (opcional pero útil para depurar)
const handleTokens = (tokens) => {
  console.log('Keycloak tokens updated:', tokens);
  // Aquí podrías guardar tokens en localStorage/sessionStorage si no confías
  // solo en la librería, pero keycloak-js suele manejarlos en memoria.
};

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <ReactKeycloakProvider
    authClient={keycloak}
    initOptions={{
      // onLoad: 'login-required', // Fuerza login inmediato
      onLoad: 'check-sso', // Intenta login silencioso si ya hay sesión KC, sino carga app anónima
      pkceMethod: 'S256', // Recomendado para clientes públicos
      silentCheckSsoRedirectUri:
        window.location.origin + '/silent-check-sso.html', // Necesitas crear este HTML simple
      checkLoginIframe: false,
    }}
    LoadingComponent={<KeycloakLoading />} // Componente a mostrar mientras carga
    onTokens={handleTokens} // Opcional: Manejar evento de actualización de tokens
  >
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ReactKeycloakProvider>
  //</React.StrictMode>
);
