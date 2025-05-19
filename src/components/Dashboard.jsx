// src/components/Dashboard.jsx
import React from 'react';

// --- IMPORTA TU LOGO COMO UNA RUTA (URL) ---
// Asegúrate de que la ruta sea correcta a tu archivo react.svg
import reactLogoPath from '../assets/react.svg'; // Vite/Webpack reemplazará esto con la ruta correcta al archivo en el build

// --- Estilos (como los definimos antes) ---
const dashboardContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  textAlign: 'center',
  minHeight: 'calc(100vh - 100px)', // Ajusta según sea necesario
};

const logoStyle = {
  width: '150px',
  height: '150px',
  marginBottom: '2rem',
  // animation: 'spin 20s linear infinite', // Opcional
};

// ... (resto de los estilos: dashboardHeaderStyle, dashboardContentStyle)

function Dashboard() {
  return (
    <div style={dashboardContainerStyle}>
      {/* --- Logo --- */}
      <img src={reactLogoPath} alt="React Logo" style={logoStyle} /> {/* <--- USA <img> CON LA RUTA */}

      <h2>Dashboard / Home</h2>
      <p style={{ marginTop: '1rem', color: '#393939', fontSize: '1.1rem' }}>
        Welcome to the Hotel Management Application.
      </p>
    </div>
  );
}

export default Dashboard;