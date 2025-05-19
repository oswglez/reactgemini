// src/keycloak.js
import Keycloak from 'keycloak-js';

// Configuración con variables (mejor si usas variables de entorno .env)
const keycloakConfig = {
  url: 'http://localhost:8180/', // URL de tu servidor Keycloak (OJO: Keycloak suele correr en 8080 o 8443)
  realm: 'ExpDev001', // Reemplaza con el nombre EXACTO de tu Realm
  clientId: 'dev001', // Reemplaza con el Client ID EXACTO que creaste para React
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;
