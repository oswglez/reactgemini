// src/components/TypesManagementPage.jsx
import React, { useState } from 'react';
// Importar Dropdown
import { Dropdown, Grid, Column } from '@carbon/react';

// Importar los componentes placeholder
import AmenityTypeForm from './AmenityTypeForm';
import MediaTypeForm from './MediaTypeForm';
import RoomTypeForm from './RoomTypeForm';

// Opciones para el Dropdown de categoría
const typeCategories = [
  // Usar 'id' corto para el estado, 'text' para mostrar al usuario
  { id: 'amenity', text: 'Amenity Types' },
  { id: 'media', text: 'Media Types' },
  { id: 'room', text: 'Room Types' },
];

function TypesManagementPage() {
  // Estado para saber qué categoría está seleccionada
  const [selectedCategory, setSelectedCategory] = useState(null); // null, 'amenity', 'media', 'room'

  // Función que decide qué componente mostrar basado en la categoría
  const renderManagementComponent = () => {
    switch (selectedCategory) {
      case 'amenity':
        return <AmenityTypeForm />;
      case 'media':
        return <MediaTypeForm />;
      case 'room':
        return <RoomTypeForm />;
      default:
        // Mensaje si no hay nada seleccionado (se verá menos porque el dropdown tendrá placeholder)
        return (
          <p style={{ color: '#6f6f6f', marginTop: '1rem' }}>
            Select a category from the dropdown above.
          </p>
        );
    }
  };

  // Handler para el cambio en el Dropdown
  const handleCategoryChange = ({ selectedItem }) => {
    setSelectedCategory(selectedItem ? selectedItem.id : null);
  };

  return (
    <div>
      <h2>Manage Reference Types</h2>
      <p style={{ color: '#aeaeae', marginBottom: '1.5rem' }}>
        Select the category of global types you want to manage.
      </p>

      {/* Usar Grid para alinear el Dropdown */}
      <Grid>
        <Column lg={6} md={4} sm={4}>
          {' '}
          {/* Ajusta el ancho según necesites */}
          {/* --- Dropdown para seleccionar categoría --- */}
          <Dropdown
            id="type-category-selector"
            // Etiqueta principal que pediste
            titleText="Select type category"
            // Placeholder dentro del campo
            label="Choose a category..."
            items={typeCategories} // Las opciones definidas arriba
            itemToString={(item) => (item ? item.text : '')}
            // Llama a handleCategoryChange al seleccionar
            onChange={handleCategoryChange}
            // Determina qué item mostrar como seleccionado basado en el estado
            selectedItem={
              typeCategories.find((item) => item.id === selectedCategory) ||
              null
            }
            light // Asumiendo tema g10 heredado
          />
          {/* ----------------------------------------- */}
        </Column>
      </Grid>

      {/* Línea separadora */}
      <hr
        style={{ border: 0, borderTop: '1px solid #555', margin: '2rem 0' }}
      />

      {/* Área donde se muestra el componente de gestión para la categoría seleccionada */}
      <div>{renderManagementComponent()}</div>
    </div>
  );
}

export default TypesManagementPage;
