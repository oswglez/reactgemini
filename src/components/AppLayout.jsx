// src/components/AppLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Theme } from '@carbon/react'; // Importar Theme
import Sidebar from './Sidebar'; // Importar el menú lateral

// Mantén tus definiciones de estilo
const layoutContainerStyle = {
  display: 'flex', // Para poner Sidebar y contenido lado a lado
  minHeight: '100%',
};

// Quita el fondo púrpura de aquí, será heredado del Theme g100
const contentStyle = {
  flexGrow: 1, // El contenido principal ocupa el espacio restante
  padding: '2rem', // Espaciado interno para el contenido
  // backgroundColor: '#5331FA', // <-- ELIMINADO DE AQUÍ
  fontFamily: 'Roboto, sans-serif', // Fuente principal
  overflowX: 'auto',
  // color: 'white' // Dejar que el Theme maneje el color
};
const outerDivStyle = {
  backgroundColor: '#3195fa',
  height: '100%', // Ensure this outer div takes full height
};
function AppLayout() {
  return (
    // 1. Div exterior: Aplica el fondo púrpura y ocupa toda la altura
    <div style={outerDivStyle}>
      {' '}
      {/* 2. Aplicar el tema g100 DENTRO del fondo púrpura */}
      <Theme theme="g10">
        {/* 3. Div interior con flex layout (ya no necesita fondo) */}
        <div style={layoutContainerStyle}>
          <Sidebar />
          {/* 4. Main ahora usará el fondo del tema g100 */}
          <main style={contentStyle}>
            <Outlet /> {/* El contenido de la ruta se renderiza aquí */}
          </main>
        </div>
      </Theme>
    </div>
  );
}

export default AppLayout;
