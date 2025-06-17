import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form, TextInput, NumberInput, Button, InlineNotification, Loading
} from '@carbon/react';
import { getApiBaseUrl } from '../services/config';

function RoomNewForm() {
  const { hotelId } = useParams();
  const navigate = useNavigate();
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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
      const baseUrl = getApiBaseUrl();
      console.log('Submitting', formData);
      const response = await fetch(`${baseUrl}/api/rooms/${hotelId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Could not create room');
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
        <TextInput id="roomType" name="roomType" labelText="Room Type" value={formData.roomType} onChange={handleChange} style={{ marginBottom: 16 }} />
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
          <Button kind="primary" type="submit" disabled={saving} loading={saving}>Create</Button>
        </div>
      </Form>
    </div>
  );
}

export default RoomNewForm; 