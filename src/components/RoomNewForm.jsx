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
  const [roomTypeOptions, setRoomTypeOptions] = useState([]);
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Guardar nueva habitación
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      console.log('Submitting', formData);
      await apiService.roomUnits.create(hotelId, formData, getAccessTokenSilently);
      setSuccess('Room created successfully!');
      setTimeout(() => navigate(-1), 1200);
    } catch (err) {
      setError(err.message || 'Error creating room');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', background: '#fff', padding: 24, borderRadius: 8 }}>
      <h2>Create New Room</h2>
      {error && <InlineNotification kind="error" title="Error" subtitle={error} style={{ marginBottom: 16 }} />}
      {success && <InlineNotification kind="success" title="Success" subtitle={success} style={{ marginBottom: 16 }} />}
      <Form onSubmit={handleSubmit}>
        <TextInput id="roomNumber" name="roomNumber" labelText="Room Number" value={formData.roomNumber} onChange={handleChange} required style={{ marginBottom: 16 }} />
        <Dropdown
          id="roomType"
          titleText="Room Type"
          label="Select Room Type"
          items={roomTypeOptions}
          itemToString={item => (item ? item.text : '')}
          value={roomTypeOptions.find(opt => opt.id === formData.roomType) || null}
          selectedItem={roomTypeOptions.find(opt => opt.id === formData.roomType) || null}
          onChange={({ selectedItem }) => setFormData(prev => ({ ...prev, roomType: selectedItem ? selectedItem.text : '' }))}
          disabled={loadingRoomTypes}
          style={{ marginBottom: 16 }}
          required
        />
        <NumberInput id="roomFloor" name="roomFloor" label="Floor" value={formData.roomFloor} onChange={(_, { value }) => setFormData(prev => ({ ...prev, roomFloor: value }))} style={{ marginBottom: 16 }} />
        <TextInput id="roomPrice" name="roomPrice" labelText="Price" value={formData.roomPrice} onChange={handleChange} style={{ marginBottom: 16 }} />
        <TextInput id="roomName" name="roomName" labelText="Room Name" value={formData.roomName} onChange={handleChange} style={{ marginBottom: 16 }} />
        <TextInput id="roomDescription" name="roomDescription" labelText="Description" value={formData.roomDescription} onChange={handleChange} style={{ marginBottom: 16 }} />
        <TextInput id="roomBuildingName" name="roomBuildingName" labelText="Building Name" value={formData.roomBuildingName} onChange={handleChange} style={{ marginBottom: 16 }} />
        <TextInput id="roomBuildingCode" name="roomBuildingCode" labelText="Building Code" value={formData.roomBuildingCode} onChange={handleChange} style={{ marginBottom: 16 }} />
        <TextInput id="roomXCoordinates" name="roomXCoordinates" labelText="X Coordinates" value={formData.roomXCoordinates} onChange={handleChange} style={{ marginBottom: 16 }} />
        <TextInput id="roomYCoordinates" name="roomYCoordinates" labelText="Y Coordinates" value={formData.roomYCoordinates} onChange={handleChange} style={{ marginBottom: 16 }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button kind="secondary" type="button" onClick={() => navigate(-1)} disabled={saving}>Cancel</Button>
          <Button kind="primary" type="submit" disabled={saving}>Create</Button>
        </div>
      </Form>
    </div>
  );
}

export default RoomNewForm; 