// src/components/ContactForm.jsx
import React, { useState } from 'react';
import { useParams } from 'react-router-dom'; // Assuming context via URL later if needed
import {
  // Theme, // Comes from AppLayout
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

// Initial state for the contact form fields
const initialContactState = {
  title: '', // Renamed from contactTitle for simplicity
  firstName: '',
  lastName: '',
  localPhone: '', // Renamed from contactLocalNumber
  mobilePhone: '', // Renamed from contactMobileNumber
  faxNumber: '', // Renamed from contactFaxNumber
  email: '', // Renamed from contactEmail
};

// Fixed options for the Title Dropdown (already English)
const titleItems = [
  { id: 'Mr', text: 'Mr' },
  { id: 'Mrs', text: 'Mrs' },
  { id: 'Miss', text: 'Miss' },
  { id: 'Manager', text: 'Manager' },
  { id: 'Seller', text: 'Seller' },
];

function ContactForm() {
  // If this form is associated with a specific hotel (like accessed via /hotel/:hotelId/contacts),
  // we'll need the hotelId for the API call.
  const { hotelId } = useParams(); // Get hotelId if available from route

  const [formData, setFormData] = useState(initialContactState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [lastSavedInfo, setLastSavedInfo] = useState(''); // For feedback message

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleDropdownChange = (field, { selectedItem }) => {
    const value = selectedItem ? selectedItem.id : ''; // Store the ID ('Mr', 'Mrs', etc.)
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // --- Validation ---
  const validateForm = () => {
    const newErrors = {};
    // Use renamed state keys
    const { firstName, lastName, mobilePhone, email } = formData;

    // Required fields (translated messages)
    if (!firstName.trim()) newErrors.firstName = 'First name is required.';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required.';
    if (!mobilePhone.trim())
      newErrors.mobilePhone = 'Mobile phone is required.';
    if (!email.trim()) newErrors.email = 'Email is required.';

    // Format validation (translated messages)
    const mobilePattern = /^\+\d[\d\s]*$/; // Starts with +, digits, optional spaces
    if (mobilePhone && !mobilePattern.test(mobilePhone)) {
      newErrors.mobilePhone = 'Invalid format. Ex: +1 555 1234567';
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailPattern.test(email)) {
      newErrors.email = 'Invalid email format.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus(null);
    setLastSavedInfo('');

    if (!validateForm()) {
      console.log('Validation Errors:', errors);
      return;
    }
    // Check if hotelId is needed and available (depending on API)
    // if (!hotelId) {
    //     setErrors(prev => ({...prev, api: "Hotel ID not found in URL."}));
    //     setSubmitStatus('error');
    //     return;
    // }

    setLoading(true);

    // Prepare payload using updated state keys
    // IMPORTANT: Ensure these keys match what your backend API expects!
    const payload = {
      contactTitle: formData.title, // Sending 'title' state as 'contactTitle' key
      firstName: formData.firstName,
      lastName: formData.lastName,
      contactLocalNumber: formData.localPhone, // Sending 'localPhone' state as 'contactLocalNumber' key
      contactMobileNumber: formData.mobilePhone, // Sending 'mobilePhone' state as 'contactMobileNumber' key
      contactFaxNumber: formData.faxNumber, // Sending 'faxNumber' state as 'contactFaxNumber' key
      contactEmail: formData.email, // Sending 'email' state as 'contactEmail' key
      // Do we need to send hotelId? If the API requires it in the body:
      // hotelId: parseInt(hotelId, 10),
    };

    // API endpoint (assuming POST to create, adjust if needed)
    // This endpoint likely needs the hotelId if contacts are hotel-specific
    // Adjust URL construction based on actual API requirement (path vs query param vs body)
    // Example if hotelId needed as query param (like amenities):
    // const apiUrl = `http://localhost:8090/api/contacts?hotelId=${hotelId}`;
    // Example if hotelId needed in path (like rooms):
    // const apiUrl = `http://localhost:8090/api/hotels/${hotelId}/contacts`;
    // Example if simple POST to /api/contacts and hotelId is in payload:
    const apiUrl = `http://localhost:8090/api/contacts`; // Using the original endpoint for now

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
        /* ... error handling ... */
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

      const savedContact = await response.json();
      console.log('Contact saved:', savedContact);
      setSubmitStatus('success');
      setLastSavedInfo(`${formData.firstName} ${formData.lastName}`);
      // Clear form for next entry
      setFormData(initialContactState);
      setErrors({});
    } catch (error) {
      console.error('Error saving contact:', error);
      setSubmitStatus('error');
      setErrors((prev) => ({
        ...prev,
        api:
          error.message ||
          'An unexpected error occurred while saving the contact.',
      }));
    } finally {
      setLoading(false);
    }
  };

  // --- JSX with Translated Labels/Text ---
  return (
    <div>
      {/* Title depends on context - is it always Add or sometimes Edit? */}
      <h3 style={{ marginBottom: '1.5rem' }}>
        Add Contact {hotelId ? `for Hotel ID: ${hotelId}` : ''}
      </h3>

      <Form onSubmit={handleSubmit}>
        <Grid>
          {/* Column 1: Personal Info */}
          <Column lg={8} md={8} sm={4}>
            <FormGroup legendText="Personal Information">
              {' '}
              {/* Translated */}
              <Dropdown
                id="title" // Changed ID/Name to match state
                name="title"
                titleText="Title" // Translated
                label="Select a title (optional)" // Translated
                items={titleItems}
                itemToString={(item) => (item ? item.text : '')}
                onChange={(selection) =>
                  handleDropdownChange('title', selection)
                }
                selectedItem={
                  titleItems.find((item) => item.id === formData.title) || null
                }
                invalid={!!errors.title} // Use updated state key
                invalidText={errors.title}
                light
              />
              <TextInput
                id="firstName"
                name="firstName"
                labelText="First Name (Required)" // Translated
                value={formData.firstName}
                onChange={handleChange}
                invalid={!!errors.firstName}
                invalidText={errors.firstName}
                light
              />
              <TextInput
                id="lastName"
                name="lastName"
                labelText="Last Name (Required)" // Translated
                value={formData.lastName}
                onChange={handleChange}
                invalid={!!errors.lastName}
                invalidText={errors.lastName}
                light
              />
              <TextInput
                id="email" // Changed ID/Name to match state
                name="email"
                type="email"
                labelText="Email (Required)" // Translated
                value={formData.email}
                onChange={handleChange}
                invalid={!!errors.email}
                invalidText={errors.email}
                light
              />
            </FormGroup>
          </Column>

          {/* Column 2: Contact Numbers */}
          <Column lg={8} md={8} sm={4}>
            <FormGroup legendText="Contact Numbers">
              {' '}
              {/* Translated */}
              <TextInput
                id="mobilePhone" // Changed ID/Name to match state
                name="mobilePhone"
                labelText="Mobile Phone (Required)" // Translated
                value={formData.mobilePhone}
                onChange={handleChange}
                invalid={!!errors.mobilePhone}
                invalidText={errors.mobilePhone}
                helperText="Include country code e.g., +1..." // Translated
                light
              />
              <TextInput
                id="localPhone" // Changed ID/Name to match state
                name="localPhone"
                labelText="Local Phone" // Translated
                value={formData.localPhone}
                onChange={handleChange}
                invalid={!!errors.localPhone}
                invalidText={errors.localPhone}
                light
              />
              <TextInput
                id="faxNumber" // Changed ID/Name to match state
                name="faxNumber"
                labelText="Fax Number" // Translated
                value={formData.faxNumber}
                onChange={handleChange}
                invalid={!!errors.faxNumber}
                invalidText={errors.faxNumber}
                light
              />
            </FormGroup>
          </Column>

          {/* Submission Area & Notifications */}
          <Column lg={16} md={8} sm={4} style={{ marginTop: '2rem' }}>
            {loading && (
              <Loading description="Saving contact..." withOverlay={false} />
            )}
            {!loading && submitStatus === 'success' && (
              <InlineNotification
                kind="success"
                title="Success!"
                subtitle={`Contact "${lastSavedInfo}" saved. Ready for next entry.`} // Translated
                onClose={() => setSubmitStatus(null)}
                lowContrast
                style={{ marginBottom: '1rem' }}
              />
            )}
            {!loading && submitStatus === 'error' && (
              <InlineNotification
                kind="error"
                title="Save Error" // Translated
                subtitle={errors.api || 'Could not save contact.'} // Translated
                onClose={() => {
                  setSubmitStatus(null);
                  setErrors((prev) => ({ ...prev, api: undefined }));
                }}
                lowContrast
                style={{ marginBottom: '1rem' }}
              />
            )}
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Contact'}{' '}
              {/* Translated - Or 'Save and Add Next' */}
            </Button>
          </Column>
        </Grid>
      </Form>
    </div>
  );
}

export default ContactForm;
