// src/components/AmenityNewForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  TextInput,
  Button,
  Modal,
  InlineNotification,
  Loading, // Aunque no cargamos datos, lo mantenemos por si se añade lógica futura
  Grid,
  Column,
  Stack,
} from '@carbon/react';
import { Save, Close } from '@carbon/icons-react';

// Estilos (pueden ser los mismos que AmenityEditForm)
const containerStyle = {
  marginTop: '1rem',
  width: '100%',
  padding: '40px',
  backgroundColor: '#f9f9f9',
};
const formStyle = {
  backgroundColor: '#fff',
  padding: '30px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};
const buttonContainerStyle = {
  marginTop: '2rem',
  display: 'flex',
  justifyContent: 'flex-end',
};
const actionButtonStyle = {
  marginLeft: '0.5rem',
};

function AmenityNewForm() {
  const navigate = useNavigate();

  const [amenity, setAmenity] = useState({
    amenityCode: '',
    amenityDescription: '',
    amenityType: '',
  });
  // No necesitamos initialAmenity para el formulario de creación
  // pero hasChanges sí es útil para el modal de cancelación.
  const [initialFormState] = useState({ // Para comparar si hay cambios
    amenityCode: '',
    amenityDescription: '',
    amenityType: '',
  });

  const [loading, setLoading] = useState(false); // No se cargan datos inicialmente
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // --- Handle Form Changes ---
  const handleChange = (e) => {
    const { id, value } = e.target;
    setAmenity((prevAmenity) => {
      const newAmenity = { ...prevAmenity, [id]: value };
      // Comparamos con el estado inicial del formulario vacío
      setHasChanges(JSON.stringify(newAmenity) !== JSON.stringify(initialFormState));
      return newAmenity;
    });
    setSaveError(null); // Limpiar errores al cambiar
    setSaveSuccess(null); // Limpiar éxito al cambiar
  };

  // --- Handle Save (Create New) ---
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    // Validaciones básicas (puedes expandirlas)
    if (!amenity.amenityCode || !amenity.amenityDescription || !amenity.amenityType) {
      setSaveError("All fields are required.");
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:8090/api/amenities`, { // URL para POST
        method: 'POST', // Método POST para crear
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(amenity),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${errorBody || 'Could not create amenity.'}`);
      }

      // const newAmenityData = await response.json(); // La API podría devolver la amenity creada
      setSaveSuccess('Amenity created successfully!');
      setAmenity({ amenityCode: '', amenityDescription: '', amenityType: '' }); // Limpiar formulario
      setHasChanges(false); // Resetear cambios

      // Opcional: Redirigir después de crear con éxito
      setTimeout(() => {
        navigate(-1); // Navegar a la lista de amenities
      }, 2000); // Esperar 2 segundos para que el usuario vea el mensaje

    } catch (err) {
      console.error('Error creating amenity:', err);
      setSaveError(err.message || 'Could not create amenity. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Handle Cancel ---
  const handleCancelClick = () => {
    if (hasChanges) {
      setShowCancelModal(true);
    } else {
      navigate('-1'); // Si no hay cambios, volver directamente
    }
  };

  const handleCancelConfirm = () => {
    setShowCancelModal(false);
    navigate(-1); // Navegar a la lista de amenities
  };

  const handleCancelClose = () => {
    setShowCancelModal(false);
  };

  return (
    <div style={containerStyle}>
      <Grid>
        <Column lg={16} md={8} sm={4}>
          <h2 style={{ textAlign: 'center', color: '#3751ff', marginBottom: '20px' }}>
            Create New Amenity
          </h2>

          {/* No hay sección de carga inicial para 'new' */}

          <Form onSubmit={handleSave} style={formStyle}>
            <Stack gap={7}>
              <TextInput
                id="amenityCode"
                name="amenityCode"
                labelText="Amenity Code"
                value={amenity.amenityCode} // No necesita '|| ""' porque el estado inicial es ""
                onChange={handleChange}
                required
                // El campo de código SÍ es editable para nuevas amenities
                invalid={saveError && !amenity.amenityCode} // Marcar como inválido si hay error de guardado y está vacío
                invalidText="Amenity Code is required."
              />
              <TextInput
                id="amenityDescription"
                name="amenityDescription"
                labelText="Description"
                value={amenity.amenityDescription}
                onChange={handleChange}
                required
                invalid={saveError && !amenity.amenityDescription}
                invalidText="Description is required."
              />
              <TextInput
                id="amenityType"
                name="amenityType"
                labelText="Type"
                value={amenity.amenityType}
                onChange={handleChange}
                required
                invalid={saveError && !amenity.amenityType}
                invalidText="Type is required."
              />

              {saveError && (
                <InlineNotification
                  kind="error"
                  title="Creation Failed"
                  subtitle={saveError}
                  onCloseButtonClick={() => setSaveError(null)}
                  lowContrast
                  style={{ marginTop: '1rem' }}
                />
              )}
              {saveSuccess && (
                <InlineNotification
                  kind="success"
                  title="Success"
                  subtitle={saveSuccess}
                  onCloseButtonClick={() => setSaveSuccess(null)} // O dejarlo para que desaparezca con la navegación
                  lowContrast
                  style={{ marginTop: '1rem' }}
                />
              )}
               {isSaving && <Loading description="Saving amenity..." withOverlay={false} style={{marginTop: '1rem'}} />}


              <div style={buttonContainerStyle}>
                <Button
                  kind="secondary"
                  onClick={handleCancelClick}
                  renderIcon={Close}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  kind="primary"
                  type="submit"
                  renderIcon={Save}
                  style={actionButtonStyle}
                  disabled={isSaving || !hasChanges} // Deshabilitar si no hay cambios o está guardando
                >
                  {isSaving ? 'Creating...' : 'Create Amenity'}
                </Button>
              </div>
            </Stack>
          </Form>

          <Modal
            open={showCancelModal}
            onRequestClose={handleCancelClose}
            onRequestSubmit={handleCancelConfirm}
            modalHeading="Unsaved Changes"
            primaryButtonText="Leave Page"
            secondaryButtonText="Stay"
            danger
          >
            <p>You have unsaved changes. Are you sure you want to leave this page? Your changes will be lost.</p>
          </Modal>
        </Column>
      </Grid>
    </div>
  );
}

export default AmenityNewForm;
