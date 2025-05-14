// src/components/HotelManageLayout.jsx
import React, { useState, useEffect } from 'react';
// Quitamos useLocation, volvemos a necesitar useEffect/useState para el nombre
import { Outlet, useParams, NavLink, useLocation } from 'react-router-dom';
import {
  Tabs,
  TabList,
  Tab,
  Loading, // Necesitamos Loading de nuevo para el nombre
} from '@carbon/react';

// Estilos (sin cambios)
const navLinkStyle = {
  textDecoration: 'none',
  display: 'block',
  height: '100%',
};

function HotelManageLayout() {
  const { hotelId } = useParams();
  const location = useLocation();

  // --- VOLVEMOS A USAR ESTADO Y FETCH PARA EL NOMBRE ---
  const [hotelName, setHotelName] = useState('');
  const [loadingHotel, setLoadingHotel] = useState(true); // Inicia cargando
  const [errorHotel, setErrorHotel] = useState(null);
  // --------------------------------------------------

  // --- useEffect PARA CARGAR NOMBRE DEL HOTEL ---
  useEffect(() => {
    setLoadingHotel(true);
    setErrorHotel(null);
    const fetchHotelName = async () => {
      if (!hotelId) {
        // No debería pasar si la ruta es correcta, pero por si acaso
        setErrorHotel('Hotel ID is missing from URL.');
        setLoadingHotel(false);
        return;
      }
      try {
        // Llamada real a la API para obtener detalles (incluyendo el nombre)
        const response = await fetch(
          `http://localhost:8090/api/hotels/${hotelId}`
        );
        if (!response.ok) {
          if (response.status === 404)
            throw new Error(`Hotel with ID ${hotelId} not found.`);
          throw new Error(
            `Could not load hotel details (Status: ${response.status})`
          );
        }
        const data = await response.json();
        // Usar el campo correcto de tu respuesta API (asumiendo hotelName)
        setHotelName(data.hotelName || `ID ${hotelId}`); // Nombre real o fallback a ID
      } catch (err) {
        console.error('Error fetching hotel details for layout:', err);
        setErrorHotel(err.message);
        setHotelName(`ID ${hotelId}`); // Mostrar ID si falla carga de nombre
      } finally {
        setLoadingHotel(false); // Terminar carga
      }
    };
    fetchHotelName();
  }, [hotelId]); // Recargar si cambia el hotelId
  // -------------------------------------------

  // Definición de Tabs (sin cambios)
  const tabs = [
    { path: '', label: 'Details' },
    { path: 'rooms', label: 'Rooms' },
    { path: 'contacts', label: 'Contacts' },
    { path: 'address', label: 'Address' },
    { path: 'amenities', label: 'Amenities' },
    { path: 'media', label: 'Media' },
    { path: 'floorplans', label: 'Floor Plans' },
  ];

  // Lógica para selectedIndex (sin cambios)
  const basePath = `/hotel/${hotelId}`;
  const currentRelativePath = location.pathname.startsWith(basePath)
    ? location.pathname.substring(basePath.length).replace(/^\//, '')
    : '';
  let selectedIndex = tabs.findIndex((tab) => tab.path === currentRelativePath);
  if (selectedIndex === -1) {
    const currentBasePath = currentRelativePath.split('/')[0];
    selectedIndex = tabs.findIndex((tab) => tab.path === currentBasePath);
    if (selectedIndex === -1) {
      selectedIndex = 0;
    }
  }

  return (
    <div>
      {/* Título y Contexto */}
      <h2 style={{ marginBottom: '0.5rem' }}>
        {/* Mostrar Loading o Nombre */}
        Managing Hotel:{' '}
        {loadingHotel ? <Loading small withOverlay={false} /> : hotelName}
      </h2>
      {/* Mostrar error si falló la carga del nombre */}
      {errorHotel && (
        <p style={{ color: 'red', fontSize: '0.8em', marginBottom: '1rem' }}>
          Error loading hotel name: {errorHotel}
        </p>
      )}
      <p style={{ marginBottom: '1.5rem', fontSize: '0.9em', color: '#ddd' }}>
        ID: {hotelId}
      </p>

      {/* Sistema de Pestañas (sin cambios) */}
      <Tabs selectedIndex={selectedIndex} aria-label="Sub-navigation Tabs">
        {/* ... TabList y Tabs ... */}
        <TabList activation="manual">
          {tabs.map((tab, index) => {
            const toPath = `${basePath}${tab.path ? `/${tab.path}` : ''}`;
            return (
              <Tab key={tab.path} id={`tab-${index}`} label={tab.label}>
                <NavLink
                  to={toPath}
                  end={tab.path === ''}
                  className="cds--tabs__nav-link"
                  style={navLinkStyle}
                >
                  {tab.label}
                </NavLink>
              </Tab>
            );
          })}
        </TabList>
      </Tabs>

      {/* Área de Contenido - Outlet (sin cambios) */}
      <div style={{ marginTop: '2rem', padding: '1rem 0' }}>
        <Outlet />
      </div>
    </div>
  );
}

export default HotelManageLayout;
