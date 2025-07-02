// src/components/Sidebar.jsx
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { CaretDown, CaretUp } from '@carbon/icons-react';

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

const sectionTitleStyle = {
  color: '#a799ff',
  fontSize: '0.875rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  padding: '0.75rem 1rem',
  marginTop: '1.5rem',
  marginBottom: '0.5rem',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
};

const subMenuStyle = {
  paddingLeft: '1rem',
  overflow: 'hidden',
  transition: 'max-height 0.3s ease-in-out',
};

const subLinkStyle = {
  ...linkStyle,
  fontSize: '0.9em',
  padding: '0.5rem 1rem 0.5rem 2rem',
  marginBottom: '0.25rem',
};

const menuTitleStyle = {
  ...linkStyle,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  cursor: 'pointer',
};
// --- FIN DE DEFINICIONES DE ESTILO ---

function Sidebar() {
  const location = useLocation();
  const [isTypesOpen, setIsTypesOpen] = useState(location.pathname.includes('/types'));

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
          {/* Main Navigation */}
          <li>
            <NavLink
              to="/"
              end
              style={({ isActive }) => ({
                ...linkStyle,
                ...(isActive ? activeStyle : {}),
              })}
            >
              Dashboard
            </NavLink>
          </li>

          {/* Hotels Section */}
          <li style={sectionTitleStyle}>Hotels</li>
          <li>
            <NavLink
              to="/hotel-list"
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

          {/* Amenities Section */}
          <li style={sectionTitleStyle}>Amenities</li>
          <li>
            <NavLink
              to="/amenities-list"
              style={({ isActive }) => ({
                ...linkStyle,
                ...(isActive ? activeStyle : {}),
              })}
            >
              Manage Amenities
            </NavLink>
          </li>

          {/* Types Management Section */}
          <li style={sectionTitleStyle}>System Types</li>
          <li>
            <div
              style={menuTitleStyle}
              onClick={() => setIsTypesOpen(!isTypesOpen)}
            >
              <span>Types Management</span>
              {isTypesOpen ? (
                <CaretUp size={16} style={{ marginLeft: '0.5rem' }} />
              ) : (
                <CaretDown size={16} style={{ marginLeft: '0.5rem' }} />
              )}
            </div>
            <div
              style={{
                ...subMenuStyle,
                maxHeight: isTypesOpen ? '500px' : '0',
              }}
            >
              <NavLink
                to="/types-management"
                end
                style={({ isActive }) => ({
                  ...subLinkStyle,
                  ...(isActive ? activeStyle : {}),
                })}
              >
                Overview
              </NavLink>
              <NavLink
                to="/types/media"
                style={({ isActive }) => ({
                  ...subLinkStyle,
                  ...(isActive ? activeStyle : {}),
                })}
              >
                Media Types
              </NavLink>
              <NavLink
                to="/types/amenity"
                style={({ isActive }) => ({
                  ...subLinkStyle,
                  ...(isActive ? activeStyle : {}),
                })}
              >
                Amenity Types
              </NavLink>
              <NavLink
                to="/types/room"
                style={({ isActive }) => ({
                  ...subLinkStyle,
                  ...(isActive ? activeStyle : {}),
                })}
              >
                Room Types
              </NavLink>
            </div>
          </li>

          {/* Users Section */}
          <li style={sectionTitleStyle}>Users</li>
          <li>
            <NavLink
              to="/users"
              style={({ isActive }) => ({
                ...linkStyle,
                ...(isActive ? activeStyle : {}),
              })}
            >
              Manage Users
            </NavLink>
          </li>
        </ul>
      </nav>
    </div> // <-- Cierre del DIV exterior
  );
}

export default Sidebar;