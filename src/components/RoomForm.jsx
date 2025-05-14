// src/components/RoomForm.jsx
import React, { useState, useEffect } from 'react'; // Importar useEffect
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form,
  FormGroup,
  TextInput,
  Dropdown,
  NumberInput,
  Button,
  Grid,
  Column,
  InlineNotification,
  Loading,
  Link,
} from '@carbon/react';

// Initial state (no changes)
const initialRoomState = {
  roomNumber: '',
  roomType: '',
  roomName: '',
  building: '',
  floor: '',
  price: '',
};

// REMOVE static list
// const roomTypeItems = [ ... ];

function RoomForm() {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialRoomState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false); // Loading for submit
  const [submitStatus, setSubmitStatus] = useState(null);
  const [lastRoomSavedNumber, setLastRoomSavedNumber] = useState(null);

  // --- State for dynamic dropdown options ---
  const [roomTypeOptions, setRoomTypeOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState(null);
  // ------------------------------------------

  // --- useEffect to load RoomType options ---
  useEffect(() => {
    const fetchRoomTypes = async () => {
      setLoadingOptions(true);
      setOptionsError(null);
      try {
        // --- LLAMADA A LA API ---
        const response = await fetch('http://localhost:8090/api/roomType'); // Endpoint para tipos de habitación
        if (!response.ok) {
          throw new Error(
            `Error ${response.status}: Could not load room types`
          );
        }
        const data = await response.json();
        // Mapear respuesta (asumiendo [{ roomTypeName: 'SINGLE', ...}, ...])
        // al formato { id: 'SINGLE', text: 'SINGLE' }
        // *** Ajusta 'type.roomTypeName' si tu API devuelve otro nombre de campo ***
        const options = (data || []).map((type) => ({
          id: type.roomTypeName, // Usar nombre como ID/valor
          text: type.roomTypeName, // Usar nombre como texto a mostrar
        }));
        console.log('Mapped RoomType Options:', options); // Log para depuración
        setRoomTypeOptions(options);
      } catch (err) {
        console.error('Error fetching room types:', err);
        setOptionsError(err.message || 'Failed to load options');
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchRoomTypes();
  }, []); // Ejecutar solo una vez al montar
  // -------------------------------------------

  // --- Handlers (sin cambios) ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };
  const handleDropdownChange = (field, { selectedItem }) => {
    const value = selectedItem ? selectedItem.id : '';
    console.log(`Dropdown Change: Field=${field}, SelectedID=${value}`);
    console.log('Selected Item Object:', selectedItem);
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };
  const handleNumberInputChange = (fieldName, valueAsString) => {
    setFormData((prev) => ({ ...prev, [fieldName]: valueAsString }));
    if (errors[fieldName])
      setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
  };

  // --- Validation (sin cambios) ---
  const validateForm = () => {
    /* ... Lógica sin cambios ... */
  };

  // --- Submission (sin cambios) ---
  const handleSubmit = async (e) => {
    /* ... Lógica sin cambios ... */
  };

  // --- Renderizado ---
  // Pre-calcular el item seleccionado para el dropdown
  const currentRoomTypeSelectedItem =
    roomTypeOptions.find((item) => item.id === formData.roomType) || null;
  console.log('Calculating RoomType selectedItem for render:', {
    typeInState: formData.roomType,
    optionsAvailable: roomTypeOptions,
    foundObject: currentRoomTypeSelectedItem,
  });

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <h3>Add Room for Hotel ID: {hotelId}</h3>
      </div>

      {/* Mostrar error si falla la carga de opciones */}
      {optionsError && (
        <InlineNotification
          kind="error"
          title="Error loading options"
          subtitle={optionsError}
          lowContrast
          style={{ marginBottom: '1rem' }}
        />
      )}

      <Form onSubmit={handleSubmit}>
        <Grid>
          {/* Column 1 */}
          <Column lg={8} md={6} sm={4}>
            <FormGroup legendText="Room Details">
              <NumberInput
                id="roomNumber"
                name="roomNumber"
                labelText="Room Number (Required)"
                min={1}
                step={1}
                value={formData.roomNumber}
                onChange={(e, { value }) =>
                  handleNumberInputChange('roomNumber', String(value))
                }
                invalid={!!errors.roomNumber}
                invalidText={errors.roomNumber}
                allowEmpty={false}
                light
              />
              <Dropdown
                id="roomType"
                name="roomType"
                titleText="Room Type (Required)"
                label={loadingOptions ? 'Loading types...' : 'Select a type'} // <-- Label dinámico
                items={roomTypeOptions} // <-- Usar opciones del estado
                itemToString={(item) => (item ? item.text : '')}
                onChange={({ selectedItem }) =>
                  handleDropdownChange('roomType', { selectedItem })
                }
                selectedItem={currentRoomTypeSelectedItem} // <-- Usar valor pre-calculado
                invalid={!!errors.roomType}
                invalidText={errors.roomType}
                disabled={loadingOptions || !!optionsError} // <-- Deshabilitar mientras carga/error
                light
              />
              <TextInput
                id="roomName"
                name="roomName"
                labelText="Room Name (Required)"
                value={formData.roomName}
                onChange={handleChange}
                invalid={!!errors.roomName}
                invalidText={errors.roomName}
                light
              />
            </FormGroup>
          </Column>

          {/* Column 2 */}
          <Column lg={8} md={6} sm={4}>
            <FormGroup legendText="Location and Price">
              <TextInput /* ... (building - sin cambios) ... */ />
              <NumberInput /* ... (floor - sin cambios) ... */ />
              <NumberInput /* ... (price - sin cambios) ... */ />
            </FormGroup>
          </Column>

          {/* Submission Area & Notifications */}
          <Column lg={16} md={8} sm={4} style={{ marginTop: '2rem' }}>
            {/* ... Notificaciones (sin cambios) ... */}
            <Button
              type="submit"
              disabled={loading || loadingOptions || !!optionsError}
            >
              {' '}
              {/* <-- Deshabilitar botón si carga opciones */}
              {loading ? 'Saving...' : 'Save and Add Next Room'}
            </Button>
          </Column>
        </Grid>
      </Form>
    </div>
  );
}

export default RoomForm;
