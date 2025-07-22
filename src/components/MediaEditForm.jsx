import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form,
  FormLabel,
  TextInput,
  NumberInput,
  Dropdown,
  Button,
  InlineNotification,
  Loading,
  ComposedModal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@carbon/react';
import { useAuthenticatedFetch } from '../services/apiService';
import './MediaEditForm.css';

function MediaEditForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const authenticatedFetch = useAuthenticatedFetch();

  const [form, setForm] = useState({
    mediaCode: '',
    mediaType: '',
    mediaDescription: '',
    mediaUrl: ''
  });
  const [initialForm, setInitialForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState(null);
  const [mediaTypeItems, setMediaTypeItems] = useState([]);

  // Load media types from API
  useEffect(() => {
    const fetchMediaTypes = async () => {
      try {
        const response = await authenticatedFetch('/mediaType?size=100');
        if (response.ok) {
          const data = await response.json();
          const items = data.content.map(type => ({
            id: type.mediaTypeName,
            text: type.mediaTypeName,
            description: type.mediaTypeDescription
          }));
          setMediaTypeItems(items);
        } else {
          console.error('Failed to load media types');
          // Fallback to basic types if API fails
          setMediaTypeItems([
            { id: 'IMAGE', text: 'IMAGE', description: 'Photos Normal' },
            { id: 'VIDEO', text: 'VIDEO', description: 'Videos plus 360 videos' },
            { id: 'AUDIO', text: 'AUDIO', description: 'Audio recorded Modif' },
            { id: 'Vision', text: 'Vision', description: 'Visuales' }
          ]);
        }
      } catch (err) {
        console.error('Error loading media types:', err);
        // Fallback to basic types if API fails
        setMediaTypeItems([
          { id: 'IMAGE', text: 'IMAGE', description: 'Photos Normal' },
          { id: 'VIDEO', text: 'VIDEO', description: 'Videos plus 360 videos' },
          { id: 'AUDIO', text: 'AUDIO', description: 'Audio recorded Modif' },
          { id: 'Vision', text: 'Vision', description: 'Visuales' }
        ]);
      }
    };
    fetchMediaTypes();
  }, [authenticatedFetch]);

  // Load media data if editing
  useEffect(() => {
    if (!id || mediaTypeItems.length === 0) return;
    
    const fetchMedia = async () => {
      setLoading(true);
      try {
        const response = await authenticatedFetch(`/medias/${id}`);
        if (response.ok) {
          const mediaData = await response.json();
          const formData = {
            mediaCode: mediaData.mediaCode || '',
            mediaType: mediaData.mediaType || '',
            mediaDescription: mediaData.mediaDescription || '',
            mediaUrl: mediaData.mediaUrl || ''
          };
          setForm(formData);
          setInitialForm(formData);
          
          // Set selected media type for dropdown
          const mediaType = mediaTypeItems.find(item => item.id === mediaData.mediaType);
          setSelectedMediaType(mediaType || null);
        } else {
          throw new Error('Failed to load media');
        }
      } catch (err) {
        setError('Error loading media: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMedia();
  }, [id, authenticatedFetch, mediaTypeItems]);

  // Initialize form for new media creation
  useEffect(() => {
    if (!id && mediaTypeItems.length > 0) {
      const initialFormData = {
        mediaCode: '',
        mediaType: '',
        mediaDescription: '',
        mediaUrl: ''
      };
      setForm(initialFormData);
      setInitialForm(initialFormData);
    }
  }, [id, mediaTypeItems]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleMediaTypeChange = ({ selectedItem }) => {
    setSelectedMediaType(selectedItem);
    setForm(prev => ({ ...prev, mediaType: selectedItem ? selectedItem.id : '' }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const mediaData = {
        mediaCode: form.mediaCode,
        mediaType: form.mediaType,
        mediaDescription: form.mediaDescription,
        mediaUrl: form.mediaUrl,
      };

      const url = id ? `/medias/${id}` : '/medias';
      const method = id ? 'PUT' : 'POST';
      
      const response = await authenticatedFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mediaData),
      });

      if (response.ok) {
        setSuccess(id ? 'Media updated successfully!' : 'Media created successfully!');
        setTimeout(() => {
          navigate('/media');
        }, 1500);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save media');
      }
    } catch (err) {
      setError('Error saving media: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const hasChanges = JSON.stringify(form) !== JSON.stringify(initialForm);
    if (hasChanges) {
      setOpenCancelModal(true);
    } else {
      navigate('/media');
    }
  };

  const proceedWithCancel = () => {
    setOpenCancelModal(false);
    navigate('/media');
  };

  const closeModal = () => setOpenCancelModal(false);

  const isFormDirty = () => {
    return JSON.stringify(form) !== JSON.stringify(initialForm);
  };

  if (loading) {
    return (
      <div className="media-edit-form-container">
        <Loading active description="Loading media..." />
      </div>
    );
  }

  return (
    <div className="media-edit-form-container">
      <div className="media-edit-form-content">
        {/* Header Navigation */}
        <div className="header-navigation">
          <Button 
            kind="tertiary" 
            onClick={() => navigate("/media")}
            className="nav-button back-button"
          >
            <span className="nav-icon">←</span>
            Back to Media
          </Button>
          <h1 className="page-title">{id ? 'Edit Media' : 'Create Media'}</h1>
        </div>
        
        <Form onSubmit={handleSubmit}>
          {/* Media Information Card */}
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">Media Information</h2>
            </div>
            <div className="section-content">
              <div className="form-row three-columns">
                <div className="form-field">
                  <FormLabel className="field-label" htmlFor="mediaCode">
                    Media Code <span className="required-mark">*</span>
                  </FormLabel>
                  <TextInput
                    id="mediaCode"
                    name="mediaCode"
                    labelText=""
                    placeholder="Enter media code"
                    value={form.mediaCode}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-field">
                  <FormLabel className="field-label" htmlFor="mediaUrl">
                    Media URL <span className="required-mark">*</span>
                  </FormLabel>
                  <TextInput
                    id="mediaUrl"
                    name="mediaUrl"
                    labelText=""
                    placeholder="Enter media URL"
                    value={form.mediaUrl}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-field">
                  {/* Empty field for spacing */}
                </div>
              </div>
              
              <div className="form-row full-width">
                <div className="form-field">
                  <FormLabel className="field-label" htmlFor="mediaType">
                    Media Type <span className="required-mark">*</span>
                  </FormLabel>
                  <Dropdown
                    id="mediaType"
                    titleText=""
                    placeholder="Select media type..."
                    items={mediaTypeItems}
                    itemToString={item => item ? `${item.text} - ${item.description}` : ''}
                    selectedItem={selectedMediaType}
                    onChange={handleMediaTypeChange}
                    className="form-dropdown"
                  />
                </div>
              </div>
              
              <div className="form-row full-width">
                <div className="form-field">
                  <FormLabel className="field-label" htmlFor="mediaDescription">
                    Description <span className="required-mark">*</span>
                  </FormLabel>
                  <TextInput
                    id="mediaDescription"
                    name="mediaDescription"
                    labelText=""
                    placeholder="Enter media description"
                    value={form.mediaDescription}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {error && <InlineNotification kind="error" title="Error" subtitle={error} style={{ marginBottom: '1rem' }} />}
          {success && <InlineNotification kind="success" title="Success" subtitle={success} style={{ marginBottom: '1rem' }} />}
          <div className="button-container">
            <Button kind="secondary" onClick={handleCancel} type="button">Cancel</Button>
            <Button kind="primary" type="submit" disabled={saving || !isFormDirty()}>
              {saving ? 'Saving...' : (id ? 'Update' : 'Create')}
            </Button>
          </div>
        </Form>
      </div>

      {/* Cancel Confirmation Modal */}
      <ComposedModal
        open={openCancelModal}
        onClose={closeModal}
        preventCloseOnClickOutside={false}
        size="sm"
      >
        <ModalHeader title="Discard Changes?" closeModal={closeModal} />
        <ModalBody>
          <p>Any unsaved changes will be lost and you will be navigated away.</p>
          <p>Are you sure you want to cancel?</p>
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" onClick={closeModal}>No</Button>
          <Button kind="primary" onClick={proceedWithCancel}>Yes, Cancel</Button>
        </ModalFooter>
      </ComposedModal>
    </div>
  );
}

export default MediaEditForm; 