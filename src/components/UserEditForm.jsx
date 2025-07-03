import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form,
  TextInput,
  Button,
  InlineNotification,
  Loading,
  Checkbox,
  ComposedModal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@carbon/react';
import { useAuthenticatedFetch } from '../services/apiService';
import UserHotelRolesManager from './UserHotelRolesManager';

const formContainerStyle = {
  padding: '2rem',
  maxWidth: '600px',
  minWidth: '350px',
  margin: '2rem auto',
  backgroundColor: '#fff',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
};
const buttonContainerStyle = {
  marginTop: '2rem',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '1rem',
};

function UserEditForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const authenticatedFetch = useAuthenticatedFetch();

  const [form, setForm] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    isActive: true,
    auth0Id: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [initialForm, setInitialForm] = useState(null);
  const [openCancelModal, setOpenCancelModal] = useState(false);

  useEffect(() => {
    if (!id) {
      // Modo crear nuevo usuario
      setForm({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        isActive: true,
        auth0Id: '',
      });
      setInitialForm({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        isActive: true,
        auth0Id: '',
      });
      setLoading(false);
      return;
    }
    // Modo edición
    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await authenticatedFetch(`/users/${id}`);
        if (!response.ok) throw new Error('Could not fetch user');
        const data = await response.json();
        const loadedForm = {
          username: data.username || '',
          email: data.email || '',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          isActive: data.isActive ?? true,
          auth0Id: data.auth0Id || '',
        };
        setForm(loadedForm);
        setInitialForm(loadedForm);
      } catch (err) {
        setError(err.message || 'Could not load user data.');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, authenticatedFetch]);

  const isFormChanged = initialForm && (
    form.username !== initialForm.username ||
    form.email !== initialForm.email ||
    form.firstName !== initialForm.firstName ||
    form.lastName !== initialForm.lastName ||
    form.isActive !== initialForm.isActive ||
    form.auth0Id !== initialForm.auth0Id
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      let response;
      if (!id) {
        // Crear nuevo usuario
        response = await authenticatedFetch(`/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else {
        // Editar usuario existente
        response = await authenticatedFetch(`/users/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${response.statusText || (!id ? 'Could not create user' : 'Could not update user')}. Body: ${errorBody}`);
      }
      setSuccess(!id ? 'User created successfully.' : 'User updated successfully.');
      setTimeout(() => navigate('/users'), 1200);
    } catch (err) {
      setError(err.message || (!id ? 'Could not create user.' : 'Could not update user.'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isFormChanged) {
      setOpenCancelModal(true);
    } else {
      navigate('/users');
    }
  };

  const proceedWithCancel = () => {
    setOpenCancelModal(false);
    navigate('/users');
  };

  const closeModal = () => setOpenCancelModal(false);

  return (
    <div style={formContainerStyle}>
      <h2 style={{ color: '#3751ff', marginBottom: '1.5rem', textAlign: 'center' }}>Edit User</h2>
      {loading ? (
        <Loading active description="Loading user..." />
      ) : (
        <>
          <Form onSubmit={handleSubmit}>
            <TextInput
              id="username"
              name="username"
              labelText="Username"
              value={form.username}
              onChange={handleChange}
              required
              style={{ marginBottom: '1rem' }}
            />
            <TextInput
              id="email"
              name="email"
              labelText="Email"
              value={form.email}
              onChange={handleChange}
              required
              style={{ marginBottom: '1rem' }}
            />
            <TextInput
              id="firstName"
              name="firstName"
              labelText="First Name"
              value={form.firstName}
              onChange={handleChange}
              style={{ marginBottom: '1rem' }}
            />
            <TextInput
              id="lastName"
              name="lastName"
              labelText="Last Name"
              value={form.lastName}
              onChange={handleChange}
              style={{ marginBottom: '1rem' }}
            />
            <TextInput
              id="auth0Id"
              name="auth0Id"
              labelText="Auth0 ID"
              value={form.auth0Id}
              onChange={handleChange}
              style={{ marginBottom: '1rem' }}
            />
            <Checkbox
              id="isActive"
              name="isActive"
              labelText="Active"
              checked={form.isActive}
              onChange={handleChange}
              style={{ marginBottom: '1rem' }}
            />
            {error && <InlineNotification kind="error" title="Error" subtitle={error} style={{ marginBottom: '1rem' }} />}
            {success && <InlineNotification kind="success" title="Success" subtitle={success} style={{ marginBottom: '1rem' }} />}
            <div style={buttonContainerStyle}>
              <Button kind="secondary" onClick={handleCancel} type="button">Cancel</Button>
              <Button kind="primary" type="submit" disabled={saving}>Save</Button>
            </div>
          </Form>
          {id && (
            <div style={{ marginTop: '2.5rem' }}>
              <UserHotelRolesManager userId={id} />
            </div>
          )}
        </>
      )}
      {openCancelModal && (
        <ComposedModal open={openCancelModal} onClose={closeModal} preventCloseOnClickOutside={false} size="sm">
          <ModalHeader title="Discard Changes?" closeModal={closeModal} />
          <ModalBody>
            <p style={{ marginBottom: '1rem' }}>Any unsaved changes will be lost and you will be navigated away.</p>
            <p>Are you sure you want to cancel?</p>
          </ModalBody>
          <ModalFooter>
            <Button kind="secondary" onClick={closeModal}>No</Button>
            <Button kind="primary" onClick={proceedWithCancel}>Yes, Cancel</Button>
          </ModalFooter>
        </ComposedModal>
      )}
    </div>
  );
}

export default UserEditForm; 