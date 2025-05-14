// src/components/AmenityForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
} from '@carbon/react';

// Estado inicial usando nombres en inglés
const initialAmenityState = {
  code: '',
  type: '', // Guarda 'WIFI', 'TV', etc.
  description: '',
};

// Opciones para AmenityType (Asegúrate que los 'id' coincidan con backend)
const amenityTypeItems = [
  { id: 'WIFI', text: 'WiFi / Internet' },
  { id: 'TV', text: 'Television' },
  { id: 'AIR_CONDITIONING', text: 'Air Conditioning' },
];

function AmenityForm() {
  const { keycloak, initialized } = useKeycloak(); // <--- Obtener keycloak
  const { hotelId } = useParams();
  const [formData, setFormData] = useState(initialAmenityState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [lastSavedInfo, setLastSavedInfo] = useState('');
  const [amenityTypeOptions, setAmenityTypeOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState(null);

  // useEffect para cargar opciones (sin cambios)
  useEffect(() => {
    const fetchAmenityTypes = async () => {
      setLoadingOptions(true);
      setOptionsError(null);
      try {
        const response = await fetch('http://localhost:8090/api/amenityType');
        if (!response.ok)
          throw new Error(
            `Error ${response.status}: Could not load amenity types`
          );
        const data = await response.json();
        const options = (data || []).map((t) => ({
          id: t.amenityTypeName,
          text: t.amenityTypeName,
        }));
        console.log('Mapped Dropdown Options:', options);
        setAmenityTypeOptions(options);
      } catch (err) {
        console.error('Error fetching amenity types:', err);
        setOptionsError(err.message || 'Failed to load options');
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchAmenityTypes();
  }, []);

  // --- Handlers CON LÓGICA ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleDropdownChange = (field, { selectedItem }) => {
    const value = selectedItem ? selectedItem.id : '';
    console.log(`Dropdown Change: Field=${field}, SelectedID=${value}`); // Log de depuración 1
    console.log('Selected Item Object:', selectedItem); // Log de depuración 2
    setFormData((prev) => {
      const newState = { ...prev, [field]: value };
      // console.log(`New formData state after setting ${field}:`, newState); // Log opcional
      return newState;
    });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleNumberInputChange = (fieldName, valueAsString) => {
    setFormData((prev) => ({ ...prev, [fieldName]: valueAsString }));
    if (errors[fieldName])
      setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
  };
  // --- FIN Handlers CON LÓGICA ---

  // --- Validación (sin cambios) ---
  const validateForm = () => {
    const newErrors = {};
    const { code, type, description } = formData;
    const parsedCode = parseInt(code, 10);
    if (code === '' || isNaN(parsedCode) || parsedCode <= 0) {
      newErrors.code = 'Code is required and must be a positive integer.';
    }
    if (!type) {
      newErrors.type = 'Amenity type is required.';
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Envío (sin cambios) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!keycloak.authenticated) {
      // <--- Verificar autenticación antes de enviar
      console.error('User not authenticated!');
      setErrors((prev) => ({ ...prev, api: 'User not authenticated.' }));
      setSubmitStatus('error');
      return; // O redirigir a login: keycloak.login()
    }
    setSubmitStatus(null);
    setLastSavedInfo('');
    if (!validateForm() || !hotelId) {
      /*...*/ return;
    }
    setLoading(true);
    const payload = {
      amenityCode: parseInt(formData.code, 10),
      amenityType: formData.type,
      amenityDescription: formData.description,
    };
    const apiUrl = `http://localhost:8090/api/amenities?hotelId=${hotelId}`;
    console.log(
      `Sending Payload to ${apiUrl}:`,
      JSON.stringify(payload, null, 2)
    );
    const refreshed = await keycloak.updateToken(5);
    console.log(refreshed ? 'Token refreshed' : 'Token still valid');
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // --- AÑADIR TOKEN DE AUTORIZACIÓN ---
          Authorization: `Bearer ${keycloak.token}`,
          // ------------------------------------
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        /* ... error handling ... */
      }
      const savedAmenity = await response.json();
      console.log('Amenity saved:', savedAmenity);
      setSubmitStatus('success');
      setLastSavedInfo(`Code ${formData.code}: ${formData.description}`);
      setFormData(initialAmenityState);
      setErrors({});
    } catch (error) {
      console.log('Error:  ' + ' ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  if (!initialized) {
    // Muestra un loader mientras Keycloak se está inicializando
    return (
      <Loading
        description="Initializing security context..."
        withOverlay={false}
      />
    );
    // O simplemente: return <div>Loading authentication...</div>;
  } 
  // --- Renderizado ---
  // Variable para depurar selectedItem (calculada antes del return)
  const currentSelectedItem =
    amenityTypeOptions.find((item) => item.id === formData.type) || null;
  console.log('Calculating selectedItem for render:', {
    typeInState: formData.type,
    optionsAvailable: amenityTypeOptions,
    foundObject: currentSelectedItem,
  });

  return (
    <div>
      <h3 style={{ marginBottom: '1.5rem' }}>
        Add Amenity for Hotel ID: {hotelId}
      </h3>
      {optionsError && <InlineNotification /* ... error options ... */ />}
      <Form onSubmit={handleSubmit}>
        <Grid>
          <Column lg={8} md={6} sm={4}>
            <FormGroup legendText="Amenity Details">
              <NumberInput
                id="code"
                name="code"
                labelText="Amenity Code (Required)"
                min={1}
                step={1}
                value={formData.code}
                onChange={(e, { value }) =>
                  handleNumberInputChange('code', String(value))
                }
                invalid={!!errors.code}
                invalidText={errors.code}
                allowEmpty={false}
                hideSteppers
                light
              />
              <Dropdown
                id="type"
                name="type"
                titleText="Amenity Type (Required)"
                label={loadingOptions ? 'Loading types...' : 'Select a type'}
                items={amenityTypeOptions}
                itemToString={(item) => (item ? item.text : '')}
                onChange={({ selectedItem }) =>
                  handleDropdownChange('type', { selectedItem })
                }
                selectedItem={currentSelectedItem} // <-- Usar la variable pre-calculada
                invalid={!!errors.type}
                invalidText={errors.type}
                disabled={loadingOptions || !!optionsError}
                light
              />
              <TextInput
                id="description"
                name="description"
                labelText="Description (Required)"
                value={formData.description}
                onChange={handleChange}
                invalid={!!errors.description}
                invalidText={errors.description}
                light
              />
            </FormGroup>
          </Column>
          <Column lg={16} md={8} sm={4} style={{ marginTop: '2rem' }}>
            {/* ... Notificaciones y Botón ... */}
            <Button
              type="submit"
              disabled={loading || loadingOptions || !!optionsError}
            >
              {loading ? 'Saving...' : 'Save Amenity'}
            </Button>
          </Column>
        </Grid>
      </Form>
    </div>
  );
}

export default AmenityForm;
