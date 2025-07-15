import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form, TextInput, NumberInput, Button, InlineNotification, Loading, Dropdown
} from '@carbon/react';
import { apiService } from '../services/apiService';
import { useAuth0 } from '@auth0/auth0-react';

function RoomNewForm() {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();
  const [formData, setFormData] = useState({
    roomNumber: '',
    roomType: '',
    roomFloor: '',
    roomPrice: '',
    roomName: '',
    roomDescription: '',
    roomBuildingName: '',
    roomBuildingCode: '',
    roomXCoordinates: '',
    roomYCoordinates: '',
  });
  
  // Individual field error states
  const [fieldErrors, setFieldErrors] = useState({});
  
  const [roomTypeOptions, setRoomTypeOptions] = useState([]);
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    async function fetchRoomTypes() {
      setLoadingRoomTypes(true);
      try {
        const data = await apiService.roomTypes.getAll(0, 100, getAccessTokenSilently);
        const items = (data.content || data || []).map(type => ({
          id: type.roomTypeName || type.room_types_name,
          text: type.roomTypeName || type.room_types_name
        }));
        setRoomTypeOptions(items);
      } catch {
        setRoomTypeOptions([]);
      } finally {
        setLoadingRoomTypes(false);
      }
    }
    fetchRoomTypes();
  }, [getAccessTokenSilently]);

  // Validate all required fields
  const validateRequiredFields = () => {
    const errors = {};

    if (!formData.roomNumber.trim()) errors.roomNumber = "Room number is required.";
    if (isNaN(formData.roomNumber) || parseInt(formData.roomNumber) <= 0) errors.roomNumber = "Room number must be a valid positive number.";
    
    if (!formData.roomType.trim()) errors.roomType = "Room type is required.";
    
    if (!formData.roomFloor || formData.roomFloor === '') errors.roomFloor = "Floor is required.";
    if (isNaN(formData.roomFloor) || parseInt(formData.roomFloor) < 0) errors.roomFloor = "Floor must be a valid positive number.";
    
    if (!formData.roomPrice.trim()) errors.roomPrice = "Price is required.";
    if (isNaN(formData.roomPrice) || parseFloat(formData.roomPrice) <= 0) errors.roomPrice = "Price must be a valid positive number.";
    
    if (!formData.roomName.trim()) errors.roomName = "Room name is required.";
    if (formData.roomName.length < 2) errors.roomName = "Room name must have at least 2 characters.";
    
    if (!formData.roomDescription.trim()) errors.roomDescription = "Description is required.";
    if (formData.roomDescription.length < 5) errors.roomDescription = "Description must have at least 5 characters.";
    
    if (!formData.roomBuildingName.trim()) errors.roomBuildingName = "Building name is required.";
    if (formData.roomBuildingName.length < 2) errors.roomBuildingName = "Building name must have at least 2 characters.";
    
    if (!formData.roomBuildingCode.trim()) errors.roomBuildingCode = "Building code is required.";
    if (formData.roomBuildingCode.length < 1) errors.roomBuildingCode = "Building code must have at least 1 character.";
    
    if (!formData.roomXCoordinates.trim()) errors.roomXCoordinates = "X coordinates are required.";
    if (formData.roomXCoordinates.length > 250) errors.roomXCoordinates = "X coordinates cannot exceed 250 characters.";
    
    if (!formData.roomYCoordinates.trim()) errors.roomYCoordinates = "Y coordinates are required.";
    if (formData.roomYCoordinates.length > 250) errors.roomYCoordinates = "Y coordinates cannot exceed 250 characters.";

    return errors;
  };

  const handleBlur = (field) => {
    const errors = validateRequiredFields();
    setFieldErrors(prev => ({ ...prev, [field]: errors[field] }));
  };

  // Check if the form is valid to enable the save button
  const isFormValid = () => {
    const errors = validateRequiredFields();
    return Object.keys(errors).length === 0;
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    }
    
    setFeedback({ type: '', message: '' });
  };

  // Handle number input changes
  const handleNumberChange = (fieldName) => (_, { value }) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear error when user starts typing
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => ({ ...prev, [fieldName]: undefined }));
    }
    
    setFeedback({ type: '', message: '' });
  };

  // Handle dropdown changes
  const handleDropdownChange = ({ selectedItem }) => {
    const selectedValue = selectedItem ? selectedItem.text : '';
    setFormData(prev => ({ ...prev, roomType: selectedValue }));
    
    // Clear error when user selects an option
    if (fieldErrors.roomType) {
      setFieldErrors(prev => ({ ...prev, roomType: undefined }));
    }
    
    setFeedback({ type: '', message: '' });
  };

  // Save new room
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

    setSaving(true);
    
    try {
      console.log('Submitting', formData);
      await apiService.roomUnits.create(hotelId, formData, getAccessTokenSilently);
      setFeedback({ type: 'success', message: 'Room created successfully!' });
      setTimeout(() => navigate(-1), 1200);
    } catch (err) {
      console.error('Error creating room:', err);
      setFeedback({ type: 'error', message: err.message || 'Error creating room' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', background: '#fff', padding: 24, borderRadius: 8 }}>
      <h2>Create New Room</h2>
      
      {feedback.message && (
        <InlineNotification
          kind={feedback.type === 'error' ? 'error' : 'success'}
          title={feedback.type === 'error' ? 'Error' : 'Success'}
          subtitle={feedback.message}
          onCloseButtonClick={() => setFeedback({ type: '', message: '' })}
          lowContrast
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Form onSubmit={handleSubmit}>
        <TextInput 
          id="roomNumber" 
          name="roomNumber" 
          labelText="Room Number *" 
          value={formData.roomNumber} 
          onChange={handleChange} 
          onBlur={() => handleBlur('roomNumber')}
          invalid={!!fieldErrors.roomNumber}
          invalidText={fieldErrors.roomNumber}
          required 
          placeholder="Enter room number"
          style={{ marginBottom: 16 }} 
        />
        <Dropdown
          id="roomType"
          titleText="Room Type *"
          label="Select Room Type"
          items={roomTypeOptions}
          itemToString={item => (item ? item.text : '')}
          value={roomTypeOptions.find(opt => opt.id === formData.roomType) || null}
          selectedItem={roomTypeOptions.find(opt => opt.id === formData.roomType) || null}
          onChange={handleDropdownChange}
          onBlur={() => handleBlur('roomType')}
          disabled={loadingRoomTypes}
          required
          invalid={!!fieldErrors.roomType}
          invalidText={fieldErrors.roomType}
          placeholder="Select room type"
          style={{ marginBottom: 16 }}
        />
        <NumberInput 
          id="roomFloor" 
          name="roomFloor" 
          label="Floor *" 
          value={formData.roomFloor} 
          onChange={handleNumberChange('roomFloor')} 
          onBlur={() => handleBlur('roomFloor')}
          required
          invalid={!!fieldErrors.roomFloor}
          invalidText={fieldErrors.roomFloor}
          placeholder="Enter floor number"
          style={{ marginBottom: 16 }} 
        />
        <TextInput 
          id="roomPrice" 
          name="roomPrice" 
          labelText="Price *" 
          value={formData.roomPrice} 
          onChange={handleChange} 
          onBlur={() => handleBlur('roomPrice')}
          required
          invalid={!!fieldErrors.roomPrice}
          invalidText={fieldErrors.roomPrice}
          placeholder="Enter room price"
          style={{ marginBottom: 16 }} 
        />
        <TextInput 
          id="roomName" 
          name="roomName" 
          labelText="Room Name *" 
          value={formData.roomName} 
          onChange={handleChange} 
          onBlur={() => handleBlur('roomName')}
          required
          invalid={!!fieldErrors.roomName}
          invalidText={fieldErrors.roomName}
          placeholder="Enter room name"
          style={{ marginBottom: 16 }} 
        />
        <TextInput 
          id="roomDescription" 
          name="roomDescription" 
          labelText="Description *" 
          value={formData.roomDescription} 
          onChange={handleChange} 
          onBlur={() => handleBlur('roomDescription')}
          required
          invalid={!!fieldErrors.roomDescription}
          invalidText={fieldErrors.roomDescription}
          placeholder="Enter room description"
          style={{ marginBottom: 16 }} 
        />
        <TextInput 
          id="roomBuildingName" 
          name="roomBuildingName" 
          labelText="Building Name *" 
          value={formData.roomBuildingName} 
          onChange={handleChange} 
          onBlur={() => handleBlur('roomBuildingName')}
          required
          invalid={!!fieldErrors.roomBuildingName}
          invalidText={fieldErrors.roomBuildingName}
          placeholder="Enter building name"
          style={{ marginBottom: 16 }} 
        />
        <TextInput 
          id="roomBuildingCode" 
          name="roomBuildingCode" 
          labelText="Building Code *" 
          value={formData.roomBuildingCode} 
          onChange={handleChange} 
          onBlur={() => handleBlur('roomBuildingCode')}
          required
          invalid={!!fieldErrors.roomBuildingCode}
          invalidText={fieldErrors.roomBuildingCode}
          placeholder="Enter building code"
          style={{ marginBottom: 16 }} 
        />
        <TextInput 
          id="roomXCoordinates" 
          name="roomXCoordinates" 
          labelText="X Coordinates *" 
          value={formData.roomXCoordinates} 
          onChange={handleChange} 
          onBlur={() => handleBlur('roomXCoordinates')}
          required
          invalid={!!fieldErrors.roomXCoordinates}
          invalidText={fieldErrors.roomXCoordinates}
          placeholder="Enter X coordinates"
          style={{ marginBottom: 16 }} 
        />
        <TextInput 
          id="roomYCoordinates" 
          name="roomYCoordinates" 
          labelText="Y Coordinates *" 
          value={formData.roomYCoordinates} 
          onChange={handleChange} 
          onBlur={() => handleBlur('roomYCoordinates')}
          required
          invalid={!!fieldErrors.roomYCoordinates}
          invalidText={fieldErrors.roomYCoordinates}
          placeholder="Enter Y coordinates"
          style={{ marginBottom: 16 }} 
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button kind="secondary" type="button" onClick={() => navigate(-1)} disabled={saving}>Cancel</Button>
          <Button kind="primary" type="submit" disabled={saving || !isFormValid()}>Create</Button>
        </div>
      </Form>
    </div>
  );
}

export default RoomNewForm; 