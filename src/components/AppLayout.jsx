// src/components/AppLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar'; // El Sidebar que acabamos de definir arriba
import { Content } from '@carbon/react';
// Opcional: Si quieres un Header de Carbon encima del Sidebar y Content
// import { Header, HeaderContainer, HeaderName, SkipToContent } from '@carbon/react';

function AppLayout() {
  console.log('AppLayout (Carbon Standard Version) renderizando...');
  return (
    <>
      {/* // Opcional: Si decides añadir un Header de Carbon global
      <HeaderContainer
        render={({ isSideNavExpanded, onClickSideNavExpand }) => (
          <Header aria-label="Expectra Platform Name">
            <SkipToContent />
            <HeaderName href="/dashboard" prefix="Expectra">
              [AI Hotel Platform]
            </HeaderName>
            {/* Aquí podrías añadir más elementos al header si los necesitas *}
          </Header>
        )}
      />
      */}
      
      {/* Contenedor principal para Sidebar y Content */}
      <div style={{ 
        display: 'flex', 
        // Si tienes un Header de Carbon fijo, necesitas ajustar la altura:
        // height: 'calc(100vh - 48px)', // Asumiendo que el Header de Carbon mide 3rem (48px)
        // Si no hay Header de Carbon fijo encima, puedes usar 100vh:
        height: '100vh' 
      }}>
        <Sidebar /> {/* Renderiza el Sidebar de Carbon */}
        
        <Content // Componente Content de Carbon para el área principal
          id="main-content"
          style={{
            flexGrow: 1, // Para que ocupe el espacio restante
            // Carbon <Content> ya gestiona su propio padding, 
            // pero puedes añadir más si es necesario.
            // Ejemplo: padding: '1rem',
            overflowY: 'auto', // Para scroll si el contenido es largo
            // No es necesario backgroundColor aquí, Carbon Theme lo manejará.
          }}
        >
          <Outlet /> {/* Aquí se renderizará Dashboard, HotelList, etc. */}
        </Content>
      </div>
    </>
  );
}

export default AppLayout;