// src/components/HotelList.jsx
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableContainer,
} from '@carbon/react';

const containerStyle = {
  marginTop: '1rem',
  padding: '20px',
  border: '2px solid green', // Borde para identificar fácilmente el componente de prueba
  backgroundColor: '#f0f0f0',
  minHeight: '200px', // Para asegurar que sea visible
};

const headerStyle = {
  cursor: 'pointer',
  backgroundColor: '#e0e0e0', // Para destacar el header
};

function HotelList() {
  const handleHeaderClick = (headerKey) => {
    // Este es el log que queremos ver en la consola al hacer clic
    console.log(`TestHotelList: Header "${headerKey}" clicked! Timestamp: ${new Date().toLocaleTimeString()}`);
    alert(`HotelList: Header "${headerKey}" clicked!`); // Alerta para una confirmación visual inmediata
  };

  console.log('TestHotelList component rendered. Current time:', new Date().toLocaleTimeString());

  return (
    <div style={containerStyle}>
      <h2>Test Hotel List Component</h2>
      <p>
        Este es un componente de prueba simplificado para verificar la funcionalidad de clic
        en los encabezados de la tabla de Carbon.
      </p>
      <p>
        Haz clic en el encabezado "Columna Clickeable de Prueba" para ver si se registra un mensaje en la consola y aparece una alerta.
      </p>
      <TableContainer
        title="Tabla de Prueba Simplificada"
        description="Una tabla con un único encabezado clickeable."
        style={{ marginTop: '20px' }}
      >
        <Table size="md">
          <TableHead>
            <TableRow>
              <TableHeader
                key="test-header-1"
                style={headerStyle}
                onClick={() => handleHeaderClick('Columna Clickeable de Prueba')}
              >
                Columna Clickeable de Prueba
              </TableHeader>
              <TableHeader key="test-header-2">
                Otra Columna (No Clickeable para esta prueba específica)
              </TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Dato de prueba 1A</TableCell>
              <TableCell>Dato de prueba 1B</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Dato de prueba 2A</TableCell>
              <TableCell>Dato de prueba 2B</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <p style={{ marginTop: '20px', fontStyle: 'italic' }}>
        Si el clic funciona, deberías ver un mensaje en la consola del navegador
        (Busca "TestHotelList: Header 'Columna Clickeable de Prueba' clicked!") y una alerta.
      </p>
    </div>
  );
}

export default HotelList;