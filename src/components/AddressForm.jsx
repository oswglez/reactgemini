// src/components/AddressForm.jsx
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Form,
  FormGroup,
  TextInput,
  Dropdown,
  Button,
  Grid,
  Column,
  InlineNotification,
  Loading,
} from '@carbon/react';
import { getApiBaseUrl } from '../services/config';

// Initial state for the address form fields
const initialAddressState = {
  streetAddress: '',
  city: '',
  stateProvince: '',
  postalCode: '',
  country: '',
  addressType: '',
};

// Sample Data for Dropdowns
const countryItems = [
  { id: 'UY', text: 'Uruguay' },
  { id: 'AR', text: 'Argentina' },
  { id: 'BR', text: 'Brazil' },
  { id: 'US', text: 'United States' },
];

const addressTypeItems = [
  { id: 'PRIMARY', text: 'Primary' },
  { id: 'MAILING', text: 'Mailing' },
  { id: 'BILLING', text: 'Billing' },
  { id: 'OTHER', text: 'Other' },
];

function AddressForm() {
  const { hotelId } = useParams();

  const [formData, setFormData] = useState(initialAddressState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [lastSavedInfo, setLastSavedInfo] = useState('');

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleDropdownChange = (field, { selectedItem }) => {
    const value = selectedItem ? selectedItem.id : '';
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // --- Validation ---
  const validateForm = () => {
    const newErrors = {};
    if (!formData.streetAddress.trim())
      newErrors.streetAddress = 'Street address is required.';
    if (!formData.city.trim()) newErrors.city = 'City is required.';
    if (!formData.country) newErrors.country = 'Country is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus(null);
    setLastSavedInfo('');

    if (!validateForm() || !hotelId) {
      return;
    }

    setLoading(true);
    const payload = {
      ...formData,
      hotelId: parseInt(hotelId, 10),
    };

    const baseUrl = getApiBaseUrl();
    const apiUrl = `${baseUrl}/api/addresses?hotelId=${hotelId}`;
    console.log(`Sending Payload to ${apiUrl}:`, JSON.stringify(payload, null, 2));

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMsg = `HTTP Error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || JSON.stringify(errorData);
        } catch (err) {
          console.warn('Failed to parse error response as JSON:', err);
          errorMsg += ` - ${response.statusText}`;
        }
        throw new Error(errorMsg);
      }

      const savedAddress = await response.json();
      console.log('Address saved:', savedAddress);
      setSubmitStatus('success');
      setLastSavedInfo(`${formData.streetAddress}, ${formData.city}`);
      setFormData(initialAddressState);
      setErrors({});
    } catch (error) {
      console.error('Error saving address:', error);
      setSubmitStatus('error');
      setErrors((prev) => ({
        ...prev,
        api: error.message || 'An unexpected error occurred while saving the address.',
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Grid>
        {/* Column 1 */}
        <Column lg={8} md={6} sm={4}>
          <FormGroup legendText="Address Details">
            <TextInput
              id="streetAddress"
              name="streetAddress"
              labelText="Street Address (Required)"
              value={formData.streetAddress}
              onChange={handleChange}
              invalid={!!errors.streetAddress}
              invalidText={errors.streetAddress}
              light
            />
            <TextInput
              id="city"
              name="city"
              labelText="City (Required)"
              value={formData.city}
              onChange={handleChange}
              invalid={!!errors.city}
              invalidText={errors.city}
              light
            />
            <TextInput
              id="stateProvince"
              name="stateProvince"
              labelText="State / Province"
              value={formData.stateProvince}
              onChange={handleChange}
              invalid={!!errors.stateProvince}
              invalidText={errors.stateProvince}
              light
            />
          </FormGroup>
        </Column>

        {/* Column 2 */}
        <Column lg={8} md={6} sm={4}>
          <FormGroup legendText="Additional Details">
            <TextInput
              id="postalCode"
              name="postalCode"
              labelText="Postal Code"
              value={formData.postalCode}
              onChange={handleChange}
              invalid={!!errors.postalCode}
              invalidText={errors.postalCode}
              light
            />
            <Dropdown
              id="country"
              name="country"
              titleText="Country (Required)"
              label="Select a country"
              items={countryItems}
              itemToString={(item) => (item ? item.text : '')}
              onChange={({ selectedItem }) =>
                handleDropdownChange('country', { selectedItem })
              }
              selectedItem={
                countryItems.find((item) => item.id === formData.country) ||
                null
              }
              invalid={!!errors.country}
              invalidText={errors.country}
              light
            />
            <Dropdown
              id="addressType"
              name="addressType"
              titleText="Address Type (Optional)"
              label="Select a type"
              items={addressTypeItems}
              itemToString={(item) => (item ? item.text : '')}
              onChange={({ selectedItem }) =>
                handleDropdownChange('addressType', { selectedItem })
              }
              selectedItem={
                addressTypeItems.find(
                  (item) => item.id === formData.addressType
                ) || null
              }
              light
            />
          </FormGroup>
        </Column>

        {/* Submission Area & Notifications */}
        <Column lg={16} md={8} sm={4} style={{ marginTop: '2rem' }}>
          {loading && (
            <Loading description="Saving address..." withOverlay={false} />
          )}
          {!loading && submitStatus === 'success' && (
            <InlineNotification
              kind="success"
              title="Success!"
              subtitle={`Address "${lastSavedInfo}" saved. Ready for next entry.`}
              onClose={() => setSubmitStatus(null)}
              lowContrast
              style={{ marginBottom: '1rem' }}
            />
          )}
          {!loading && submitStatus === 'error' && (
            <InlineNotification
              kind="error"
              title="Save Error"
              subtitle={errors.api || 'Could not save address.'}
              onClose={() => {
                setSubmitStatus(null);
                setErrors((prev) => ({ ...prev, api: undefined }));
              }}
              lowContrast
              style={{ marginBottom: '1rem' }}
            />
          )}
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Address'}
          </Button>
        </Column>
      </Grid>
    </Form>
  );
}

export default AddressForm;
