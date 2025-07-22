import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form,
  FormLabel,
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
import RoleAssignmentField from './RoleAssignmentField';
import './UserEditForm.css';

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
  
  // New state for current user
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Load current user data
    const loadCurrentUser = async () => {
      try {
        const response = await authenticatedFetch('/users/me');
        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData);
        }
      } catch (err) {
        console.error('Error loading current user:', err);
      }
    };
    
    loadCurrentUser();
  }, [authenticatedFetch]);

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

  const handleRolesChange = (newRoles) => {
    // Handle role changes if needed in the future
    console.log('Roles updated:', newRoles);
  };

  return (
    <div className="user-edit-form-container">
      <div className="user-edit-form-content">
        {/* Header Navigation */}
        <div className="header-navigation">
          <Button 
            kind="tertiary" 
            onClick={() => navigate("/users")}
            className="nav-button back-button"
          >
            <span className="nav-icon">←</span>
            Back to Users
          </Button>
          <h1 className="page-title">Edit User</h1>
        </div>
        
        {loading ? (
          <Loading active description="Loading user..." />
        ) : (
          <>
            <Form onSubmit={handleSubmit}>
              {/* User Information Card */}
              <div className="section-card">
                <div className="section-header">
                  <h2 className="section-title">User Information</h2>
                </div>
                <div className="section-content">
                  <div className="form-row three-columns">
                    <div className="form-field">
                      <FormLabel className="field-label" htmlFor="username">
                        Username <span className="required-mark">*</span>
                      </FormLabel>
                      <TextInput
                        id="username"
                        name="username"
                        labelText=""
                        placeholder="Enter username"
                        value={form.username}
                        onChange={handleChange}
                        required
                        className="form-input"
                      />
                    </div>
                    <div className="form-field">
                      <FormLabel className="field-label" htmlFor="email">
                        Email <span className="required-mark">*</span>
                      </FormLabel>
                      <TextInput
                        id="email"
                        name="email"
                        labelText=""
                        placeholder="Enter email address"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className="form-input"
                      />
                    </div>
                    <div className="form-field">
                      <FormLabel className="field-label" htmlFor="auth0Id">
                        Auth0 ID
                      </FormLabel>
                      <TextInput
                        id="auth0Id"
                        name="auth0Id"
                        labelText=""
                        placeholder="Auth0 identifier"
                        value={form.auth0Id}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row two-columns">
                    <div className="form-field">
                      <FormLabel className="field-label" htmlFor="firstName">
                        First Name
                      </FormLabel>
                      <TextInput
                        id="firstName"
                        name="firstName"
                        labelText=""
                        placeholder="Enter first name"
                        value={form.firstName}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
                    <div className="form-field">
                      <FormLabel className="field-label" htmlFor="lastName">
                        Last Name
                      </FormLabel>
                      <TextInput
                        id="lastName"
                        name="lastName"
                        labelText=""
                        placeholder="Enter last name"
                        value={form.lastName}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row full-width">
                    <div className="form-field">
                      <div className="form-checkbox">
                        <Checkbox
                          id="isActive"
                          name="isActive"
                          labelText="Active"
                          checked={form.isActive}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {error && <InlineNotification kind="error" title="Error" subtitle={error} style={{ marginBottom: '1rem' }} />}
              {success && <InlineNotification kind="success" title="Success" subtitle={success} style={{ marginBottom: '1rem' }} />}
              <div style={buttonContainerStyle}>
                <Button kind="secondary" onClick={handleCancel} type="button">Cancel</Button>
                <Button kind="primary" type="submit" disabled={saving}>Save</Button>
              </div>
            </Form>
            
            {/* Role Assignment Section - Only show for existing users */}
            {id && currentUser && (
              <RoleAssignmentField 
                currentUser={currentUser}
                targetUser={{ userId: parseInt(id) }}
                onRolesChange={handleRolesChange}
              />
            )}
          </>
        )}
      </div>
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