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
import { getApiBaseUrl } from '../../services/config';

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

function MediaTypeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [mediaType, setMediaType] = useState({
    mediaTypeName: '',
    mediaTypeDescription: ''
  });
  const [initialMediaType, setInitialMediaType] = useState(null);
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      const fetchMediaType = async () => {
        try {
          const baseUrl = getApiBaseUrl();
          const response = await fetch(`${baseUrl}/api/mediaType/${id}`);
          if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}: ${response.statusText || 'Could not fetch media type'}`);
          }
          const data = await response.json();
          setMediaType(data);
          setInitialMediaType(data);
        } catch (err) {
          setError(err.message || 'Could not load media type details.');
          console.error('Error fetching media type:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchMediaType();
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setMediaType(prev => {
      const updated = { ...prev, [id]: value };
      setHasChanges(JSON.stringify(updated) !== JSON.stringify(initialMediaType));
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
      const baseUrl = getApiBaseUrl();
      const url = isEditMode
        ? `${baseUrl}/api/mediaType/${id}`
        : `${baseUrl}/api/mediaType`;
      
      const response = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mediaType),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${errorBody || 'Could not save media type'}`);
      }

      const savedData = await response.json();
      setSaveSuccess('Media type saved successfully.');
      setHasChanges(false);
      setInitialMediaType(savedData);
      if (!isEditMode) {
        navigate(`/media-types/${savedData.mediaTypeId}`);
      }
    } catch (err) {
      console.error('Error saving media type:', err);
      setSaveError(err.message || 'Could not save media type.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelClick = () => {
    if (hasChanges) {
      setShowCancelModal(true);
    } else {
      navigate('/types/media');
    }
  };

  if (loading) {
    return <Loading description="Loading media type details..." withOverlay={false} />;
  }

  return (
    <div style={containerStyle}>
      <Grid>
        <Column lg={16} md={8} sm={4}>
          <h2 style={{ textAlign: 'center', color: '#3751ff', marginBottom: '20px' }}>
            {isEditMode ? 'Edit Media Type' : 'Create New Media Type'}
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
                id="mediaTypeName"
                labelText="Name"
                value={mediaType.mediaTypeName || ''}
                onChange={handleChange}
                invalid={!mediaType.mediaTypeName}
                invalidText="Name is required"
                disabled={isSaving}
                required
              />

              <TextInput
                id="mediaTypeDescription"
                labelText="Description"
                value={mediaType.mediaTypeDescription || ''}
                onChange={handleChange}
                invalid={!mediaType.mediaTypeDescription}
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
                  disabled={isSaving || !mediaType.mediaTypeName || !mediaType.mediaTypeDescription}
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
        onRequestSubmit={() => navigate('/types/media')}
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

export default MediaTypeForm; 