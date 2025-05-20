// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// import AppLayout from './components/AppLayout'; // Comentamos AppLayout temporalmente
// import ProtectedRoute from './components/ProtectedRoute'; // Comentamos ProtectedRoute temporalmente
import Dashboard from './components/Dashboard';
import HotelList from './components/HotelList';
import HotelNewForm from './components/HotelNewForm';
import HotelEditForm from './components/HotelEditForm';
import NotFound from './components/NotFound'; 
import HotelManageLayout from './components/HotelManageLayout';
import HotelDetailsView from './components/HotelDetailsView';
import TypesManagementPage from './components/TypesManagementPage';

function App() {
  return (
    <Routes>
      {/* --- RUTA DE PRUEBA DIRECTA A HOTEL LIST --- */}
      <Route path="/" element={<HotelList />} />

      {/* Ruta para crear nuevo hotel (si la necesitas sin el layout) */}
      <Route path="/hotel/new" element={<HotelNewForm />} />

      {/* RUTA PARA EDITAR HOTEL (ASEGÚRATE QUE ESTÉ ACTIVA) */}
      <Route path="/hotel/edit/:hotelId" element={<HotelEditForm />} />

      {/* Puedes añadir otras rutas que quieras probar directamente aquí también */}
      {/* Ejemplo: <Route path="/dashboard" element={<Dashboard />} /> */}
      {/* Ejemplo: <Route path="/types-management" element={<TypesManagementPage />} /> */}

      {/* Ruta comodín para 404 */}
      <Route path="*" element={<NotFound />} />

      {/* --- RUTAS ORIGINALES (COMENTADAS O MANTENIDAS PARA DESPUÉS) --- */}
      {/* <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="hotel-list" element={<HotelList />} /> // Esta sería la ruta normal
        <Route path="hotel/new" element={<HotelNewForm />} />
        <Route path="hotel/edit/:hotelId" element={<HotelEditForm />} />
        <Route path="hotel/:hotelId" element={<HotelManageLayout />}>
          <Route index element={<HotelDetailsView />} />
        </Route>
        <Route path="types-management" element={<TypesManagementPage />} />
      </Route> 
      */}

      {/* Si quieres probar otras rutas directamente, puedes añadirlas aquí sin AppLayout */}
      {/* <Route path="/dashboard-direct" element={<Dashboard />} /> */}

    </Routes>
  );
}

export default App;