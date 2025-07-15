import React, { useState, useEffect } from 'react';
import {
  Button,
  TextInput,
  Select,
  SelectItem,
  Checkbox,
  InlineNotification,
  Loading,
  Form,
  FormGroup,
  Stack,
  Tile
} from '@carbon/react';
import { Add, Close } from '@carbon/icons-react';
import { useAuthenticatedFetch } from '../services/apiService';

const UserNewForm = ({ onUserCreated, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [roles, setRoles] = useState([]);
  const [chains, setChains] = useState([]);
  const [brands, setBrands] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedChain, setSelectedChain] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  
  // Individual field error states
  const [fieldErrors, setFieldErrors] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    roleId: '',
    chainId: '',
    brandId: '',
    hotelId: ''
  });
  
  // State to force validation display
  const [showValidation, setShowValidation] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    auth0Id: '',
    isActive: true,
    password: '',
    roleId: null,
    chainId: null,
    brandId: null,
    hotelId: null
  });

  const authenticatedFetch = useAuthenticatedFetch();

  useEffect(() => {
    loadFormData();
  }, []);

  // Validate form whenever formData changes, but only if showValidation is true
  useEffect(() => {
    if (showValidation) {
      validateForm();
    }
  }, [formData, showValidation]);

  // Function to validate a specific field
  const validateField = (fieldName, value) => {
    switch (fieldName) {
      case 'username':
        if (!value || value.trim() === '') {
          return 'Username is required';
        }
        if (showValidation && value.trim().length < 3) {
          return 'Username must have at least 3 characters';
        }
        if (showValidation && !/^[a-zA-Z0-9_]+$/.test(value.trim())) {
          return 'Username can only contain letters, numbers, and underscores';
        }
        return '';
      case 'email': {
        if (!value || value.trim() === '') {
          return 'Email is required';
        }
        if (showValidation) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value.trim())) {
            return 'Please enter a valid email address';
          }
        }
        return '';
      }
      case 'firstName':
        if (!value || value.trim() === '') {
          return 'First name is required';
        }
        if (showValidation && value.trim().length < 2) {
          return 'First name must have at least 2 characters';
        }
        return '';
      case 'lastName':
        if (!value || value.trim() === '') {
          return 'Last name is required';
        }
        if (showValidation && value.trim().length < 2) {
          return 'Last name must have at least 2 characters';
        }
        return '';
      case 'password':
        if (!value || value.trim() === '') {
          return 'Password is required';
        }
        if (showValidation && value.trim().length < 8) {
          return 'Password must have at least 8 characters';
        }
        if (showValidation && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
        }
        return '';
      case 'roleId':
        if (!value) {
          return 'Role is required';
        }
        return '';
      case 'chainId':
        // Only validate chainId if role requires it
        if (formData.roleId) {
          const role = roles.find(r => r.roleId === formData.roleId);
          if (role) {
            const roleName = role.roleName;
            if (['CHAIN_ADMIN', 'BRAND_ADMIN', 'HOTEL_ADMIN', 'HOTEL_MANAGER', 'HOTEL_STAFF', 'HOTEL_VIEWER'].includes(roleName) && !value) {
              return 'Chain is required for this role';
            }
          }
        }
        return '';
      case 'brandId':
        // Only validate brandId if role requires it
        if (formData.roleId) {
          const role = roles.find(r => r.roleId === formData.roleId);
          if (role) {
            const roleName = role.roleName;
            if (['BRAND_ADMIN', 'HOTEL_ADMIN', 'HOTEL_MANAGER', 'HOTEL_STAFF', 'HOTEL_VIEWER'].includes(roleName) && !value) {
              return 'Brand is required for this role';
            }
          }
        }
        return '';
      case 'hotelId':
        // Only validate hotelId if role requires it
        if (formData.roleId) {
          const role = roles.find(r => r.roleId === formData.roleId);
          if (role) {
            const roleName = role.roleName;
            if (['HOTEL_ADMIN', 'HOTEL_MANAGER', 'HOTEL_STAFF', 'HOTEL_VIEWER'].includes(roleName) && !value) {
              return 'Hotel is required for this role';
            }
          }
        }
        return '';
      default:
        return '';
    }
  };

  // Function to validate the entire form
  const validateForm = () => {
    const errors = {
      username: validateField('username', formData.username),
      email: validateField('email', formData.email),
      firstName: validateField('firstName', formData.firstName),
      lastName: validateField('lastName', formData.lastName),
      password: validateField('password', formData.password),
      roleId: validateField('roleId', formData.roleId),
      chainId: validateField('chainId', formData.chainId),
      brandId: validateField('brandId', formData.brandId),
      hotelId: validateField('hotelId', formData.hotelId),
    };
    
    console.log('Validation errors:', errors);
    
    setFieldErrors(errors);
    
    // Returns true if there are no errors
    return !Object.values(errors).some(error => error !== '');
  };

  // Check if the form is valid to enable the save button
  const isFormValid = () => {
    const basicFieldsValid = formData.username.trim() !== '' && 
                            formData.email.trim() !== '' && 
                            formData.firstName.trim() !== '' && 
                            formData.lastName.trim() !== '' && 
                            formData.password.trim() !== '' &&
                            formData.roleId !== null;
    
    if (!basicFieldsValid) {
      console.log('Basic fields validation failed:', {
        username: formData.username.trim() !== '',
        email: formData.email.trim() !== '',
        firstName: formData.firstName.trim() !== '',
        lastName: formData.lastName.trim() !== '',
        password: formData.password.trim() !== '',
        roleId: formData.roleId !== null
      });
      return false;
    }
    
    // Check role-specific requirements
    if (formData.roleId) {
      const role = roles.find(r => r.roleId === formData.roleId);
      if (!role) {
        console.log('Role not found for roleId:', formData.roleId);
        return false;
      }
      
      const roleName = role.roleName;
      console.log('Checking role-specific requirements for:', roleName);
      
      if (roleName === 'CHAIN_ADMIN' && !formData.chainId) {
        console.log('CHAIN_ADMIN requires chainId');
        return false;
      }
      if (roleName === 'BRAND_ADMIN' && (!formData.chainId || !formData.brandId)) {
        console.log('BRAND_ADMIN requires chainId and brandId');
        return false;
      }
      if (['HOTEL_ADMIN', 'HOTEL_MANAGER', 'HOTEL_STAFF', 'HOTEL_VIEWER'].includes(roleName) && 
          (!formData.chainId || !formData.brandId || !formData.hotelId)) {
        console.log('Hotel roles require chainId, brandId, and hotelId');
        return false;
      }
    }
    
    console.log('Form is valid');
    return true;
  };

  const loadFormData = async () => {
    try {
      const [rolesRes, chainsRes, brandsRes, hotelsRes] = await Promise.all([
        authenticatedFetch('/users/available-roles'),
        authenticatedFetch('/users/available-chains'),
        authenticatedFetch('/users/available-brands'),
        authenticatedFetch('/users/available-hotels')
      ]);

      if (rolesRes.ok && chainsRes.ok && brandsRes.ok && hotelsRes.ok) {
        const rolesData = await rolesRes.json();
        const chainsData = await chainsRes.json();
        const brandsData = await brandsRes.json();
        const hotelsData = await hotelsRes.json();

        setRoles(rolesData);
        setChains(chainsData);
        setBrands(brandsData);
        setHotels(hotelsData);
      } else {
        throw new Error('Failed to load form data');
      }
    } catch (error) {
      console.error('Error loading form data:', error);
      setNotification({
        kind: 'error',
        title: 'Error',
        subtitle: 'Failed to load form data'
      });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    setNotification(null); // Clear notifications when changing
  };

  const handleBlur = (field) => {
    const value = formData[field];
    const fieldError = validateField(field, value);
    setFieldErrors(prev => ({
      ...prev,
      [field]: fieldError
    }));
  };

  const handleRoleChange = (event) => {
    const roleId = parseInt(event.target.value);
    const role = roles.find(r => r.roleId === roleId);
    setSelectedRole(role);
    setFormData(prev => ({
      ...prev,
      roleId: roleId,
      chainId: null,
      brandId: null,
      hotelId: null
    }));
    
    // Clear role error if valid selection
    if (roleId) {
      setFieldErrors(prev => ({
        ...prev,
        roleId: '',
        chainId: '',
        brandId: '',
        hotelId: ''
      }));
    }
    
    // Reset context selections
    setSelectedChain(null);
    setSelectedBrand(null);
    setSelectedHotel(null);
    
    setNotification(null);
  };

  const handleChainChange = (event) => {
    const chainId = parseInt(event.target.value);
    const chain = chains.find(c => c.chainId === chainId);
    setSelectedChain(chain);
    setFormData(prev => ({
      ...prev,
      chainId: chainId,
      brandId: null,
      hotelId: null
    }));
    
    // Clear chain error if valid selection
    if (chainId) {
      setFieldErrors(prev => ({
        ...prev,
        chainId: '',
        brandId: '',
        hotelId: ''
      }));
    }
    
    // Reset dependent selections
    setSelectedBrand(null);
    setSelectedHotel(null);
    
    setNotification(null);
  };

  const handleBrandChange = (event) => {
    const brandId = parseInt(event.target.value);
    const brand = brands.find(b => b.brandId === brandId);
    setSelectedBrand(brand);
    setFormData(prev => ({
      ...prev,
      brandId: brandId,
      hotelId: null
    }));
    
    // Clear brand error if valid selection
    if (brandId) {
      setFieldErrors(prev => ({
        ...prev,
        brandId: '',
        hotelId: ''
      }));
    }
    
    // Reset dependent selections
    setSelectedHotel(null);
    
    setNotification(null);
  };

  const handleHotelChange = (event) => {
    const hotelId = parseInt(event.target.value);
    const hotel = hotels.find(h => h.hotelId === hotelId);
    setSelectedHotel(hotel);
    setFormData(prev => ({
      ...prev,
      hotelId: hotelId
    }));
    
    // Clear hotel error if valid selection
    if (hotelId) {
      setFieldErrors(prev => ({
        ...prev,
        hotelId: ''
      }));
    }
    
    setNotification(null);
  };

  const getFilteredBrands = () => {
    if (!selectedChain) return brands;
    return brands.filter(brand => brand.chainId === selectedChain.chainId);
  };

  const getFilteredHotels = () => {
    if (selectedBrand) {
      return hotels.filter(hotel => hotel.brandId === selectedBrand.brandId);
    }
    if (selectedChain) {
      return hotels.filter(hotel => hotel.chainId === selectedChain.chainId);
    }
    return hotels;
  };

  const getContextFields = () => {
    if (!selectedRole) return null;

    const roleName = selectedRole.roleName;
    
    if (roleName === 'SUPER_USER') {
      return null; // SUPER_USER doesn't need context
    }
    
    if (roleName === 'CHAIN_ADMIN') {
      return (
        <FormGroup legendText="Context">
          <Select
            id="chain"
            labelText="Chain *"
            value={selectedChain?.chainId?.toString() || ''}
            onChange={handleChainChange}
            onBlur={() => handleBlur('chainId')}
            invalid={fieldErrors.chainId !== ''}
            invalidText={fieldErrors.chainId}
          >
            <SelectItem value="" text="Select a chain" />
            {chains.map((chain) => (
              <SelectItem key={chain.chainId} value={chain.chainId.toString()} text={chain.chainName} />
            ))}
          </Select>
        </FormGroup>
      );
    }
    
    if (roleName === 'BRAND_ADMIN') {
      return (
        <FormGroup legendText="Context">
          <Select
            id="chain"
            labelText="Chain *"
            value={selectedChain?.chainId?.toString() || ''}
            onChange={handleChainChange}
            onBlur={() => handleBlur('chainId')}
            invalid={fieldErrors.chainId !== ''}
            invalidText={fieldErrors.chainId}
          >
            <SelectItem value="" text="Select a chain" />
            {chains.map((chain) => (
              <SelectItem key={chain.chainId} value={chain.chainId.toString()} text={chain.chainName} />
            ))}
          </Select>
          <Select
            id="brand"
            labelText="Brand *"
            value={selectedBrand?.brandId?.toString() || ''}
            onChange={handleBrandChange}
            onBlur={() => handleBlur('brandId')}
            invalid={fieldErrors.brandId !== ''}
            invalidText={fieldErrors.brandId}
          >
            <SelectItem value="" text="Select a brand" />
            {getFilteredBrands().map((brand) => (
              <SelectItem key={brand.brandId} value={brand.brandId.toString()} text={brand.brandName} />
            ))}
          </Select>
        </FormGroup>
      );
    }
    
    if (['HOTEL_ADMIN', 'HOTEL_MANAGER', 'HOTEL_STAFF', 'HOTEL_VIEWER'].includes(roleName)) {
      return (
        <FormGroup legendText="Context">
          <Select
            id="chain"
            labelText="Chain *"
            value={selectedChain?.chainId?.toString() || ''}
            onChange={handleChainChange}
            onBlur={() => handleBlur('chainId')}
            invalid={fieldErrors.chainId !== ''}
            invalidText={fieldErrors.chainId}
          >
            <SelectItem value="" text="Select a chain" />
            {chains.map((chain) => (
              <SelectItem key={chain.chainId} value={chain.chainId.toString()} text={chain.chainName} />
            ))}
          </Select>
          <Select
            id="brand"
            labelText="Brand *"
            value={selectedBrand?.brandId?.toString() || ''}
            onChange={handleBrandChange}
            onBlur={() => handleBlur('brandId')}
            invalid={fieldErrors.brandId !== ''}
            invalidText={fieldErrors.brandId}
          >
            <SelectItem value="" text="Select a brand" />
            {getFilteredBrands().map((brand) => (
              <SelectItem key={brand.brandId} value={brand.brandId.toString()} text={brand.brandName} />
            ))}
          </Select>
          <Select
            id="hotel"
            labelText="Hotel *"
            value={selectedHotel?.hotelId?.toString() || ''}
            onChange={handleHotelChange}
            onBlur={() => handleBlur('hotelId')}
            invalid={fieldErrors.hotelId !== ''}
            invalidText={fieldErrors.hotelId}
          >
            <SelectItem value="" text="Select a hotel" />
            {getFilteredHotels().map((hotel) => (
              <SelectItem key={hotel.hotelId} value={hotel.hotelId.toString()} text={hotel.hotelName} />
            ))}
          </Select>
        </FormGroup>
      );
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Force validation display
    setShowValidation(true);
    
    // Validate the entire form before submitting
    if (!validateForm()) {
      setNotification({
        kind: 'error',
        title: 'Validation Error',
        subtitle: 'Please fill in all required fields correctly'
      });
      return;
    }

    setLoading(true);
    setNotification(null);
    
    try {
      // Clean formData to remove empty auth0Id and null values
      const cleanFormData = {
        username: formData.username,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
        isActive: formData.isActive,
        roleId: formData.roleId,
        chainId: formData.chainId || null,
        brandId: formData.brandId || null,
        hotelId: formData.hotelId || null
      };
      
      console.log('Sending user data:', cleanFormData);
      
      const response = await authenticatedFetch('/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanFormData)
      });

      if (response.ok) {
        const newUser = await response.json();
        setNotification({
          kind: 'success',
          title: 'Success',
          subtitle: 'User created successfully'
        });
        
        if (onUserCreated) {
          onUserCreated(newUser);
        }
      } else {
        const errorData = await response.json();
        console.error('Backend error response:', errorData);
        throw new Error(errorData.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setNotification({
        kind: 'error',
        title: 'Error',
        subtitle: error.message || 'Failed to create user'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading description="Loading form data..." />;
  }

  return (
    <Tile style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Create New User
        </h2>
        <p style={{ color: '#666', fontSize: '0.875rem' }}>
          Fill in the user information and optionally assign a role.
        </p>
      </div>

      {notification && (
        <InlineNotification
          kind={notification.kind}
          title={notification.title}
          subtitle={notification.subtitle}
          onClose={() => setNotification(null)}
          style={{ marginBottom: '1rem' }}
        />
      )}

      <Form onSubmit={handleSubmit}>
        {/* Basic User Information */}
        <FormGroup legendText="Basic Information">
          <Stack gap={4}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <TextInput
                id="firstName"
                labelText="First Name *"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                onBlur={() => handleBlur('firstName')}
                required
                invalid={fieldErrors.firstName !== ''}
                invalidText={fieldErrors.firstName}
                placeholder="Enter first name"
              />
              <TextInput
                id="lastName"
                labelText="Last Name *"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                onBlur={() => handleBlur('lastName')}
                required
                invalid={fieldErrors.lastName !== ''}
                invalidText={fieldErrors.lastName}
                placeholder="Enter last name"
              />
            </div>
            
            <TextInput
              id="username"
              labelText="Username *"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              onBlur={() => handleBlur('username')}
              required
              invalid={fieldErrors.username !== ''}
              invalidText={fieldErrors.username}
              placeholder="Enter username"
            />
            
            <TextInput
              id="email"
              labelText="Email *"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              required
              invalid={fieldErrors.email !== ''}
              invalidText={fieldErrors.email}
              placeholder="Enter email address"
            />
            
            <TextInput
              id="password"
              labelText="Password *"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              required
              invalid={fieldErrors.password !== ''}
              invalidText={fieldErrors.password}
              placeholder="Enter password"
            />
            
            {/* Auth0 ID removed from UI but kept in formData for API compatibility */}
            
            <Checkbox
              id="isActive"
              labelText="Active"
              checked={formData.isActive}
              onChange={(checked) => handleInputChange('isActive', checked)}
            />
          </Stack>
        </FormGroup>

        {/* Role Assignment */}
        <FormGroup legendText="Role Assignment">
          <Stack gap={4}>
            <Select
              id="role"
              labelText="Role *"
              value={formData.roleId?.toString() || ''}
              onChange={handleRoleChange}
              onBlur={() => handleBlur('roleId')}
              invalid={fieldErrors.roleId !== ''}
              invalidText={fieldErrors.roleId}
              required
            >
              <SelectItem value="" text="Select a role" />
              {roles.map((role) => (
                <SelectItem 
                  key={role.roleId} 
                  value={role.roleId.toString()} 
                  text={`${role.roleName} - ${role.description}`} 
                />
              ))}
            </Select>

            {/* Context fields based on selected role */}
            {selectedRole && getContextFields()}
          </Stack>
        </FormGroup>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
          <Button kind="tertiary" onClick={onCancel}>
            Cancel
          </Button>
          <Button kind="primary" type="submit" disabled={!isFormValid()}>
            Create User
          </Button>
        </div>
      </Form>
    </Tile>
  );
};

export default UserNewForm; 