// src/services/keycloak.js
import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: 'http://localhost:8080/',
  realm: 'developer',
  clientId: 'expectra',
};

// Create and export the Keycloak instance
const keycloak = new Keycloak(keycloakConfig);

export default keycloak;
