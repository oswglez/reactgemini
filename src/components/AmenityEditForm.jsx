// src/components/AmenityEditForm.jsx
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
import { apiService } from '../services/apiService';

// Estilos
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

function AmenityEditForm() {
  const params = useParams();
  const { amenityId } = params;
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();

  console.log("AmenityEditForm: useParams returned:", params);

  const [amenity, setAmenity] = useState({
    amenityCode: '',
    amenityDescription: '',
    amenityType: '',
  });
  const [initialAmenity, setInitialAmenity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchAmenityById = async (id) => {
    if (!id || id === 'undefined') {
      console.error("fetchAmenityById: Attempted to fetch with invalid ID:", id);
      setError('Amenity ID is missing or invalid. Check URL and routing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSaveError(null);
    setSaveSuccess(null);
    console.log(`fetchAmenityById: Attempting to fetch with ID: ${id}`);

    try {
      const data = await apiService.get(`/amenities/${id}`, getAccessTokenSilently);
      setAmenity(data);
      setInitialAmenity(data);
      setHasChanges(false);
    } catch (err) {
      setError(err.message || 'Could not load amenity details.');
      console.error('fetchAmenityById: Error fetching amenity:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("AmenityEditForm: useEffect running. amenityId is:", amenityId);
    if (amenityId && amenityId !== 'undefined') {
        fetchAmenityById(amenityId);
    } else {
      setError('Amenity ID not found in URL. Please check the route and navigation link.');
      setLoading(false);
    }
  }, [amenityId]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setAmenity((prevAmenity) => {
      const newAmenity = { ...prevAmenity, [id]: value };
      setHasChanges(JSON.stringify(newAmenity) !== JSON.stringify(initialAmenity));
      return newAmenity;
    });
    setSaveError(null);
    setSaveSuccess(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    if (!amenityId || amenityId === 'undefined') {
        setSaveError("Cannot save: Amenity ID is missing.");
        setIsSaving(false);
        return;
    }

    try {
      const updatedAmenity = await apiService.put(`/amenities/${amenityId}`, amenity, getAccessTokenSilently);
      setSaveSuccess('Amenity updated successfully!');
      setInitialAmenity(updatedAmenity);
      setAmenity(updatedAmenity);
      setHasChanges(false);
      setTimeout(() => {
        navigate('/amenities-list');
      }, 1500);
    } catch (err) {
      console.error('Error saving amenity:', err);
      setSaveError(err.message || 'Could not save amenity. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelClick = () => {
    if (hasChanges) {
      setShowCancelModal(true);
    } else {
      navigate('/amenities-list');
    }
  };

  const handleCancelConfirm = () => {
    setShowCancelModal(false);
    navigate(-1);
  };

  const handleCancelClose = () => {
    setShowCancelModal(false);
  };

  return (
    <div style={containerStyle}>
      <Grid>
        <Column lg={16} md={8} sm={4}>
          <h2 style={{ textAlign: 'center', color: '#3751ff', marginBottom: '20px' }}>
            Edit Amenity
          </h2>

          {loading && <Loading description="Loading amenity details..." withOverlay={false} />}

          {error && !loading && (
            <InlineNotification
              kind="error"
              title="Error Loading Amenity"
              subtitle={error}
              onCloseButtonClick={() => setError(null)}
              lowContrast
              style={{ marginBottom: '1rem' }}
            />
          )}

          {!loading && !error && (
            <Form onSubmit={handleSave} style={formStyle}>
              <Stack gap={7}>
                <TextInput
                  id="amenityCode"
                  name="amenityCode"
                  labelText="Amenity Code"
                  value={amenity.amenityCode || ''}
                  onChange={handleChange}
                  required
                  invalid={!amenity.amenityCode}
                  invalidText="Amenity Code is required."
                />
                <TextInput
                  id="amenityDescription"
                  name="amenityDescription"
                  labelText="Description"
                  value={amenity.amenityDescription || ''}
                  onChange={handleChange}
                  required
                  invalid={!amenity.amenityDescription}
                  invalidText="Description is required."
                />
                <TextInput
                  id="amenityType"
                  name="amenityType"
                  labelText="Type"
                  value={amenity.amenityType || ''}
                  onChange={handleChange}
                  required
                  invalid={!amenity.amenityType}
                  invalidText="Type is required."
                />

                {saveError && (
                  <InlineNotification
                    kind="error"
                    title="Save Failed"
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
                    onCloseButtonClick={() => setSaveSuccess(null)}
                    lowContrast
                    style={{ marginTop: '1rem' }}
                  />
                )}

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
                    disabled={isSaving || !hasChanges}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </Stack>
            </Form>
          )}

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

export default AmenityEditForm;