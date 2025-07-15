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
  Dropdown,
} from '@carbon/react';
import { Save, Close } from '@carbon/icons-react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiService } from '../services/apiService';

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
  const { getAccessTokenSilently } = useAuth0();

  const [amenity, setAmenity] = useState({
    amenityCode: '',
    amenityDescription: '',
    amenityType: '',
  });
  
  // Estados de error individuales para cada campo
  const [fieldErrors, setFieldErrors] = useState({
    amenityCode: '',
    amenityDescription: '',
    amenityType: '',
  });
  
  const [amenityTypes, setAmenityTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
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

  useEffect(() => {
    const fetchAmenityTypes = async () => {
      setLoadingTypes(true);
      try {
        const data = await apiService.amenityTypes.getAll(0, 100, getAccessTokenSilently);
        const options = (data.content || []).map(type => ({
          id: type.amenityTypeName,
          text: type.amenityTypeName,
        }));
        setAmenityTypes(options);
      } catch (err) {
        setSaveError('Failed to load amenity types');
      } finally {
        setLoadingTypes(false);
      }
    };
    fetchAmenityTypes();
  }, [getAccessTokenSilently]);

  // Function to validate a specific field
  const validateField = (fieldName, value) => {
    switch (fieldName) {
      case 'amenityCode':
        if (!value || value.trim() === '') {
          return 'Amenity code is required';
        }
        if (value.trim().length < 2) {
          return 'Code must have at least 2 characters';
        }
        return '';
      case 'amenityDescription':
        if (!value || value.trim() === '') {
          return 'Description is required';
        }
        if (value.trim().length < 5) {
          return 'Description must have at least 5 characters';
        }
        return '';
      case 'amenityType':
        if (!value || value.trim() === '') {
          return 'Amenity type is required';
        }
        return '';
      default:
        return '';
    }
  };

  // Function to validate the entire form
  const validateForm = () => {
    const errors = {
      amenityCode: validateField('amenityCode', amenity.amenityCode),
      amenityDescription: validateField('amenityDescription', amenity.amenityDescription),
      amenityType: validateField('amenityType', amenity.amenityType),
    };
    
    setFieldErrors(errors);
    
    // Returns true if there are no errors
    return !Object.values(errors).some(error => error !== '');
  };

  // --- Handle Form Changes ---
  const handleChange = (e) => {
    const { id, value } = e.target;
    setAmenity((prevAmenity) => {
      const newAmenity = { ...prevAmenity, [id]: value };
      // Comparamos con el estado inicial del formulario vacío
      setHasChanges(JSON.stringify(newAmenity) !== JSON.stringify(initialFormState));
      return newAmenity;
    });
    
    // Validate the specific field in real time
    const fieldError = validateField(id, value);
    setFieldErrors(prev => ({
      ...prev,
      [id]: fieldError
    }));
    
    setSaveError(null); // Clear errors when changing
    setSaveSuccess(null); // Clear success when changing
  };

  const handleDropdownChange = ({ selectedItem }) => {
    const selectedValue = selectedItem ? selectedItem.id : '';
    setAmenity(prev => ({ ...prev, amenityType: selectedValue }));
    
    // Validate the type field
    const fieldError = validateField('amenityType', selectedValue);
    setFieldErrors(prev => ({
      ...prev,
      amenityType: fieldError
    }));
    
    setSaveError(null);
    setSaveSuccess(null);
    setHasChanges(true);
  };

  // --- Handle Save (Create New) ---
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    // Validate the entire form before submitting
    if (!validateForm()) {
      setIsSaving(false);
      return;
    }

    try {
      await apiService.post('/amenities', amenity, getAccessTokenSilently);
      setSaveSuccess('Amenity created successfully!');
      setAmenity({ amenityCode: '', amenityDescription: '', amenityType: '' }); // Clear form
      setFieldErrors({ amenityCode: '', amenityDescription: '', amenityType: '' }); // Clear errors
      setHasChanges(false); // Reset changes

      // Optional: Redirect after successful creation
      setTimeout(() => {
        navigate('/amenities-list'); // Navigate to amenities list
      }, 2000); // Wait 2 seconds for user to see the message

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
      navigate('/amenities-list'); // Si no hay cambios, volver directamente
    }
  };

  const handleCancelConfirm = () => {
    setShowCancelModal(false);
    navigate('/amenities-list'); // Navegar a la lista de amenities
  };

  const handleCancelClose = () => {
    setShowCancelModal(false);
  };

  // Check if the form is valid to enable the save button
  const isFormValid = () => {
    return amenity.amenityCode.trim() !== '' && 
           amenity.amenityDescription.trim() !== '' && 
           amenity.amenityType.trim() !== '' &&
           !Object.values(fieldErrors).some(error => error !== '');
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
                labelText="Amenity Code *"
                value={amenity.amenityCode}
                onChange={handleChange}
                required
                invalid={fieldErrors.amenityCode !== ''}
                invalidText={fieldErrors.amenityCode}
                placeholder="Enter amenity code"
              />
              <TextInput
                id="amenityDescription"
                name="amenityDescription"
                labelText="Description *"
                value={amenity.amenityDescription}
                onChange={handleChange}
                required
                invalid={fieldErrors.amenityDescription !== ''}
                invalidText={fieldErrors.amenityDescription}
                placeholder="Enter amenity description"
              />
              <Dropdown
                id="amenityType"
                titleText="Type *"
                label="Select Amenity Type"
                items={amenityTypes}
                itemToString={item => (item ? item.text : '')}
                selectedItem={amenityTypes.find(item => item.id === amenity.amenityType) || null}
                onChange={handleDropdownChange}
                required
                disabled={loadingTypes || isSaving}
                invalid={fieldErrors.amenityType !== ''}
                invalidText={fieldErrors.amenityType}
                placeholder="Select amenity type"
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
                  disabled={isSaving || !isFormValid()} // Disable if not valid or saving
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
