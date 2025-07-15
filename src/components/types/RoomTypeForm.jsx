import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form,
  TextInput,
  Button,
  Modal,
  InlineNotification,
  Loading,
  Grid,
  Column,
  Stack,
} from '@carbon/react';
import { Save, Close } from '@carbon/icons-react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiService } from '../../services/apiService';

// Styles
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

function RoomTypeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();
  const isEditMode = !!id;

  const [roomType, setRoomType] = useState({
    roomTypeName: '',
    roomTypeDescription: ''
  });
  const [initialRoomType, setInitialRoomType] = useState(null);
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Individual field error states
  const [fieldErrors, setFieldErrors] = useState({
    roomTypeName: '',
    roomTypeDescription: ''
  });
  
  // State to control when to show validation errors
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      const fetchRoomType = async () => {
        try {
          const data = await apiService.get(`/roomType/${id}`, getAccessTokenSilently);
          setRoomType(data);
          setInitialRoomType(data);
        } catch (err) {
          setError(err.message || 'Could not load room type details.');
          console.error('Error fetching room type:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchRoomType();
    }
  }, [id, isEditMode, getAccessTokenSilently]);

  // Validate form whenever formData changes, but only if showValidation is true
  useEffect(() => {
    if (showValidation) {
      validateForm();
    }
  }, [roomType, showValidation]);

  // Function to validate a specific field
  const validateField = (fieldName, value) => {
    switch (fieldName) {
      case 'roomTypeName':
        if (!value || value.trim() === '') {
          return 'Name is required';
        }
        if (showValidation && value.trim().length < 2) {
          return 'Name must have at least 2 characters';
        }
        if (showValidation && value.trim().length > 50) {
          return 'Name must not exceed 50 characters';
        }
        return '';
      case 'roomTypeDescription':
        if (!value || value.trim() === '') {
          return 'Description is required';
        }
        if (showValidation && value.trim().length < 5) {
          return 'Description must have at least 5 characters';
        }
        if (showValidation && value.trim().length > 200) {
          return 'Description must not exceed 200 characters';
        }
        return '';
      default:
        return '';
    }
  };

  // Function to validate the entire form
  const validateForm = () => {
    const errors = {
      roomTypeName: validateField('roomTypeName', roomType.roomTypeName),
      roomTypeDescription: validateField('roomTypeDescription', roomType.roomTypeDescription),
    };
    
    setFieldErrors(errors);
    
    // Returns true if there are no errors
    return !Object.values(errors).some(error => error !== '');
  };

  // Check if the form is valid to enable the save button
  const isFormValid = () => {
    return roomType.roomTypeName.trim() !== '' && 
           roomType.roomTypeDescription.trim() !== '';
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setRoomType(prev => {
      const updated = { ...prev, [id]: value };
      setHasChanges(JSON.stringify(updated) !== JSON.stringify(initialRoomType));
      return updated;
    });
    setSaveError(null);
    setSaveSuccess(null);
  };

  const handleBlur = (field) => {
    const value = roomType[field];
    const fieldError = validateField(field, value);
    setFieldErrors(prev => ({
      ...prev,
      [field]: fieldError
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Force validation display
    setShowValidation(true);
    
    // Validate the entire form before submitting
    if (!validateForm()) {
      setSaveError('Please fill in all required fields correctly');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      let savedType;
      if (isEditMode) {
        savedType = await apiService.put(`/roomType/${id}`, roomType, getAccessTokenSilently);
      } else {
        savedType = await apiService.post('/roomType', roomType, getAccessTokenSilently);
      }
      setSaveSuccess('Room type saved successfully!');
      setInitialRoomType(savedType);
      setRoomType(savedType);
      setHasChanges(false);
      setTimeout(() => {
        navigate('/types/room');
      }, 1500);
    } catch (err) {
      console.error('Error saving room type:', err);
      setSaveError(err.message || 'Could not save room type. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelClick = () => {
    if (hasChanges) {
      setShowCancelModal(true);
    } else {
      navigate('/types/room');
    }
  };

  if (loading) {
    return <Loading description="Loading room type details..." withOverlay={false} />;
  }

  return (
    <div style={containerStyle}>
      <Grid>
        <Column lg={16} md={8} sm={4}>
          <h2 style={{ textAlign: 'center', color: '#3751ff', marginBottom: '20px' }}>
            {isEditMode ? 'Edit Room Type' : 'Create New Room Type'}
          </h2>

          {error && (
            <InlineNotification
              kind="error"
              title="Error"
              subtitle={error}
              onCloseButtonClick={() => setError(null)}
              lowContrast
              style={{ marginBottom: '1rem' }}
            />
          )}

          <Form onSubmit={handleSave} style={formStyle}>
            <Stack gap={7}>
              <TextInput
                id="roomTypeName"
                labelText="Name *"
                value={roomType.roomTypeName || ''}
                onChange={handleChange}
                onBlur={() => handleBlur('roomTypeName')}
                invalid={fieldErrors.roomTypeName !== ''}
                invalidText={fieldErrors.roomTypeName}
                disabled={isSaving}
                required
                placeholder="Enter room type name"
              />

              <TextInput
                id="roomTypeDescription"
                labelText="Description *"
                value={roomType.roomTypeDescription || ''}
                onChange={handleChange}
                onBlur={() => handleBlur('roomTypeDescription')}
                invalid={fieldErrors.roomTypeDescription !== ''}
                invalidText={fieldErrors.roomTypeDescription}
                disabled={isSaving}
                required
                placeholder="Enter room type description"
              />

              {saveError && (
                <InlineNotification
                  kind="error"
                  title="Error"
                  subtitle={saveError}
                  onCloseButtonClick={() => setSaveError(null)}
                  lowContrast
                />
              )}

              {saveSuccess && (
                <InlineNotification
                  kind="success"
                  title="Success"
                  subtitle={saveSuccess}
                  onCloseButtonClick={() => setSaveSuccess(null)}
                  lowContrast
                />
              )}

              <div style={buttonContainerStyle}>
                <Button
                  kind="secondary"
                  onClick={handleCancelClick}
                  renderIcon={Close}
                  disabled={isSaving}
                  style={actionButtonStyle}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  renderIcon={Save}
                  disabled={isSaving || !isFormValid()}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </Stack>
          </Form>
        </Column>
      </Grid>

      <Modal
        open={showCancelModal}
        onRequestClose={() => setShowCancelModal(false)}
        onRequestSubmit={() => navigate('/types/room')}
        modalHeading="Discard Changes?"
        primaryButtonText="Discard"
        secondaryButtonText="Continue Editing"
        danger
      >
        <p>
          You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
        </p>
      </Modal>
    </div>
  );
}

export default RoomTypeForm; 