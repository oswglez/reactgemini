// src/components/AmenityNewForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Dropdown,
  TextArea
} from '@carbon/react';
import { Save, Close, ArrowLeft, Add, Home } from '@carbon/icons-react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiService } from '../services/apiService';
import './AmenityNewForm.css';

function AmenityNewForm() {
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();

  // Form data state
  const [amenity, setAmenity] = useState({
    amenityCode: '',
    amenityDescription: '',
    amenityType: '',
  });
  
  // Field validation states
  const [fieldErrors, setFieldErrors] = useState({
    amenityCode: '',
    amenityDescription: '',
    amenityType: '',
  });
  
  // UI states
  const [amenityTypes, setAmenityTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initial form state for change detection
  const [initialFormState] = useState({
    amenityCode: '',
    amenityDescription: '',
    amenityType: '',
  });

  // Fetch amenity types on component mount
  useEffect(() => {
    const fetchAmenityTypes = async () => {
      setLoadingTypes(true);
      try {
        const data = await apiService.amenityTypes.getAll(0, 100, getAccessTokenSilently);
        const options = (data.content || []).map(type => ({
          id: type.amenityTypeName || type.amenity_types_name,
          text: type.amenityTypeName || type.amenity_types_name,
        }));
        setAmenityTypes(options);
      } catch (err) {
        console.error('Error fetching amenity types:', err);
        setSaveError('Failed to load amenity types');
      } finally {
        setLoadingTypes(false);
      }
    };
    fetchAmenityTypes();
  }, [getAccessTokenSilently]);

  // Field validation function
  const validateField = (fieldName, value) => {
    switch (fieldName) {
      case 'amenityCode':
        if (!value || value.trim() === '') {
          return 'Amenity code is required';
        }
        if (value.length < 2) {
          return 'Amenity code must be at least 2 characters';
        }
        if (value.length > 50) {
          return 'Amenity code must be less than 50 characters';
        }
        return '';
      
      case 'amenityDescription':
        if (!value || value.trim() === '') {
          return 'Amenity description is required';
        }
        if (value.length < 10) {
          return 'Amenity description must be at least 10 characters';
        }
        if (value.length > 500) {
          return 'Amenity description must be less than 500 characters';
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

  // Form validation
  const validateForm = () => {
    const errors = {
      amenityCode: validateField('amenityCode', amenity.amenityCode),
      amenityDescription: validateField('amenityDescription', amenity.amenityDescription),
      amenityType: validateField('amenityType', amenity.amenityType),
    };
    
    setFieldErrors(errors);
    return !Object.values(errors).some(error => error !== '');
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setAmenity(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Check for changes
    const newHasChanges = value !== initialFormState[name];
    setHasChanges(newHasChanges);
  };

  // Handle dropdown changes
  const handleDropdownChange = ({ selectedItem }) => {
    const value = selectedItem ? selectedItem.id : '';
    setAmenity(prev => ({ ...prev, amenityType: value }));
    
    // Clear field error when user selects an option
    if (fieldErrors.amenityType) {
      setFieldErrors(prev => ({ ...prev, amenityType: '' }));
    }
    
    // Check for changes
    const newHasChanges = value !== initialFormState.amenityType;
    setHasChanges(newHasChanges);
  };

  // Handle form submission
  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    
    try {
      console.log('=== CREATING AMENITY ===');
      console.log('Amenity Code:', amenity.amenityCode);
      console.log('Amenity Description:', amenity.amenityDescription);
      console.log('Amenity Type:', amenity.amenityType);
      console.log('=== END AMENITY DATA ===');
      
      await apiService.amenities.create(amenity, getAccessTokenSilently);
      
      setSaveSuccess('Amenity created successfully!');
      setHasChanges(false);
      
      // Navigate back to amenities list after a short delay
      setTimeout(() => {
        navigate('/amenities');
      }, 1500);
      
    } catch (err) {
      console.error('Error creating amenity:', err);
      setSaveError(err.message || 'Failed to create amenity');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel button click
  const handleCancelClick = () => {
    if (hasChanges) {
      setShowCancelModal(true);
    } else {
      navigate('/amenities');
    }
  };

  // Handle cancel confirmation
  const handleCancelConfirm = () => {
    setShowCancelModal(false);
    navigate('/amenities');
  };

  // Handle cancel modal close
  const handleCancelClose = () => {
    setShowCancelModal(false);
  };

  // Check if form is valid
  const isFormValid = () => {
    return amenity.amenityCode.trim() !== '' &&
           amenity.amenityDescription.trim() !== '' &&
           amenity.amenityType.trim() !== '' &&
           Object.values(fieldErrors).every(error => error === '');
  };

  if (loadingTypes) {
    return (
      <div className="loading-container">
        <Loading description="Loading amenity types..." withOverlay={false} />
      </div>
    );
  }

  return (
    <div className="amenity-form-container">
      {/* Header Section */}
      <div className="header-section">
        <div className="header-content">
          <div className="header-text">
            <Link to="/" className="back-button">
              <Home size={14} className="back-icon" />
              Back to Home
            </Link>
            <h1 className="header-title">Hotel Amenities</h1>
            <p className="header-subtitle">View and manage your hotel amenities and their availability status</p>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="form-section">
        <div className="form-container">
          <Form onSubmit={handleSave} className="amenity-form">
            {/* Notifications */}
            {saveError && (
              <InlineNotification
                kind="error"
                title="Error"
                subtitle={saveError}
                onCloseButtonClick={() => setSaveError(null)}
                lowContrast={true}
                className="notification"
              />
            )}
            {saveSuccess && (
              <InlineNotification
                kind="success"
                title="Success"
                subtitle={saveSuccess}
                onCloseButtonClick={() => setSaveSuccess(null)}
                lowContrast={true}
                className="notification"
              />
            )}

            {/* Form Fields */}
            <Grid fullWidth className="form-grid">
              <Column lg={8} md={8} sm={4} className="form-column">
                <Stack gap={6} className="form-stack">
                  
                  {/* Amenity Code */}
                  <div className="form-field">
                    <TextInput
                      id="amenityCode"
                      name="amenityCode"
                      labelText="Amenity Code *"
                      placeholder="Enter amenity code (e.g., WIFI, POOL, GYM)"
                      value={amenity.amenityCode}
                      onChange={handleChange}
                      invalid={!!fieldErrors.amenityCode}
                      invalidText={fieldErrors.amenityCode}
                      className="form-input"
                      maxLength={50}
                    />
                  </div>

                  {/* Amenity Type */}
                  <div className="form-field">
                    <Dropdown
                      id="amenityType"
                      titleText="Amenity Type *"
                      label="Select amenity type"
                      items={amenityTypes}
                      itemToString={item => (item ? item.text : '')}
                      selectedItem={amenityTypes.find(opt => opt.id === amenity.amenityType) || null}
                      onChange={handleDropdownChange}
                      invalid={!!fieldErrors.amenityType}
                      invalidText={fieldErrors.amenityType}
                      className="form-dropdown"
                    />
                  </div>

                  {/* Amenity Description */}
                  <div className="form-field">
                    <TextArea
                      id="amenityDescription"
                      name="amenityDescription"
                      labelText="Amenity Description *"
                      placeholder="Enter a detailed description of the amenity"
                      value={amenity.amenityDescription}
                      onChange={handleChange}
                      invalid={!!fieldErrors.amenityDescription}
                      invalidText={fieldErrors.amenityDescription}
                      className="form-textarea"
                      maxCount={500}
                      enableCounter={true}
                      rows={4}
                    />
                  </div>

                </Stack>
              </Column>
            </Grid>

            {/* Action Buttons */}
            <div className="action-buttons">
              <Button
                kind="secondary"
                renderIcon={Close}
                onClick={handleCancelClick}
                className="cancel-button"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                kind="primary"
                renderIcon={Save}
                type="submit"
                className="save-button"
                disabled={!isFormValid() || isSaving}
              >
                {isSaving ? 'Creating...' : 'Create Amenity'}
              </Button>
            </div>
          </Form>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <Modal
        open={showCancelModal}
        modalHeading="Discard Changes?"
        primaryButtonText="Discard"
        secondaryButtonText="Keep Editing"
        onRequestClose={handleCancelClose}
        onRequestSubmit={handleCancelConfirm}
        danger
        className="cancel-modal"
      >
        <p>You have unsaved changes. Are you sure you want to discard them?</p>
      </Modal>
    </div>
  );
}

export default AmenityNewForm;
