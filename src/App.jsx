// src/App.jsx (Configuración Reconciliada y Corregida)
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedApp from "./components/ProtectedApp";
import { useAuth0 } from "@auth0/auth0-react";
import LogoutButton from "./components/LogoutButton";
import UserProfile from "./components/UserProfile";

// Layouts
import AppLayout from './components/AppLayout';
import HotelManageLayout from './components/HotelManageLayout';
import EnvironmentIndicator from './components/EnvironmentIndicator';

// Vistas/Componentes
import Dashboard from './components/Dashboard';
import HotelList from './components/HotelList';
import HotelNewForm from './components/HotelNewForm';
import HotelEditForm from './components/HotelEditForm';
import HotelDetailsView from './components/HotelDetailsView';
import RoomForm from './components/RoomForm';
import ContactForm from './components/ContactForm';
import AddressForm from './components/AddressForm';
import AmenityList from './components/AmenityList';
import AmenityEditForm from './components/AmenityEditForm';
import AmenityNewForm from './components/AmenityNewForm';
import MediaForm from './components/MediaForm';
import FloorPlanForm from './components/FloorPlanForm';
import TypesManagementPage from './components/TypesManagementPage';
import MediaTypeList from './components/types/MediaTypeList';
import MediaTypeForm from './components/types/MediaTypeForm';
import AmenityTypeList from './components/types/AmenityTypeList';
import AmenityTypeForm from './components/types/AmenityTypeForm';
import RoomTypeList from './components/types/RoomTypeList';
import RoomTypeForm from './components/types/RoomTypeForm';
import RoomEditForm from './components/RoomEditForm';
import RoomList from './components/RoomList';
import RoomNewForm from './components/RoomNewForm';

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
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  const callApiWithToken = async () => {
    const token = await getAccessTokenSilently();
    // Use the token in your API request
    await fetch("https://your-api.com/protected", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // handle response...
  };

  return (
    <ProtectedApp>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "1rem" }}>
        <UserProfile />
        <LogoutButton />
      </div>
      <Routes>
        {/* Layout Principal - AppLayout */}
        <Route path="/" element={<AppLayout />}>
          {/* Ruta Raíz: Dashboard */}
          <Route index element={<Dashboard />} />

          {/* Redirección de /types a /types-management */}
          <Route path="types" element={<Navigate to="/types-management" replace />} />

          {/* Gestión de Tipos - Movido arriba para priorizar el matching */}
          <Route path="types-management" element={<TypesManagementPage />} />
          
          {/* Types Management Routes */}
          <Route path="types/media" element={<MediaTypeList />} />
          <Route path="types/media/new" element={<MediaTypeForm />} />
          <Route path="types/media/edit/:id" element={<MediaTypeForm />} />
          
          <Route path="types/amenity" element={<AmenityTypeList />} />
          <Route path="types/amenity/new" element={<AmenityTypeForm />} />
          <Route path="types/amenity/edit/:id" element={<AmenityTypeForm />} />
          
          <Route path="types/room" element={<RoomTypeList />} />
          <Route path="types/room/new" element={<RoomTypeForm />} />
          <Route path="types/room/edit/:id" element={<RoomTypeForm />} />

          {/* Listado de Hoteles */}
          <Route path="hotel-list" element={<HotelList />} />

          {/* RUTAS DE AMENITIES */}
          <Route path="amenities-list" element={<AmenityList />} />
          <Route path="amenities/new" element={<AmenityNewForm />} />
          <Route path="amenities/edit/:amenityId" element={<AmenityEditForm />} />

          {/* Rutas de Creación y Edición de Hoteles */}
          <Route path="hotel">
            <Route path="new" element={<HotelNewForm />} />
            <Route path="edit/:hotelId" element={<HotelEditForm />} />
            <Route path=":hotelId" element={<HotelManageLayout />}>
              <Route index element={<HotelDetailsView />} />
              <Route path="rooms" element={<RoomForm />} />
              <Route path="contacts" element={<ContactForm />} />
              <Route path="address" element={<AddressForm />} />
              <Route path="media" element={<MediaForm />} />
              <Route path="floorplans" element={<FloorPlanForm />} />
              <Route path="*" element={<HotelSubSectionNotFound />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
          {/* Rutas de Creación y Edición de Rooms */}
          <Route path="/hotels/:hotelId/rooms" element={<RoomList />} />
          <Route path="/rooms/edit/:roomId" element={<RoomEditForm />} />
          <Route path="/hotels/:hotelId/rooms/new" element={<RoomNewForm />} />


          {/* Ruta 404 para cualquier otra URL no capturada */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <EnvironmentIndicator />
      {isAuthenticated && (
        <div>
          <button onClick={callApiWithToken}>Call Protected API</button>
        </div>
      )}
    </ProtectedApp>
  );
}

export default App;