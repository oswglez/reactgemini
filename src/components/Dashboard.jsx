// src/components/Dashboard.jsx
import React from 'react';

// --- IMPORT YOUR LOGO AS A PATH (URL) ---
import reactLogoPath from '../assets/react.svg';

// --- Styles for internal elements (not layout of the whole component) ---
// Estos estilos son para el logo y no para el contenedor general del Dashboard.
const logoStyle = {
  width: '150px',
  height: '150px',
  marginBottom: '2rem',
};

// **ESTOS ESTILOS DEBEN APLICARSE A UN DIV INTERNO PARA CENTRAR EL CONTENIDO DEL DASHBOARD**
// El contenedor más externo del Dashboard debe ser simplemente un contenedor que AppLayout pueda manejar.
const dashboardContentCenteringStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center', // Centers content horizontally within its container
  justifyContent: 'center', // Centers content vertically within its container
  padding: '2rem', // Padding *inside* the dashboard content area, giving space around elements
  textAlign: 'center', // Aligns text within its own elements (e.g., h2, p)
  
  // Ocupa la altura disponible dentro del área de Content de AppLayout
  // Ajusta este calc() si tienes un Header de Carbon o un footer que consuma más espacio
  // 100vh es el alto total, restamos 150px (ej. altura del Header si lo tuvieras) y 2rem (padding de Content)
  minHeight: 'calc(100vh - 150px - 2rem)', 
  width: '100%', // Asegura que este div interno ocupe todo el ancho disponible del Content de AppLayout
  boxSizing: 'border-box', // Importante para que el padding no añada ancho/alto extra
};


function Dashboard() {
  return (
    // **ESTE ES EL DIV MÁS EXTERNO DEL COMPONENTE DASHBOARD.**
    // NO DEBE TENER ESTILOS QUE DICTEN EL LAYOUT GLOBAL (display: flex, height, etc.).
    // Su propósito es ser un "placeholder" dentro del <Content> de AppLayout.
    // Carbon's <Content> already provides some padding.
    <div> 
      
      {/* **ESTE ES EL DIV INTERNO AL QUE LE DEBES APLICAR LOS ESTILOS DE CENTRADO.** */}
      {/* Este div se encargará de centrar el logo, título y texto DENTRO del área disponible para el Dashboard. */}
      <div style={dashboardContentCenteringStyle}>
          {/* --- Logo --- */}
          <img src={reactLogoPath} alt="React Logo" style={logoStyle} />

          <h2>Dashboard / Home</h2>
          <p style={{ marginTop: '1rem', color: '#393939', fontSize: '1.1rem' }}>
            Welcome to the Hotel Management Application.
          </p>
      </div>
    </div>
  );
}

export default Dashboard;