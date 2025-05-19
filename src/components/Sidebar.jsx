// src/components/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom'; // Usar NavLink para estilo activo

// --- ASEGÚRATE DE TENER ESTAS DEFINICIONES DE ESTILO ---
const sidebarStyle = {
  width: '250px',
  background: '#3d1fcc', // Púrpura algo más oscuro
  padding: '1rem',
  height: '100vh',
  overflowY: 'auto',
};

const navListStyle = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
};

// Estilo base para enlaces
const linkStyle = {
  display: 'block',
  color: 'white', // <--- Color blanco para el texto
  textDecoration: 'none', // <--- Sin subrayado
  padding: '0.75rem 1rem',
  marginBottom: '0.5rem',
  borderRadius: '4px',
  transition: 'background-color 0.2s ease',
};

// Estilo para el enlace activo (usando isActive de NavLink)
const activeStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.2)', // Fondo blanco semitransparente
  fontWeight: 'bold',
};
// --- FIN DE DEFINICIONES DE ESTILO ---

function Sidebar() {
  // --- ASEGÚRATE DE QUE EL RETURN INCLUYA EL DIV EXTERIOR ---
  return (
    <div style={sidebarStyle}>
      {' '}
      {/* <-- Este DIV aplica el fondo y tamaño */}
      <h3
        style={{
          color: 'white',
          borderBottom: '1px solid #7a60f5',
          paddingBottom: '0.5rem',
          marginBottom: '1rem',
        }}
      >
        Hotel Management
      </h3>
      <nav>
        <ul style={navListStyle}>
          {/* Enlaces (cada NavLink usa los estilos) */}
          <li>
            <NavLink
              to="/"
              end
              style={({ isActive }) => ({
                ...linkStyle,
                ...(isActive ? activeStyle : {}),
              })}
            >
              Home / Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/hotels"
              style={({ isActive }) => ({
                ...linkStyle,
                ...(isActive ? activeStyle : {}),
              })}
            >
              List Hotels
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/hotel/new"
              style={({ isActive }) => ({
                ...linkStyle,
                ...(isActive ? activeStyle : {}),
              })}
            >
              Create New Hotel
            </NavLink>
          </li>
          <li
            style={{
              marginTop: '1.5rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid #555',
            }}
          >
            <NavLink
              to="/types"
              style={({ isActive }) => ({
                ...linkStyle,
                ...(isActive ? activeStyle : {}),
              })}
            >
              Manage Types
            </NavLink>
          </li>
          {/* ... otros enlaces/placeholders ... */}
        </ul>
      </nav>
    </div> // <-- Cierre del DIV exterior
  );
  // --- FIN DEL RETURN ---
}

export default Sidebar;
