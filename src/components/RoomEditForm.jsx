import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form, TextInput, NumberInput, Button, InlineNotification, Loading, Modal
} from '@carbon/react';
import { getApiBaseUrl } from '../services/config';

function RoomEditForm() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    roomNumber: '',
    roomType: '',
    roomFloor: 0,
    roomPrice: '',
    roomName: '',
    roomDescription: '',
    roomBuildingName: '',
    roomBuildingCode: '',
    roomXCoordinates: '',
    roomYCoordinates: '',
  });
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openCancelModal, setOpenCancelModal] = useState(false);

  // Cargar datos de la habitación
  useEffect(() => {
    async function fetchRoom() {
      setLoading(true);
      setError(null);
      try {
        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}/api/rooms/${roomId}`);
        if (!response.ok) throw new Error('Could not fetch room data');
        const data = await response.json();
        setFormData({
          roomNumber: data.roomNumber || '',
          roomType: data.roomType || '',
          roomFloor: data.roomFloor !== undefined && data.roomFloor !== null ? data.roomFloor : 0,
          roomPrice: data.roomPrice || '',
          roomName: data.roomName || '',
          roomDescription: data.roomDescription || '',
          roomBuildingName: data.roomBuildingName || '',
          roomBuildingCode: data.roomBuildingCode || '',
          roomXCoordinates: data.roomXCoordinates || '',
          roomYCoordinates: data.roomYCoordinates || '',
        });
        setOriginalData(data);
      } catch (err) {
        setError(err.message || 'Error loading room data');
      } finally {
        setLoading(false);
      }
    }
    fetchRoom();
  }, [roomId]);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Guardar cambios
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting', formData);
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Could not update room');
      setSuccess('Room updated successfully!');
      setTimeout(() => navigate(-1), 1200);
    } catch (err) {
      setError(err.message || 'Error updating room');
    } finally {
      setSaving(false);
    }
  };

  const isDirty = JSON.stringify(formData) !== JSON.stringify(originalData);

  if (loading) return <Loading description="Loading room data..." withOverlay={false} />;

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', background: '#fff', padding: 24, borderRadius: 8 }}>
      <h2>Edit Room</h2>
      {error && <InlineNotification kind="error" title="Error" subtitle={error} style={{ marginBottom: 16 }} />}
      {success && <InlineNotification kind="success" title="Success" subtitle={success} style={{ marginBottom: 16 }} />}
      <Form onSubmit={handleSubmit}>
        <TextInput id="roomNumber" name="roomNumber" labelText="Room Number" value={formData.roomNumber} onChange={handleChange} required style={{ marginBottom: 16 }} />
        <TextInput id="roomType" name="roomType" labelText="Room Type" value={formData.roomType} onChange={handleChange} style={{ marginBottom: 16 }} />
        <NumberInput
          id="roomFloor"
          name="roomFloor"
          label="Floor"
          value={formData.roomFloor}
          onChange={(_, { value }) => setFormData(prev => ({ ...prev, roomFloor: value }))}
          style={{ marginBottom: 16 }}
        />
        <TextInput id="roomPrice" name="roomPrice" labelText="Price" value={formData.roomPrice} onChange={handleChange} style={{ marginBottom: 16 }} />
        <TextInput id="roomName" name="roomName" labelText="Room Name" value={formData.roomName} onChange={handleChange} style={{ marginBottom: 16 }} />
        <TextInput id="roomDescription" name="roomDescription" labelText="Description" value={formData.roomDescription} onChange={handleChange} style={{ marginBottom: 16 }} />
        <TextInput id="roomBuildingName" name="roomBuildingName" labelText="Building Name" value={formData.roomBuildingName} onChange={handleChange} style={{ marginBottom: 16 }} />
        <TextInput id="roomBuildingCode" name="roomBuildingCode" labelText="Building Code" value={formData.roomBuildingCode} onChange={handleChange} style={{ marginBottom: 16 }} />
        <TextInput id="roomXCoordinates" name="roomXCoordinates" labelText="X Coordinates" value={formData.roomXCoordinates} onChange={handleChange} style={{ marginBottom: 16 }} />
        <TextInput id="roomYCoordinates" name="roomYCoordinates" labelText="Y Coordinates" value={formData.roomYCoordinates} onChange={handleChange} style={{ marginBottom: 16 }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button
            kind="secondary"
            type="button"
            onClick={() => {
              if (isDirty) setOpenCancelModal(true);
              else navigate(-1);
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button kind="primary" type="submit" disabled={saving} loading={saving}>Save</Button>
        </div>
      </Form>
      <Modal
        open={openCancelModal}
        modalHeading="Discard changes?"
        primaryButtonText="Yes, discard"
        secondaryButtonText="No, stay"
        onRequestClose={() => setOpenCancelModal(false)}
        onRequestSubmit={() => navigate(-1)}
        danger
      >
        <p>Are you sure you want to discard your changes? This action cannot be undone.</p>
      </Modal>
    </div>
  );
}

export default RoomEditForm; 