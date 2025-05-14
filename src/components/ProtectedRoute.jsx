// src/components/ProtectedRoute.jsx (NUEVO ARCHIVO)
import React from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

// Componente Loading opcional mientras se verifica
const CheckingAuth = () => <div>Checking authentication...</div>;

function ProtectedRoute() {
  const { keycloak, initialized } = useKeycloak();
  const location = useLocation();

  // Esperar a que Keycloak termine de inicializarse
  if (!initialized) {
    return <CheckingAuth />;
  }

  // Si está inicializado y autenticado, renderizar el contenido de la ruta (Outlet)
  if (keycloak.authenticated) {
    return <Outlet />; // Renderiza el componente hijo de la ruta (ej: HotelManageLayout)
  }

  // Si no está autenticado, redirigir al login de Keycloak
  // Guardamos la ruta original para volver después del login
  // Nota: keycloak.login() redirige automáticamente a Keycloak
  console.log(
    'User not authenticated, redirecting to login. Redirect URI will be:',
    window.location.origin + location.pathname
  );

  // Iniciar el flujo de login
  // La librería se encarga de la redirección
  keycloak.login({ redirectUri: window.location.origin + location.pathname });

  // Renderizar null o un componente de carga mientras ocurre la redirección
  return <CheckingAuth />;

  // Alternativa si no quieres redirect automático, mostrar un mensaje o botón de login
  // return <Navigate to="/login-required" state={{ from: location }} replace />;
  // O: return <div>Please <button onClick={() => keycloak.login()}>Login</button> to access this page.</div>;
}

export default ProtectedRoute;
