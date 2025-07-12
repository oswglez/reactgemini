// src/components/AppLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar'; // El Sidebar de Carbon definido arriba
import { Content } from '@carbon/react';
// Opcional: Si quieres un Header de Carbon global
// import { Header, HeaderContainer, HeaderName } from '@carbon/react';

function AppLayout() {
  // console.log('AppLayout (Carbon Standard Version) renderizando...'); // Puedes añadir este log
  return (
    <>
      {/*
      // EJEMPLO DE HEADER DE CARBON (OPCIONAL)
      <HeaderContainer
        render={({ isSideNavExpanded, onClickSideNavExpand }) => (
          <Header aria-label="Expectra Platform Name">
            <HeaderName href="/dashboard" prefix="Expectra">
              [AI Hotel Platform]
            </HeaderName>
          </Header>
        )}
      />
      */}
      
      <div style={{ 
        display: 'flex', 
        height: '100vh' // O 'calc(100vh - alturaDelHeader)' si usas un Header fijo
      }}>
        <Sidebar />
      </div>
    </>
  );
}

export default AppLayout;