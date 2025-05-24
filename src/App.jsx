// src/App.jsx (Configuración Reconciliada y Corregida)
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; // Importar Navigate

// Layouts
import AppLayout from './components/AppLayout';
import HotelManageLayout from './components/HotelManageLayout';

// Vistas/Componentes
import Dashboard from './components/Dashboard';
import HotelList from './components/HotelList';
import HotelNewForm from './components/HotelNewForm';
import HotelEditForm from './components/HotelEditForm'; // Importar HotelEditForm
import HotelDetailsView from './components/HotelDetailsView'; // Importar HotelDetailsView
import RoomForm from './components/RoomForm';
import ContactForm from './components/ContactForm';
import AddressForm from './components/AddressForm';
import AmenityList from './components/AmenityList';
import AmenityForm from './components/AmenityForm';
import MediaForm from './components/MediaForm';
import FloorPlanForm from './components/FloorPlanForm';
import TypesManagementPage from './components/TypesManagementPage';

// Componente de Ruta Protegida
import ProtectedRoute from './components/ProtectedRoute';

// Componentes 404
const NotFound = () => (
  <div style={{ marginTop: '2rem' }}>
    <h2>404 - Page Not Found</h2>
    <p>Sorry, the page you are looking for does not exist.</p>
  </div>
);
const HotelSubSectionNotFound = () => (
  <div style={{ marginTop: '2rem' }}>
    <h3>Hotel section not found</h3>
    <p>Please select a valid option from the tabs.</p>
  </div>
);

function App() {
  return (
    <Routes>
      {/* Layout Principal - AppLayout */}
      {/* Si Dashboard debe ser público, AppLayout no debe estar dentro de ProtectedRoute en esta capa. */}
      <Route path="/" element={<AppLayout />}>
        {/* Ruta Raíz Pública: Dashboard */}
        <Route index element={<Dashboard />} />

        {/* --- RUTAS PROTEGIDAS --- */}
        {/* Un <Route element={<ProtectedRoute />} /> anida todas las rutas que requieren autenticación */}
        <Route element={<ProtectedRoute />}>
          {/* Listado de Hoteles */}
          <Route path="hotel-list" element={<HotelList />} /> {/* Ruta renombrada para mayor claridad */}
          {/* RUTAS DE AMENITIES */}
          <Route path="/amenities-list" element={<AmenityList />} /> {/* <-- RUTA PARA LA LISTA DE AMENITIES */}
          <Route path="/amenities/new" element={<AmenityForm />} /> {/* <-- RUTA PARA CREAR NUEVA AMENITY (reusa AmenityForm) */}
          {/* Si necesitas una ruta de edición, la definirías aquí. Por ahora, AmenityForm se reusa */}
          {/* <Route path="/amenities/edit/:amenityId" element={<AmenityForm isEditMode={true} />} /> */}


          {/* Rutas de Creación y Edición de Hoteles */}
          <Route path="hotel">
            <Route path="new" element={<HotelNewForm />} />
            
            {/* IMPORTANTE: La ruta específica de edición debe ir ANTES de la ruta general de gestión de hotel.
              Esto asegura que `/hotel/edit/:hotelId` sea capturada por `HotelEditForm`
              y no por `HotelManageLayout` (que es más general).
            */}
            <Route path="edit/:hotelId" element={<HotelEditForm />} /> {/* <--- RUTA ESPECÍFICA PARA LA EDICIÓN */}

            {/* Rutas de Gestión de un Hotel Específico (anidadas bajo /hotel/:hotelId) */}
            <Route path=":hotelId" element={<HotelManageLayout />}>
              {/* Ruta índice para /hotel/:hotelId debe mostrar los detalles */}
              <Route index element={<HotelDetailsView />} /> {/* <--- CORREGIDO: Muestra los detalles del hotel */}
              
              {/* Sub-rutas específicas para la gestión de un hotel */}
              <Route path="rooms" element={<RoomForm />} />
              <Route path="contacts" element={<ContactForm />} />
              <Route path="address" element={<AddressForm />} />
              <Route path="media" element="<MediaForm />" /> {/* Revisa el tipo de componente */}
              <Route path="floorplans" element={<FloorPlanForm />} />
              
              {/* Wildcard para sub-secciones no encontradas del hotel */}
              <Route path="*" element={<HotelSubSectionNotFound />} />
            </Route>

            {/* Wildcard para rutas /hotel/* no válidas (ej. /hotel/xyz que no es :hotelId ni "new") */}
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Gestión de Tipos (Amenity, Media, Room Types) */}
          <Route path="types-management" element={<TypesManagementPage />} /> {/* Ruta renombrada para mayor claridad */}

          {/* Puedes añadir aquí otras rutas protegidas de nivel superior si las tienes */}
          {/* <Route path="admin-settings" element={<AdminSettingsPage />} /> */}
        </Route>
        {/* --- FIN RUTAS PROTEGIDAS --- */}

        {/* Ruta 404 para cualquier otra URL no capturada por las rutas anteriores */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;