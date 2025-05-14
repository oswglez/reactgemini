// src/components/FloorPlanForm.jsx
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Form, // Removed FormGroup as we use Grid per row
  TextInput,
  NumberInput,
  Button,
  Grid,
  Column,
  InlineNotification,
  Loading,
  IconButton,
} from '@carbon/react';
import { Add, TrashCan } from '@carbon/icons-react';

// Initial state for ONE floor plan row (using English keys)
const initialFloorPlanRow = {
  building: '',
  floorNumber: '', // Keep as string for input, parse on submit
  url: '', // Renamed from planUrl
  // Client-side temporary ID for React key prop
  tempId: Date.now() + Math.random(),
};

function FloorPlanForm() {
  const { hotelId } = useParams();

  // State for the array of floor plan objects in the form
  const [floorPlans, setFloorPlans] = useState([
    { ...initialFloorPlanRow, tempId: Date.now() }, // Start with one row
  ]);
  const [errors, setErrors] = useState({}); // Errors might be keyed like floorPlans[index].fieldName
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  // --- List Handlers ---

  // Add a new empty row
  const handleAddRow = () => {
    setFloorPlans((prev) => [
      ...prev,
      { ...initialFloorPlanRow, tempId: Date.now() },
    ]);
  };

  // Remove a row by its index
  const handleRemoveRow = (indexToRemove) => {
    setFloorPlans((prev) => prev.filter((_, index) => index !== indexToRemove));
    // Optional: Clean up errors related to the removed row
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      Object.keys(newErrors)
        .filter((key) => key.startsWith(`floorPlans[${indexToRemove}].`))
        .forEach((key) => delete newErrors[key]);
      return newErrors;
    });
  };

  // Update a specific field in a specific row
  const handleInputChange = (index, fieldName, value) => {
    setFloorPlans((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [fieldName]: value } : row))
    );
    // Clear error for this specific field on change
    const errorKey = `floorPlans[${index}].${fieldName}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  // --- Validation (for all rows) ---
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    floorPlans.forEach((fp, index) => {
      // Use updated state keys: building, floorNumber, url
      if (!fp.building?.trim()) {
        newErrors[`floorPlans[${index}].building`] = 'Building is required.'; // Translated
        isValid = false;
      }

      const parsedFloor = parseInt(fp.floorNumber, 10);
      if (fp.floorNumber === '' || isNaN(parsedFloor)) {
        newErrors[`floorPlans[${index}].floorNumber`] =
          'Floor is required and must be numeric.'; // Translated
        isValid = false;
      }

      if (!fp.url?.trim()) {
        newErrors[`floorPlans[${index}].url`] = 'URL is required.'; // Translated
        isValid = false;
      } else {
        try {
          new URL(fp.url); // Basic URL format validation
        } catch (_) {
          newErrors[`floorPlans[${index}].url`] = 'Invalid URL format.'; // Translated
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // --- Submission (sends the entire array) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus(null);
    setErrors({}); // Clear previous errors on new submission

    if (!validateForm() || !hotelId) {
      if (!hotelId)
        setErrors((prev) => ({ ...prev, api: 'Hotel ID not found.' })); // Translated
      console.log('Validation Errors:', errors);
      setSubmitStatus('error'); // Indicate validation error
      return;
    }

    setLoading(true);

    // Prepare payload: array of objects with parsed numbers
    // IMPORTANT: Ensure payload keys match backend expectations!
    // Exclude the temporary client-side ID (tempId)
    const payload = floorPlans.map((fp) => ({
      building: fp.building,
      floorNumber: parseInt(fp.floorNumber, 10),
      planUrl: fp.url, // Map 'url' state key to 'planUrl' payload key if backend expects that
    }));

    // URL for the Batch API
    const apiUrl = `http://localhost:8090/api/floorplan/batch/hotel/${hotelId}`;
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

      const result = await response.json();
      console.log('Floor plans saved:', result);
      setSubmitStatus('success');
      // Clear the form to start a new batch after success
      setFloorPlans([{ ...initialFloorPlanRow, tempId: Date.now() }]);
    } catch (error) {
      console.error('Error saving floor plans:', error);
      setSubmitStatus('error');
      // Translated error message
      setErrors((prev) => ({
        ...prev,
        api:
          error.message ||
          'An unexpected error occurred while saving the floor plans.',
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Translated Title */}
      <h3 style={{ marginBottom: '1.5rem' }}>
        Manage Floor Plans for Hotel ID: {hotelId}
      </h3>

      <Form onSubmit={handleSubmit}>
        {/* Render the list of floor plan rows */}
        {floorPlans.map((fp, index) => (
          // Use tempId as key for React rendering
          <Grid
            key={fp.tempId}
            narrow
            style={{
              marginBottom: '1.5rem',
              paddingBottom: '1.5rem',
              borderBottom: '1px dashed #555',
            }}
          >
            {/* Row number for reference */}
            <Column lg={1} md={1} sm={4}>
              <h4 style={{ marginTop: '1.5rem' }}>#{index + 1}</h4>
            </Column>

            {/* Input fields for each floor plan property */}
            <Column lg={4} md={3} sm={4}>
              <TextInput
                id={`fp-building-${index}`} // Use state key 'building'
                name="building"
                labelText="Building (Required)" // Translated
                value={fp.building}
                onChange={(e) =>
                  handleInputChange(index, 'building', e.target.value)
                }
                invalid={!!errors[`floorPlans[${index}].building`]}
                invalidText={errors[`floorPlans[${index}].building`]}
                hideSteppers
                light
              />
            </Column>
            <Column lg={3} md={2} sm={4}>
              <NumberInput
                id={`fp-floorNumber-${index}`} // Use state key 'floorNumber'
                name="floorNumber"
                label="Floor (Required)" // Translated
                step={1}
                value={fp.floorNumber}
                onChange={(e, { value }) =>
                  handleInputChange(index, 'floorNumber', String(value))
                }
                invalid={!!errors[`floorPlans[${index}].floorNumber`]}
                invalidText={errors[`floorPlans[${index}].floorNumber`]}
                allowEmpty={false}
                hideSteppers // Keep steppers hidden
                light
              />
            </Column>
            <Column lg={6} md={4} sm={4}>
              <TextInput
                id={`fp-url-${index}`} // Use state key 'url'
                name="url"
                type="url"
                labelText="Plan URL (Required)" // Translated
                value={fp.url}
                onChange={(e) =>
                  handleInputChange(index, 'url', e.target.value)
                }
                invalid={!!errors[`floorPlans[${index}].url`]}
                invalidText={errors[`floorPlans[${index}].url`]}
                helperText="Enter full URL" // Translated
                light
              />
            </Column>

            {/* Button to remove this row */}
            <Column
              lg={2}
              md={2}
              sm={4}
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                paddingBottom: '0.5rem',
              }}
            >
              {/* Only show delete button if more than one row exists */}
              {floorPlans.length > 1 && (
                <IconButton
                  kind="danger--ghost"
                  label="Remove Row" // Translated
                  onClick={() => handleRemoveRow(index)}
                  disabled={loading} // Disable while submitting
                  renderIcon={TrashCan}
                  iconDescription="Remove Row" // Translated
                  size="md"
                />
              )}
            </Column>
          </Grid>
        ))}

        {/* Button to add a new row */}
        <Button
          kind="secondary"
          renderIcon={Add}
          iconDescription="Add Floor Plan" // Translated
          onClick={handleAddRow}
          style={{ marginTop: '1rem' }}
          disabled={loading}
        >
          Add Another Floor Plan {/* Translated */}
        </Button>

        {/* Global Submission Area & Notifications */}
        <div
          style={{
            marginTop: '2rem',
            borderTop: '1px solid #888',
            paddingTop: '1.5rem',
          }}
        >
          {loading && (
            <Loading description="Saving floor plans..." withOverlay={false} />
          )}
          {submitStatus === 'success' && (
            <InlineNotification
              kind="success"
              title="Success!"
              subtitle={`Batch of ${floorPlans.length} floor plans processed successfully.`} // Translated
              onClose={() => setSubmitStatus(null)}
              lowContrast
              style={{ marginBottom: '1rem' }}
            />
          )}
          {submitStatus === 'error' && (
            <InlineNotification
              kind="error"
              title="Save Error" // Translated
              subtitle={
                errors.api ||
                'Could not save the batch of floor plans. Please review errors in rows.'
              } // Translated
              onClose={() => {
                setSubmitStatus(null);
                setErrors((prev) => ({ ...prev, api: undefined }));
              }}
              lowContrast
              style={{ marginBottom: '1rem' }}
            />
          )}
          <Button type="submit" disabled={loading || floorPlans.length === 0}>
            {/* Translated */}
            {loading ? 'Saving...' : 'Save All Floor Plans'}
          </Button>
        </div>
      </Form>
    </div>
  );
}

export default FloorPlanForm;
