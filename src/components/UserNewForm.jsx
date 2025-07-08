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
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    auth0Id: '',
    isActive: true,
    roleId: null,
    chainId: null,
    brandId: null,
    hotelId: null
  });

  const authenticatedFetch = useAuthenticatedFetch();

  useEffect(() => {
    loadFormData();
  }, []);

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
    
    // Reset context selections
    setSelectedChain(null);
    setSelectedBrand(null);
    setSelectedHotel(null);
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
    
    // Reset dependent selections
    setSelectedBrand(null);
    setSelectedHotel(null);
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
    
    // Reset dependent selections
    setSelectedHotel(null);
  };

  const handleHotelChange = (event) => {
    const hotelId = parseInt(event.target.value);
    const hotel = hotels.find(h => h.hotelId === hotelId);
    setSelectedHotel(hotel);
    setFormData(prev => ({
      ...prev,
      hotelId: hotelId
    }));
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

  const isFormValid = () => {
    const { username, email, firstName, lastName, roleId } = formData;
    
    if (!username || !email || !firstName || !lastName) {
      return false;
    }
    
    if (roleId) {
      const role = roles.find(r => r.roleId === roleId);
      if (!role) return false;
      
      const roleName = role.roleName;
      
      if (roleName === 'CHAIN_ADMIN' && !formData.chainId) return false;
      if (roleName === 'BRAND_ADMIN' && (!formData.chainId || !formData.brandId)) return false;
      if (['HOTEL_ADMIN', 'HOTEL_MANAGER', 'HOTEL_STAFF', 'HOTEL_VIEWER'].includes(roleName) && 
          (!formData.chainId || !formData.brandId || !formData.hotelId)) return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      setNotification({
        kind: 'error',
        title: 'Validation Error',
        subtitle: 'Please fill in all required fields'
      });
      return;
    }

    setLoading(true);
    setNotification(null);
    
    try {
      const response = await authenticatedFetch('/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
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
                required
              />
              <TextInput
                id="lastName"
                labelText="Last Name *"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
              />
            </div>
            
            <TextInput
              id="username"
              labelText="Username *"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              required
            />
            
            <TextInput
              id="email"
              labelText="Email *"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
            />
            
            <TextInput
              id="auth0Id"
              labelText="Auth0 ID"
              value={formData.auth0Id}
              onChange={(e) => handleInputChange('auth0Id', e.target.value)}
              placeholder="Optional - will be set during OAuth login"
            />
            
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
              labelText="Role"
              value={formData.roleId?.toString() || ''}
              onChange={handleRoleChange}
            >
              <SelectItem value="" text="Select a role (optional)" />
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