// src/components/MediaForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Form,
  FormGroup,
  TextInput,
  Dropdown,
  NumberInput,
  Button,
  Grid,
  Column,
  InlineNotification,
  Loading,
} from '@carbon/react';

// Initial state using English keys
const initialMediaState = { code: '', type: '', description: '', url: '' };

// Options for MediaType Dropdown will be loaded dynamically
// const mediaTypeItems = [ ... ]; // REMOVED

function MediaForm() {
  const { hotelId } = useParams();
  const [formData, setFormData] = useState(initialMediaState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [lastSavedInfo, setLastSavedInfo] = useState('');
  const [mediaTypeOptions, setMediaTypeOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState(null);

  // useEffect to load MediaType options (Correct)
  useEffect(() => {
    const fetchMediaTypes = async () => {
      setLoadingOptions(true);
      setOptionsError(null);
      try {
        const response = await fetch('http://localhost:8090/api/mediaType');
        if (!response.ok)
          throw new Error(
            `Error ${response.status}: Could not load media types`
          );
        const data = await response.json();
        const options = (data || []).map((type) => ({
          id: type.mediaTypeName,
          text: type.mediaTypeName,
        }));
        console.log('Mapped MediaType Options:', options);
        setMediaTypeOptions(options);
      } catch (err) {
        console.error('Error fetching media types:', err);
        setOptionsError(err.message || 'Failed to load options');
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchMediaTypes();
  }, []);

  // --- Handlers WITH LOGIC ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleDropdownChange = (field, { selectedItem }) => {
    const value = selectedItem ? selectedItem.id : '';
    console.log(`Dropdown Change: Field=${field}, SelectedID=${value}`);
    console.log('Selected Item Object:', selectedItem);
    setFormData((prev) => ({ ...prev, [field]: value })); // <-- Actualizar estado
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleNumberInputChange = (fieldName, valueAsString) => {
    setFormData((prev) => ({ ...prev, [fieldName]: valueAsString })); // <-- Actualizar estado
    if (errors[fieldName])
      setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
  };
  // --- FIN Handlers CON LÓGICA ---

  // --- Validation (Correct) ---
  const validateForm = () => {
    const newErrors = {};
    const { code, type, description, url } = formData;
    const parsedCode = parseInt(code, 10);
    if (code === '' || isNaN(parsedCode) || parsedCode <= 0) {
      newErrors.code = 'Code is required and must be a positive integer.';
    }
    if (!type) {
      newErrors.type = 'Media type is required.';
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required.';
    }
    if (!url.trim()) {
      newErrors.url = 'URL is required.';
    } else {
      try {
        new URL(url);
      } catch (_) {
        newErrors.url = 'Invalid URL format.';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Submission (Correct) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus(null);
    setLastSavedInfo('');
    if (!validateForm() || !hotelId) {
      /*...*/ return;
    }
    setLoading(true);
    const payload = {
      /* ... mapeo correcto ... */
    };
    const apiUrl = `http://localhost:8090/api/medias?hotelId=${hotelId}`;
    console.log(
      `Sending Payload to ${apiUrl}:`,
      JSON.stringify(payload, null, 2)
    );
    try {
      const response = await fetch(apiUrl, {
        /* ... fetch options ... */
      });
      if (!response.ok) {
        /* ... error handling ... */
      }
      const savedMedia = await response.json();
      console.log('Media saved:', savedMedia);
      setSubmitStatus('success');
      setLastSavedInfo(`Code ${formData.code}: ${formData.description}`);
      setFormData(initialMediaState);
      setErrors({});
    } catch (error) {
      /* ... error handling ... */
    } finally {
      setLoading(false);
    }
  };

  // --- Renderizado ---
  const currentMediaTypeSelectedItem =
    mediaTypeOptions.find((item) => item.id === formData.type) || null;
  // console.log('Calculating MediaType selectedItem for render:', { /* ... log opcional ... */ });

  return (
    <div>
      <h3 style={{ marginBottom: '1.5rem' }}>
        Add Media for Hotel ID: {hotelId}
      </h3>
      {optionsError && <InlineNotification /* ... error options ... */ />}
      <Form onSubmit={handleSubmit}>
        <Grid>
          {/* Column 1 */}
          <Column lg={8} md={6} sm={4}>
            <FormGroup legendText="Media Details">
              <NumberInput
                id="code"
                name="code"
                labelText="Media Code (Required)"
                min={1}
                step={1}
                value={formData.code}
                onChange={(e, { value }) =>
                  handleNumberInputChange('code', String(value))
                }
                invalid={!!errors.code}
                invalidText={errors.code}
                allowEmpty={false}
                hideSteppers
                light
              />
              <Dropdown
                id="type"
                name="type"
                titleText="Media Type (Required)"
                label={loadingOptions ? 'Loading types...' : 'Select a type'}
                items={mediaTypeOptions} // <-- Usa opciones dinámicas
                itemToString={(item) => (item ? item.text : '')}
                onChange={({ selectedItem }) =>
                  handleDropdownChange('type', { selectedItem })
                } // <-- Llama al handler correcto
                selectedItem={currentMediaTypeSelectedItem} // <-- Usa item precalculado
                invalid={!!errors.type}
                invalidText={errors.type}
                disabled={loadingOptions || !!optionsError}
                light
              />
            </FormGroup>
          </Column>
          {/* Column 2 */}
          <Column lg={8} md={6} sm={4}>
            <FormGroup legendText="Additional Information">
              <TextInput
                id="description"
                name="description"
                labelText="Description (Required)"
                value={formData.description}
                onChange={handleChange} // <-- Llama al handler correcto
                invalid={!!errors.description}
                invalidText={errors.description}
                light
              />
              <TextInput
                id="url"
                name="url"
                type="url"
                labelText="URL (Required)"
                value={formData.url}
                onChange={handleChange} // <-- Llama al handler correcto
                invalid={!!errors.url}
                invalidText={errors.url}
                helperText="Enter full URL"
                light
              />
            </FormGroup>
          </Column>
          {/* Submission Area & Notifications */}
          <Column lg={16} md={8} sm={4} style={{ marginTop: '2rem' }}>
            {/* ... Notificaciones ... */}
            <Button
              type="submit"
              disabled={loading || loadingOptions || !!optionsError}
            >
              {loading ? 'Saving...' : 'Save Media'}
            </Button>
          </Column>
        </Grid>
      </Form>
    </div>
  );
}

export default MediaForm;
