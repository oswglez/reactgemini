// src/App.jsx (COMPLETO - con rutas protegidas)
import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts
import AppLayout from './components/AppLayout';
import HotelManageLayout from './components/HotelManageLayout';

// Vistas/Componentes
import Dashboard from './components/Dashboard';
import HotelList from './components/HotelList';
import HotelForm from './components/HotelForm';
import HotelNewForm from './components/HotelNewForm'; // <-- Import HotelNewForm
import HotelDetailsView from './components/HotelDetailsView';
import RoomForm from './components/RoomForm';
import ContactForm from './components/ContactForm';
import AddressForm from './components/AddressForm';
import AmenityForm from './components/AmenityForm';
import MediaForm from './components/MediaForm';
import FloorPlanForm from './components/FloorPlanForm';
import TypesManagementPage from './components/TypesManagementPage';

// Placeholders Tipos (aún no funcionales)
import AmenityTypeForm from './components/AmenityTypeForm';
import MediaTypeForm from './components/MediaTypeForm';
import RoomTypeForm from './components/RoomTypeForm';

// Componente de Ruta Protegida
import ProtectedRoute from './components/ProtectedRoute'; // <-- Importar

// Componentes 404
const NotFound = () => (
  <div style={{ marginTop: '2rem' }}>
    <h2>404 - Page Not Found</h2>
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
      {/* Layout Principal (asumimos que el layout en sí es siempre visible) */}
      <Route path="/" element={<AppLayout />}>
        {/* Rutas Públicas o Comunes */}
        <Route index element={<Dashboard />} />
        {/* Podrías dejar el Dashboard público o protegerlo también */}

        {/* --- RUTAS PROTEGIDAS --- */}
        {/* Usamos ProtectedRoute como elemento padre para un grupo de rutas */}
        <Route element={<ProtectedRoute />}>
          {/* Todas las rutas anidadas aquí requerirán autenticación */}
          <Route path="hotels" element={<HotelList />} />
          <Route path="hotel">
            {/* Use HotelNewForm here */}
            <Route path="new" element={<HotelNewForm />} />
            <Route path=":hotelId" element={<HotelManageLayout />}>
              {' '}
              {/* Gestionar hotel */}
              <Route index element={<HotelForm />} /> {/* Editar hotel */}
              <Route path="rooms" element={<RoomForm />} />
              <Route path="contacts" element={<ContactForm />} />
              <Route path="address" element={<AddressForm />} />
              <Route path="amenities" element={<AmenityForm />} />
              <Route path="media" element={<MediaForm />} />
              <Route path="floorplans" element={<FloorPlanForm />} />
              <Route path="*" element={<HotelSubSectionNotFound />} />
            </Route>
            {/* Wildcard para /hotel/* inválido */}
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="types" element={<TypesManagementPage />} />{' '}
          {/* Gestionar Tipos */}
          {/* Podrías añadir aquí rutas protegidas para Settings si las creas */}
          {/* <Route path="settings"> ... </Route> */}
        </Route>
        {/* --- FIN RUTAS PROTEGIDAS --- */}

        {/* Ruta 404 Principal */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
