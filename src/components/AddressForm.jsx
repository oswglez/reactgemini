// src/components/AddressForm.jsx
import React, { useState } from 'react';
import { useParams } from 'react-router-dom'; // Removed useNavigate as it wasn't used here
import { useKeycloak } from '@react-keycloak/web';
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

// Initial state for the address form fields
const initialAddressState = {
  streetAddress: '',
  city: '',
  stateProvince: '',
  postalCode: '',
  country: '', // Will store the selected country code/ID
  addressType: '', // Will store the selected type code/ID
};

// Sample Data for Dropdowns (Text translated)
// Ensure 'id' values match what your backend expects if different from text
const countryItems = [
  { id: 'UY', text: 'Uruguay' },
  { id: 'AR', text: 'Argentina' },
  { id: 'BR', text: 'Brazil' }, // Translated
  { id: 'US', text: 'United States' },
  // ...add more countries as needed
];

const addressTypeItems = [
  { id: 'PRIMARY', text: 'Primary' }, // Translated
  { id: 'MAILING', text: 'Mailing' }, // Translated
  { id: 'BILLING', text: 'Billing' }, // Translated
  { id: 'OTHER', text: 'Other' }, // Translated
];

function AddressForm() {
  const { keycloak, initialized } = useKeycloak(); // Obtener la instancia de keycloak y el estado de inicialización

  // Get hotelId from the current page context (URL parameter)
  const { hotelId } = useParams();
  // const navigate = useNavigate(); // Not currently used, can be added for navigation after save

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
    const value = selectedItem ? selectedItem.id : ''; // Store the ID/value
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // --- Validation ---
  const validateForm = () => {
    const newErrors = {};
    // --- ADJUST REQUIRED FIELDS BASED ON YOUR Address ENTITY! ---
    if (!formData.streetAddress.trim())
      newErrors.streetAddress = 'Street address is required.'; // Translated
    if (!formData.city.trim()) newErrors.city = 'City is required.'; // Translated
    if (!formData.country) newErrors.country = 'Country is required.'; // Translated
    // Add more validations if needed (e.g., postal code format)

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus(null);
    setLastSavedInfo('');

    if (!validateForm() || !hotelId) {
      if (!hotelId)
        setErrors((prev) => ({
          ...prev,
          api: 'Could not determine Hotel ID from URL.',
        })); // Translated
      return;
    }

    setLoading(true);

    // --- ADJUST PAYLOAD TO MATCH YOUR Address ENTITY FIELDS! ---
    const payload = {
      street: formData.streetAddress,
      city: formData.city,
      state: formData.stateProvince,
      postalCode: formData.postalCode,
      country: formData.country, // Sending country code/value
      addressType: formData.addressType, // Sending type code/value
      // --- Sending hotelId in payload as required by the API endpoint ---
      hotelId: parseInt(hotelId, 10),
      // -----------------------------------------------------------------
    };

    // Correct API Endpoint provided by user
    const apiUrl = `http://localhost:8090/api/addresses`;
    console.log(
      `Sending Payload to ${apiUrl}:`,
      JSON.stringify(payload, null, 2)
    );

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        /* ... error handling (no change needed here) ... */
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
      setLastSavedInfo(`${formData.streetAddress}, ${formData.city}`); // Feedback info
      setFormData(initialAddressState); // Clear form for next entry
      setErrors({});
    } catch (error) {
      console.error('Error saving address:', error);
      setSubmitStatus('error');
      setErrors((prev) => ({
        ...prev,
        api:
          error.message ||
          'An unexpected error occurred while saving the address.',
      })); // Translated
    } finally {
      setLoading(false);
    }
  };
  if (!initialized) {
    return (
      <Loading
        description="Initializing security context..."
        withOverlay={false}
      />
    );
  }

  if (!keycloak.authenticated) {
    return (
      <InlineNotification
        kind="warning"
        title="Authentication Required"
        subtitle="You must be logged in to use this form."
      />
    );
  }
  return (
    // Theme comes from parent layout
    <div>
      {/* Title translated */}
      <h3 style={{ marginBottom: '1.5rem' }}>
        Add Address for Hotel ID: {hotelId}
      </h3>

      <Form onSubmit={handleSubmit}>
        <Grid>
          {/* Column 1 */}
          <Column lg={8} md={6} sm={4}>
            {/* Translated */}
            <FormGroup legendText="Address Details">
              {/* --- ADJUST FIELDS TO MATCH YOUR Address ENTITY! --- */}
              <TextInput
                id="streetAddress"
                name="streetAddress"
                labelText="Street Address (Required)" // Translated
                value={formData.streetAddress}
                onChange={handleChange}
                invalid={!!errors.streetAddress}
                invalidText={errors.streetAddress}
                light
              />
              <TextInput
                id="city"
                name="city"
                labelText="City (Required)" // Translated
                value={formData.city}
                onChange={handleChange}
                invalid={!!errors.city}
                invalidText={errors.city}
                light
              />
              <TextInput
                id="stateProvince"
                name="stateProvince"
                labelText="State / Province" // Translated
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
            {/* Translated */}
            <FormGroup legendText="Additional Details">
              <TextInput
                id="postalCode"
                name="postalCode"
                labelText="Postal Code" // Translated
                value={formData.postalCode}
                onChange={handleChange}
                invalid={!!errors.postalCode}
                invalidText={errors.postalCode}
                light
              />
              <Dropdown
                id="country"
                name="country"
                titleText="Country (Required)" // Translated
                label="Select a country" // Translated
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
                titleText="Address Type (Optional)" // Translated
                label="Select a type" // Translated
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
                subtitle={`Address "${lastSavedInfo}" saved. Ready for next entry.`} // Translated
                onClose={() => setSubmitStatus(null)}
                lowContrast
                style={{ marginBottom: '1rem' }}
              />
            )}
            {!loading && submitStatus === 'error' && (
              <InlineNotification
                kind="error"
                title="Save Error" // Translated
                subtitle={errors.api || 'Could not save address.'} // Translated
                onClose={() => {
                  setSubmitStatus(null);
                  setErrors((prev) => ({ ...prev, api: undefined }));
                }}
                lowContrast
                style={{ marginBottom: '1rem' }}
              />
            )}
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Address'} {/* Translated */}
            </Button>
          </Column>
        </Grid>
      </Form>
    </div>
  );
}

export default AddressForm;
