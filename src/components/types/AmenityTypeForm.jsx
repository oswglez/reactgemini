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

function AmenityTypeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();
  const isEditMode = !!id;

  const [amenityType, setAmenityType] = useState({
    amenityTypeName: '',
    amenityTypeDescription: ''
  });
  const [initialAmenityType, setInitialAmenityType] = useState(null);
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      const fetchAmenityType = async () => {
        try {
          const data = await apiService.get(`/amenityType/${id}`, getAccessTokenSilently);
          setAmenityType(data);
          setInitialAmenityType(data);
        } catch (err) {
          setError(err.message || 'Could not load amenity type details.');
          console.error('Error fetching amenity type:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchAmenityType();
    }
  }, [id, isEditMode, getAccessTokenSilently]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setAmenityType(prev => {
      const updated = { ...prev, [id]: value };
      setHasChanges(JSON.stringify(updated) !== JSON.stringify(initialAmenityType));
      return updated;
    });
    setSaveError(null);
    setSaveSuccess(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      let savedData;
      if (isEditMode) {
        savedData = await apiService.put(`/amenityType/${id}`, amenityType, getAccessTokenSilently);
      } else {
        savedData = await apiService.post('/amenityType', amenityType, getAccessTokenSilently);
      }
      setSaveSuccess('Amenity type saved successfully.');
      setHasChanges(false);
      setInitialAmenityType(savedData);
      if (!isEditMode) {
        setTimeout(() => {
          navigate('/types/amenity');
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving amenity type:', err);
      setSaveError(err.message || 'Could not save amenity type.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelClick = () => {
    if (hasChanges) {
      setShowCancelModal(true);
    } else {
      navigate('/types/amenity');
    }
  };

  if (loading) {
    return <Loading description="Loading amenity type details..." withOverlay={false} />;
  }

  return (
    <div style={containerStyle}>
      <Grid>
        <Column lg={16} md={8} sm={4}>
          <h2 style={{ textAlign: 'center', color: '#3751ff', marginBottom: '20px' }}>
            {isEditMode ? 'Edit Amenity Type' : 'Create New Amenity Type'}
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
                id="amenityTypeName"
                labelText="Name"
                value={amenityType.amenityTypeName || ''}
                onChange={handleChange}
                invalid={!amenityType.amenityTypeName}
                invalidText="Name is required"
                disabled={isSaving}
                required
              />

              <TextInput
                id="amenityTypeDescription"
                labelText="Description"
                value={amenityType.amenityTypeDescription || ''}
                onChange={handleChange}
                invalid={!amenityType.amenityTypeDescription}
                invalidText="Description is required"
                disabled={isSaving}
                required
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
                  disabled={isSaving || !amenityType.amenityTypeName || !amenityType.amenityTypeDescription}
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
        onRequestSubmit={() => navigate('/types/amenity')}
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

export default AmenityTypeForm; 