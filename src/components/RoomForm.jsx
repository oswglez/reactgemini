// src/components/RoomForm.jsx
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
} from '@carbon/react';

// Initial state
const initialRoomState = {
  roomNumber: '',
  roomType: '',
  roomName: '',
  building: '',
  floor: '',
  price: '',
};

function RoomForm() {
  const { hotelId } = useParams();
  const [formData, setFormData] = useState(initialRoomState);
  
  // Individual field error states
  const [fieldErrors, setFieldErrors] = useState({});
  
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // State for dynamic dropdown options
  const [roomTypeOptions, setRoomTypeOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState(null);

  // useEffect to load RoomType options
  useEffect(() => {
    const fetchRoomTypes = async () => {
      setLoadingOptions(true);
      setOptionsError(null);
      try {
        const response = await fetch('http://localhost:8090/api/roomType');
        if (!response.ok) {
          throw new Error(
            `Error ${response.status}: Could not load room types`
          );
        }
        const data = await response.json();
        const options = (data || []).map((type) => ({
          id: type.roomTypeName,
          text: type.roomTypeName,
        }));
        console.log('Mapped RoomType Options:', options);
        setRoomTypeOptions(options);
      } catch (err) {
        console.error('Error fetching room types:', err);
        setOptionsError(err.message || 'Failed to load options');
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchRoomTypes();
  }, []);

  // Validate all required fields
  const validateRequiredFields = () => {
    const errors = {};

    if (!formData.roomNumber.trim()) errors.roomNumber = "Room number is required.";
    if (isNaN(formData.roomNumber) || parseInt(formData.roomNumber) <= 0) errors.roomNumber = "Room number must be a valid positive number.";
    
    if (!formData.roomType.trim()) errors.roomType = "Room type is required.";
    
    if (!formData.roomName.trim()) errors.roomName = "Room name is required.";
    if (formData.roomName.length < 2) errors.roomName = "Room name must have at least 2 characters.";
    
    if (!formData.building.trim()) errors.building = "Building is required.";
    if (formData.building.length < 2) errors.building = "Building name must have at least 2 characters.";
    
    if (!formData.floor || formData.floor === '') errors.floor = "Floor is required.";
    if (isNaN(formData.floor) || parseInt(formData.floor) < 0) errors.floor = "Floor must be a valid positive number.";
    
    if (!formData.price || formData.price === '') errors.price = "Price is required.";
    if (isNaN(formData.price) || parseFloat(formData.price) <= 0) errors.price = "Price must be a valid positive number.";

    return errors;
  };

  const handleBlur = (field) => {
    const errors = validateRequiredFields();
    setFieldErrors(prev => ({ ...prev, [field]: errors[field] }));
  };

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    }
    
    setFeedback({ type: '', message: '' });
  };

  const handleDropdownChange = (field, { selectedItem }) => {
    const value = selectedItem ? selectedItem.id : '';
    console.log(`Dropdown Change: Field=${field}, SelectedID=${value}`);
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear error when user selects an option
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    setFeedback({ type: '', message: '' });
  };

  const handleNumberInputChange = (fieldName, valueAsString) => {
    setFormData((prev) => ({ ...prev, [fieldName]: valueAsString }));
    
    // Clear error when user starts typing
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => ({ ...prev, [fieldName]: undefined }));
    }
    
    setFeedback({ type: '', message: '' });
  };

  // Check if the form is valid to enable the save button
  const isFormValid = () => {
    const errors = validateRequiredFields();
    return Object.keys(errors).length === 0;
  };

  // Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    const errors = validateRequiredFields();
    if (Object.keys(errors).length > 0) {
      // Only show the first error (top-down)
      const firstErrorKey = Object.keys(errors)[0];
      setFieldErrors(errors);
      setFeedback({ type: 'error', message: errors[firstErrorKey] });
      // Focus and scroll to the first error field
      setTimeout(() => {
        const el = document.getElementById(firstErrorKey);
        if (el) el.focus();
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8090/api/hotels/${hotelId}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Failed to create room`);
      }

      // Reset form after successful submission
      setFormData(initialRoomState);
      setFieldErrors({});
      setFeedback({ type: 'success', message: 'Room created successfully!' });
      
      // Optionally navigate back or show success message
      console.log('Room created successfully');
    } catch (err) {
      console.error('Error creating room:', err);
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Pre-calculate the selected item for the dropdown
  const currentRoomTypeSelectedItem =
    roomTypeOptions.find((item) => item.id === formData.roomType) || null;

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

      {optionsError && (
        <InlineNotification
          kind="error"
          title="Error loading options"
          subtitle={optionsError}
          lowContrast
          style={{ marginBottom: '1rem' }}
        />
      )}

      {feedback.message && (
        <InlineNotification
          kind={feedback.type === 'error' ? 'error' : 'success'}
          title={feedback.type === 'error' ? 'Error' : 'Success'}
          subtitle={feedback.message}
          onCloseButtonClick={() => setFeedback({ type: '', message: '' })}
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
                labelText="Room Number *"
                min={1}
                step={1}
                value={formData.roomNumber}
                onChange={(e, { value }) =>
                  handleNumberInputChange('roomNumber', String(value))
                }
                onBlur={() => handleBlur('roomNumber')}
                invalid={!!fieldErrors.roomNumber}
                invalidText={fieldErrors.roomNumber}
                allowEmpty={false}
                placeholder="Enter room number"
                light
              />
              <Dropdown
                id="roomType"
                name="roomType"
                titleText="Room Type *"
                label={loadingOptions ? 'Loading types...' : 'Select a type'}
                items={roomTypeOptions}
                itemToString={(item) => (item ? item.text : '')}
                onChange={({ selectedItem }) =>
                  handleDropdownChange('roomType', { selectedItem })
                }
                onBlur={() => handleBlur('roomType')}
                selectedItem={currentRoomTypeSelectedItem}
                invalid={!!fieldErrors.roomType}
                invalidText={fieldErrors.roomType}
                disabled={loadingOptions || !!optionsError}
                placeholder="Select room type"
                light
              />
              <TextInput
                id="roomName"
                name="roomName"
                labelText="Room Name *"
                value={formData.roomName}
                onChange={handleChange}
                onBlur={() => handleBlur('roomName')}
                invalid={!!fieldErrors.roomName}
                invalidText={fieldErrors.roomName}
                placeholder="Enter room name"
                light
              />
            </FormGroup>
          </Column>

          {/* Column 2 */}
          <Column lg={8} md={6} sm={4}>
            <FormGroup legendText="Location and Price">
              <TextInput
                id="building"
                name="building"
                labelText="Building *"
                value={formData.building}
                onChange={handleChange}
                onBlur={() => handleBlur('building')}
                invalid={!!fieldErrors.building}
                invalidText={fieldErrors.building}
                placeholder="Enter building name"
                light
              />
              <NumberInput
                id="floor"
                name="floor"
                labelText="Floor *"
                min={0}
                step={1}
                value={formData.floor}
                onChange={(e, { value }) =>
                  handleNumberInputChange('floor', String(value))
                }
                onBlur={() => handleBlur('floor')}
                invalid={!!fieldErrors.floor}
                invalidText={fieldErrors.floor}
                allowEmpty={false}
                placeholder="Enter floor number"
                light
              />
              <NumberInput
                id="price"
                name="price"
                labelText="Price *"
                min={0}
                step={0.01}
                value={formData.price}
                onChange={(e, { value }) =>
                  handleNumberInputChange('price', String(value))
                }
                onBlur={() => handleBlur('price')}
                invalid={!!fieldErrors.price}
                invalidText={fieldErrors.price}
                allowEmpty={false}
                placeholder="Enter room price"
                light
              />
            </FormGroup>
          </Column>

          {/* Submission Area */}
          <Column lg={16} md={8} sm={4} style={{ marginTop: '2rem' }}>
            <Button
              type="submit"
              disabled={loading || loadingOptions || !!optionsError || !isFormValid()}
            >
              {loading ? 'Saving...' : 'Save and Add Next Room'}
            </Button>
          </Column>
        </Grid>
      </Form>
    </div>
  );
}

export default RoomForm;
