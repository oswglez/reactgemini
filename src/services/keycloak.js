// src/services/keycloak.js
import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: 'http://localhost:8180/',
  realm: 'ExpDev001',
  clientId: 'dev001',
};

// Create and export the Keycloak instance
const keycloak = new Keycloak(keycloakConfig);

export default keycloak;
