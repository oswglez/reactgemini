// src/components/forms/HotelNewForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  FormLabel,
  TextInput,
  Dropdown,
  Button,
  InlineNotification,
  Loading,
  ComposedModal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@carbon/react';
import { getData as getCountryDataList } from 'country-list'; // Renamed for clarity
import {
  AsYouType,
  getExampleNumber,
  parsePhoneNumberFromString,
  getCountryCallingCode
} from 'libphonenumber-js';
import { useAuthenticatedFetch } from '../services/apiService';

// --- Styles (unchanged) ---
const formContainerStyle = {
  padding: '2rem',
  maxWidth: '960px',
  minWidth: '700px',
  margin: '2rem auto',
  backgroundColor: '#ffffff',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
};
const formRowStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  marginBottom: '1.5rem',
  gap: '1.5rem',
};
const labelStyle = {
  flex: '0 0 200px',
  paddingTop: '0.5rem',
  textAlign: 'left',
  fontSize: '0.875rem',
  color: '#161616',
  lineHeight: '1.4',
  wordBreak: 'break-word',
};
const inputContainerStyle = {
  flex: '1 1 auto',
  minWidth: '250px',
};
const formSectionTitleStyle = {
  fontSize: '1.375rem',
  fontWeight: 600,
  marginTop: '2.5rem',
  marginBottom: '1.5rem',
  paddingBottom: '0.75rem',
  borderBottom: '1px solid #dfe3e6',
  color: '#161616',
};
const buttonContainerStyle = {
  marginTop: '3rem',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '1rem',
};

// --- Helper functions for Dropdown Placeholders (unchanged) ---
const createPlaceholderItem = (idSuffix, text) => ({ id: `placeholder-${idSuffix}`, text: `Select a ${text}...` });
const createLoadingItem = (idSuffix, text) => ({ id: `loading-${idSuffix}`, text: `Loading ${text}...` });
const createErrorItem = (idSuffix, text) => ({ id: `error-${idSuffix}`, text: `Error loading ${text}` });
const createSelectChainFirstItem = () => ({ id: `select-chain-brand`, text: 'Select chain first...' });
const createNoItemsItem = (idSuffix, text) => ({ id: `no-items-${idSuffix}`, text: `No ${text} available` });


function HotelNewForm() {
  const navigate = useNavigate();
  const authenticatedFetch = useAuthenticatedFetch();

  const [chains, setChains] = useState([createLoadingItem('chains', 'chains')]);
  const [selectedChain, setSelectedChain] = useState(null);
  const [brands, setBrands] = useState([createSelectChainFirstItem()]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [loadingChains, setLoadingChains] = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(false);

  // State for country list, now loaded dynamically
  const [countryDropdownItems, setCountryDropdownItems] = useState([createLoadingItem('country', 'countries')]);

  const [hotelCode, setHotelCode] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null); // Stores the object {id: 'US', text: 'United States (+1)', code: 'US'}
  const [stateProvince, setStateProvince] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [mainPhoneNumberRaw, setMainPhoneNumberRaw] = useState('');
  const [mainPhoneNumberFormatted, setMainPhoneNumberFormatted] = useState('');
  const [mainPhoneNumberError, setMainPhoneNumberError] = useState('');
  const [website, setWebsite] = useState('');
  const [disclaimer, setDisclaimer] = useState('');

  const [contactFirstName, setContactFirstName] = useState('');
  const [contactLastName, setContactLastName] = useState('');
  const [contactTitle, setContactTitle] = useState('');
  const [contactMobilePhoneRaw, setContactMobilePhoneRaw] = useState('');
  const [contactMobilePhoneFormatted, setContactMobilePhoneFormatted] = useState('');
  const [contactMobilePhoneError, setContactMobilePhoneError] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openCancelModal, setOpenCancelModal] = useState(false);
  // 1. Add state for per-field errors
  const [fieldErrors, setFieldErrors] = useState({});

  // Load country list on component mount
  useEffect(() => {
    try {
      const rawCountries = getCountryDataList(); // Gets [{code: 'US', name: 'United States'}, ...]
      const formattedCountries = rawCountries.map(country => {
        let label = country.name;
        try {
          // `getCountryCallingCode` expects a valid 2-letter ISO code.
          // `country-list` should provide valid codes.
          const callingCode = getCountryCallingCode(country.code);
          label = `${country.name} (+${callingCode})`;
        } catch (e) {
          console.log('Error loading country list:', e);
          console.warn(`Could not get calling code for country: ${country.name} (${country.code})`);
        }
        return { id: country.code, text: label, code: country.code }; // Also store the original ISO code
      }).sort((a, b) => a.text.localeCompare(b.text)); // Sort alphabetically
      setCountryDropdownItems([createPlaceholderItem('country', 'country'), ...formattedCountries]);
    } catch (error) {
      console.error("Error loading country list:", error);
      setCountryDropdownItems([createErrorItem('country', 'countries')]);
    }
  }, []);

  const fetchChainsData = useCallback(async () => {
    setLoadingChains(true);
    try {
      const response = await authenticatedFetch(`/chain`);
      if (!response.ok) throw new Error('Network response for chains was not ok');
      const data = await response.json();
      setChains([
        createPlaceholderItem('chain', 'chain'),
        ...data.map(c => ({ id: c.chainId.toString(), text: c.chainName }))
      ]);
    } catch (error) {
      console.error("Error fetching chains:", error);
      setChains([createErrorItem('chains', 'chains')]);
      setFeedback({ type: 'error', message: `Error loading chains: ${error.message}` });
    } finally {
      setLoadingChains(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    fetchChainsData();
  }, [fetchChainsData]);

  useEffect(() => {
    if (selectedChain && selectedChain.id && !selectedChain.id.startsWith('placeholder-')) {
      const fetchBrandsData = async () => {
        setLoadingBrands(true);
        setBrands([createLoadingItem('brands', 'brands')]);
        try {
          const response = await authenticatedFetch(`/chain/${selectedChain.id}/brands`);
          if (!response.ok) throw new Error('Network response for brands was not ok');
          const data = await response.json();
          setBrands(data && data.length > 0 ?
            [createPlaceholderItem('brand', 'brand'), ...data.map(b => ({ id: b.brandId.toString(), text: b.brandName }))]
            : [createNoItemsItem('brands', 'brands for this chain')]
          );
        } catch (error) {
          console.error("Error fetching brands:", error);
          setBrands([createErrorItem('brands', 'brands')]);
          setFeedback({ type: 'error', message: `Error loading brands: ${error.message}` });
        } finally {
          setLoadingBrands(false);
        }
      };
      fetchBrandsData();
    } else {
      setBrands([createSelectChainFirstItem()]);
    }
    setSelectedBrand(null);
  }, [selectedChain, authenticatedFetch]);

  const handlePhoneNumberChange = (e, countryCodeISO, setRawValue, setFormattedValue, setErrorValue) => {
    const rawValue = e.target.value;
    setRawValue(rawValue); // Always update the raw value

    if (countryCodeISO) {
      const formatter = new AsYouType(countryCodeISO);
      // Format the entire raw value each time to handle pastes and deletes correctly
      for (const char of rawValue) {
        if (/\d/.test(char) || char === '+') {
          formatter.input(char);
        } else {
          // For other characters (like spaces, parentheses the user might type)
          // AsYouType handles them internally, but if we want stricter control
          // we could filter them here or just let AsYouType do its job.
          // For now, we trust AsYouType. If the user types invalid chars,
          // formatting may stop or behave oddly.
          // Final validation in onBlur/submit will catch it.
        }
      }
      // If rawValue is empty after the loop (e.g., only had invalid chars),
      // AsYouType's `formatted` may not be empty if it had formatted something before.
      // So, better to format the whole rawValue.
      const finalFormatter = new AsYouType(countryCodeISO);
      setFormattedValue(finalFormatter.input(rawValue));

      setErrorValue(''); // Clear error while typing
    } else {
      setFormattedValue(rawValue); // No country, show raw as formatted
      if (rawValue) { // Only show error if something is typed and no country
        setErrorValue('Please select a country first to format/validate phone number.');
      } else {
        setErrorValue('');
      }
    }
  };

  const validatePhoneNumber = (numberRaw, countryCodeISO, fieldName, setErrorFunc) => {
    if (!numberRaw || numberRaw.trim() === '') { // If the field is empty
      setErrorFunc(''); // No number, no error (unless explicitly required)
      return null; // Return null so it is not sent
    }
    if (!countryCodeISO) {
      setErrorFunc(`${fieldName}: Select a country to validate phone.`);
      return null; 
    }
    try {
      const phoneNumber = parsePhoneNumberFromString(numberRaw, countryCodeISO);
      if (phoneNumber && phoneNumber.isValid()) {
        setErrorFunc('');
        return phoneNumber.format('E.164');
      } else {
        setErrorFunc(`${fieldName}: Invalid phone number for selected country.`);
        return null;
      }
    } catch (error) {
      console.error(`Phone validation error for ${fieldName}:`, error);
      setErrorFunc(`${fieldName}: Error validating phone number.`);
      return null;
    }
  };

  const getPhonePlaceholder = (countryCodeISO) => {
    if (countryCodeISO) {
      try {
        const example = getExampleNumber(countryCodeISO, 'NATIONAL');
        if (example) return example.formatNational();
      } catch (e) { /* Do nothing if no example */ }
    }
    return 'Enter phone number';
  };

  const resetFormFields = useCallback(() => {
    setSelectedChain(null);
    setHotelCode('');
    setHotelName('');
    setStreetAddress('');
    setSelectedCountry(null); // This will also clear phone placeholders
    setStateProvince('');
    setCity('');
    setZipCode('');
    setMainPhoneNumberRaw('');
    setMainPhoneNumberFormatted('');
    setMainPhoneNumberError('');
    setWebsite('');
    setDisclaimer('');
    setContactFirstName('');
    setContactLastName('');
    setContactTitle('');
    setContactMobilePhoneRaw('');
    setContactMobilePhoneFormatted('');
    setContactMobilePhoneError('');
    setContactEmail('');
    fetchChainsData();
  }, [fetchChainsData]);

  // Validate all required fields before submitting the form
  const validateRequiredFields = () => {
    const errors = {};

    if (!hotelName.trim()) errors.hotelName = "Hotel name is required.";
    if (hotelName.length > 250) errors.hotelName = "Hotel name cannot exceed 250 characters.";
    if (!selectedChain || !selectedChain.id || selectedChain.id.startsWith('placeholder-')) errors.selectedChain = "Chain is required.";
    if (!selectedBrand || !selectedBrand.id || selectedBrand.id.startsWith('placeholder-')) errors.selectedBrand = "Brand is required.";
    if (!streetAddress.trim()) errors.streetAddress = "Street address is required.";
    if (streetAddress.length > 250) errors.streetAddress = "Street address cannot exceed 250 characters.";
    if (!selectedCountry || !selectedCountry.id || selectedCountry.id.startsWith('placeholder-')) errors.selectedCountry = "Country is required.";
    if (!stateProvince.trim()) errors.stateProvince = "State/Province is required.";
    if (stateProvince.length > 250) errors.stateProvince = "State/Province cannot exceed 250 characters.";
    if (!city.trim()) errors.city = "City is required.";
    if (city.length > 250) errors.city = "City cannot exceed 250 characters.";
    if (!zipCode.trim()) errors.zipCode = "ZIP/Postal code is required.";
    if (zipCode.length > 250) errors.zipCode = "ZIP/Postal code cannot exceed 250 characters.";
    if (!mainPhoneNumberRaw.trim()) errors.mainPhoneNumberRaw = "Main phone number is required.";
    if (mainPhoneNumberRaw.length > 250) errors.mainPhoneNumberRaw = "Main phone number cannot exceed 250 characters.";
    if (!website.trim()) errors.website = "Website is required.";
    if (website.length > 250) errors.website = "Website cannot exceed 250 characters.";
    if (!contactFirstName.trim()) errors.contactFirstName = "Contact first name is required.";
    if (contactFirstName.length > 250) errors.contactFirstName = "Contact first name cannot exceed 250 characters.";
    if (!contactLastName.trim()) errors.contactLastName = "Contact last name is required.";
    if (contactLastName.length > 250) errors.contactLastName = "Contact last name cannot exceed 250 characters.";
    if (!contactTitle.trim()) errors.contactTitle = "Contact title is required.";
    if (contactTitle.length > 250) errors.contactTitle = "Contact title cannot exceed 250 characters.";
    if (!contactMobilePhoneRaw.trim()) errors.contactMobilePhoneRaw = "Contact mobile phone is required.";
    if (contactMobilePhoneRaw.length > 250) errors.contactMobilePhoneRaw = "Contact mobile phone cannot exceed 250 characters.";
    if (!contactEmail.trim()) errors.contactEmail = "Contact email is required.";
    if (contactEmail.length > 250) errors.contactEmail = "Contact email cannot exceed 250 characters.";

    return errors;
  };

  const handleBlur = (field) => {
    const errors = validateRequiredFields();
    setFieldErrors(prev => ({ ...prev, [field]: errors[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    const currentCountryCode = selectedCountry ? selectedCountry.code : null;

    // Force final validation before submitting
    const finalValidatedMainPhone = validatePhoneNumber(mainPhoneNumberRaw, currentCountryCode, "Hotel Phone", setMainPhoneNumberError);
    const finalValidatedContactPhone = validatePhoneNumber(contactMobilePhoneRaw, currentCountryCode, "Contact Phone", setContactMobilePhoneError);

    // Check if phone validations produced errors
    let phoneValidationFailed = false;
    if (mainPhoneNumberRaw && !finalValidatedMainPhone) {
        setMainPhoneNumberError("Hotel Phone: Invalid phone number for selected country."); // Re-ensure error message
        phoneValidationFailed = true;
    }
    if (contactMobilePhoneRaw && !finalValidatedContactPhone) {
        setContactMobilePhoneError("Contact Phone: Invalid phone number for selected country."); // Re-ensure error message
        phoneValidationFailed = true;
    }

    const errors = validateRequiredFields();
    if (Object.keys(errors).length > 0) {
      // Only show the first error (top-down)
      const firstErrorKey = Object.keys(errors)[0];
      setFieldErrors(errors);
      setFeedback({ type: 'error', message: errors[firstErrorKey] });
      // Focus and scroll to the first error field
      setTimeout(() => {
        const el = document.getElementById(firstErrorKey);
        if (el) el.focus();
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);
      return;
    }
    
    if (phoneValidationFailed) {
        setFeedback({ type: 'error', message: 'Please correct the invalid phone numbers before submitting.' });
        setIsSubmitting(false); // Ensure isSubmitting is reset
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    
    setIsSubmitting(true);

    const formData = {
      hotelCode: hotelCode || null,
      hotelName,
      hotelStatus: 'P',
      brandId: parseInt(selectedBrand.id, 10),
      localPhone: finalValidatedMainPhone, // Use the validated and formatted number in E.164
      disclaimer: disclaimer || null,
      hotelWebsiteUrl: website || null,
      mainContact: {
        firstName: contactFirstName,
        lastName: contactLastName,
        contactTitle: contactTitle || null,
        contactEmail,
        contactMobileNumber: finalValidatedContactPhone, // Use the validated and formatted number in E.164
        contactType: 'MAIN',
      },
      mainAddress: {
        country: currentCountryCode,
        state: stateProvince || null,
        city: city || null,
        street: streetAddress || null,
        postalCode: zipCode || null,
        addressType: 'MAIN',
      },
    };
    
    console.log('Submitting Form Data to Backend:', JSON.stringify(formData, null, 2));

    try {
      const response = await authenticatedFetch('/hotels/createFull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API Error ${response.status}: ${errorBody || response.statusText}`);
      }
      const result = await response.json();
      setFeedback({ type: 'success', message: `Hotel "${result.hotelName || formData.hotelName}" created successfully! (ID: ${result.hotelId || 'N/A'})` });
      resetFormFields();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => navigate(-1), 2500);
    } catch (error) {
      console.error('Error submitting hotel creation form:', error);
      setFeedback({ type: 'error', message: `Error creating hotel: ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAttempt = () => setOpenCancelModal(true);
  const proceedWithCancel = () => {
    resetFormFields();
    setFeedback({ type: '', message: '' });
    setOpenCancelModal(false);
    navigate(-1);
  };
  const closeModal = () => setOpenCancelModal(false);

  return (
    <div style={formContainerStyle}>
      <h1 style={{ marginBottom: '0.5rem', color: '#161616' }}>Hotel Configuration</h1>
      <p style={{ marginBottom: '2rem', color: '#525252', fontSize: '0.875rem' }}>
        Complete the hotel configuration... Fields marked with (<span style={{ color: 'red' }}>*</span>) are required.
      </p>

      {isSubmitting && <Loading description="Submitting form..." withOverlay={false} style={{ marginBottom: '1rem' }} />}
      {feedback.message && (
        <div style={{ marginBottom: '1rem' }}>
          <InlineNotification
            kind={feedback.type === 'error' ? 'error' : 'success'}
            title={feedback.type === 'error' ? 'Submission Error' : 'Success'}
            subtitle={feedback.message}
            onCloseButtonClick={() => setFeedback({ type: '', message: '' })}
            lowContrast={true}
          />
        </div>
      )}
      {loadingChains && !isSubmitting &&
        <Loading description="Loading initial data..." withOverlay={false} style={{ marginBottom: '1rem' }} />}

      <Form onSubmit={handleSubmit}>
        {/* --- Chain & Brand Section (unchanged from last version) --- */}
        <h2 style={formSectionTitleStyle}>Chain & Brand</h2>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="chain-dropdown">Chain <span style={{ color: 'red' }}>*</span></FormLabel>
          <div style={inputContainerStyle}>
            <Dropdown
              id="selectedChain"
              titleText=""
              label={loadingChains ? "Loading..." : (chains[0]?.text || "Select a chain...")}
              items={chains}
              itemToString={(item) => (item ? item.text : '')}
              onChange={({ selectedItem }) => {
                const newChain = selectedItem && !selectedItem.id.startsWith('placeholder-') ? selectedItem : null;
                setSelectedChain(newChain);
                if (fieldErrors.selectedChain) {
                  setFieldErrors(prev => ({ ...prev, selectedChain: undefined }));
                }
              }}
              onBlur={() => handleBlur('selectedChain')}
              selectedItem={selectedChain}
              invalid={!!fieldErrors.selectedChain}
              invalidText={fieldErrors.selectedChain}
              style={{ width: '100%' }}
              disabled={loadingChains}
            />
          </div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="brand-dropdown">Brand <span style={{ color: 'red' }}>*</span></FormLabel>
          <div style={inputContainerStyle}>
            <Dropdown
              id="selectedBrand"
              titleText=""
              label={loadingBrands ? "Loading..." : (!selectedChain || selectedChain.id.startsWith('placeholder-') ? "Select chain first" : (brands[0]?.text || "Select a brand..."))}
              items={brands}
              itemToString={(item) => (item ? item.text : '')}
              onChange={({ selectedItem }) => {
                const newBrand = selectedItem && !selectedItem.id.startsWith('placeholder-') && !selectedItem.id.startsWith('select-chain-') && !selectedItem.id.startsWith('no-items-') ? selectedItem : null;
                setSelectedBrand(newBrand);
                if (fieldErrors.selectedBrand) {
                  setFieldErrors(prev => ({ ...prev, selectedBrand: undefined }));
                }
              }}
              onBlur={() => handleBlur('selectedBrand')}
              selectedItem={selectedBrand}
              invalid={!!fieldErrors.selectedBrand}
              invalidText={fieldErrors.selectedBrand}
              style={{ width: '100%' }}
              disabled={!selectedChain || !!selectedChain?.id.startsWith('placeholder-') || loadingBrands || !brands.length || !!brands[0]?.id.startsWith('select-chain-') || !!brands[0]?.id.startsWith('no-items-') || !!brands[0]?.id.startsWith('error-') || !!brands[0]?.id.startsWith('loading-')}
            />
          </div>
        </div>

        {/* --- Property Info Section --- */}
        <h2 style={formSectionTitleStyle}>Property Info</h2>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="hotel-code">Hotel Code</FormLabel>
          <div style={inputContainerStyle}><TextInput id="hotel-code" labelText="" placeholder="Internal Hotel Code" value={hotelCode} onChange={(e) => setHotelCode(e.target.value)} style={{ width: '100%' }}/></div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="hotel-name">Name <span style={{color: 'red'}}>*</span></FormLabel>
          <div style={inputContainerStyle}>
            <TextInput
              id="hotelName"
              labelText=""
              placeholder="Official Property Name"
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              onBlur={() => handleBlur('hotelName')}
              invalid={!!fieldErrors.hotelName}
              invalidText={fieldErrors.hotelName}
              maxLength={250}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="street-address">Street Address <span style={{color: 'red'}}>*</span></FormLabel>
          <div style={inputContainerStyle}>
            <TextInput 
              id="streetAddress"
              labelText="" 
              placeholder="e.g., 123 Main St" 
              value={streetAddress} 
              onChange={(e) => setStreetAddress(e.target.value)}
              onBlur={() => handleBlur('streetAddress')}
              invalid={!!fieldErrors.streetAddress}
              invalidText={fieldErrors.streetAddress}
              maxLength={250}
              style={{ width: '100%' }} 
            />
          </div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="country-dropdown">Country <span style={{color: 'red'}}>*</span></FormLabel>
          <div style={inputContainerStyle}>
            <Dropdown
              id="selectedCountry"
              titleText=""
              label={selectedCountry ? selectedCountry.text : (countryDropdownItems[0]?.text || "Select a country...")}
              items={countryDropdownItems} // Use the loaded country list
              itemToString={(item) => (item ? item.text : '')}
              onChange={({ selectedItem }) => {
                const newCountry = selectedItem.id.startsWith('placeholder-') ? null : selectedItem;
                setSelectedCountry(newCountry);
                const newCountryCode = newCountry ? newCountry.code : null;
                // Clear/reformat phone numbers when changing country
                setMainPhoneNumberRaw(''); setMainPhoneNumberFormatted(''); setMainPhoneNumberError('');
                setContactMobilePhoneRaw(''); setContactMobilePhoneFormatted(''); setContactMobilePhoneError('');
                // Clear validation errors when changing country
                if (fieldErrors.selectedCountry) {
                  setFieldErrors(prev => ({ ...prev, selectedCountry: undefined }));
                }
                // Update placeholders
                if (newCountryCode) {
                    // This doesn't work directly, TextInput placeholders don't update this way.
                    // The placeholder is passed in the TextInput prop `placeholder`.
                }
              }}
              onBlur={() => handleBlur('selectedCountry')}
              selectedItem={selectedCountry}
              invalid={!!fieldErrors.selectedCountry}
              invalidText={fieldErrors.selectedCountry}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="state-province">State / Province <span style={{color: 'red'}}>*</span></FormLabel>
          <div style={inputContainerStyle}>
            <TextInput 
              id="stateProvince"
              labelText="" 
              placeholder="e.g., California" 
              value={stateProvince} 
              onChange={(e) => setStateProvince(e.target.value)}
              onBlur={() => handleBlur('stateProvince')}
              invalid={!!fieldErrors.stateProvince}
              invalidText={fieldErrors.stateProvince}
              maxLength={250}
              style={{ width: '100%' }} 
            />
          </div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="city">City <span style={{color: 'red'}}>*</span></FormLabel>
          <div style={inputContainerStyle}>
            <TextInput 
              id="city"
              labelText="" 
              placeholder="e.g., New York" 
              value={city} 
              onChange={(e) => setCity(e.target.value)}
              onBlur={() => handleBlur('city')}
              invalid={!!fieldErrors.city}
              invalidText={fieldErrors.city}
              maxLength={250}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="zip-code">Zip Code / Postal Code <span style={{color: 'red'}}>*</span></FormLabel>
          <div style={inputContainerStyle}>
            <TextInput 
              id="zipCode"
              labelText="" 
              placeholder="e.g., 10001" 
              value={zipCode} 
              onChange={(e) => setZipCode(e.target.value)}
              onBlur={() => handleBlur('zipCode')}
              invalid={!!fieldErrors.zipCode}
              invalidText={fieldErrors.zipCode}
              maxLength={250}
              style={{ width: '100%' }} 
            />
          </div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="main-phone-number">Phone Number <span style={{color: 'red'}}>*</span></FormLabel>
          <div style={inputContainerStyle}>
            <TextInput
              id="mainPhoneNumberRaw"
              type="tel"
              labelText=""
              placeholder={getPhonePlaceholder(selectedCountry?.code)}
              value={mainPhoneNumberFormatted} // Always show formatted value
              onChange={(e) => handlePhoneNumberChange(e, selectedCountry?.code, setMainPhoneNumberRaw, setMainPhoneNumberFormatted, setMainPhoneNumberError)}
              onBlur={() => {
                validatePhoneNumber(mainPhoneNumberRaw, selectedCountry?.code, "Hotel Phone", setMainPhoneNumberError);
                handleBlur('mainPhoneNumberRaw');
              }}
              invalid={!!mainPhoneNumberError || !!fieldErrors.mainPhoneNumberRaw}
              invalidText={mainPhoneNumberError || fieldErrors.mainPhoneNumberRaw}
              maxLength={250}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="website">Website <span style={{color: 'red'}}>*</span></FormLabel>
          <div style={inputContainerStyle}>
            <TextInput 
              id="website"
              type="url" 
              labelText="" 
              placeholder="e.g., https://www.example.com" 
              value={website} 
              onChange={(e) => setWebsite(e.target.value)}
              onBlur={() => handleBlur('website')}
              invalid={!!fieldErrors.website}
              invalidText={fieldErrors.website}
              maxLength={250}
              style={{ width: '100%' }} 
            />
          </div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="disclaimer">Disclaimer</FormLabel>
          <div style={inputContainerStyle}><TextInput id="disclaimer" labelText="" placeholder="Short disclaimer text" value={disclaimer} onChange={(e) => setDisclaimer(e.target.value)} style={{ width: '100%' }} /></div>
        </div>

        {/* --- Contact Info (Main Contact) Section --- */}
        <h2 style={formSectionTitleStyle}>Contact Info (Main Contact)</h2>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="contact-first-name">First Name <span style={{color: 'red'}}>*</span></FormLabel>
          <div style={inputContainerStyle}>
            <TextInput
              id="contactFirstName"
              labelText=""
              placeholder="Contact's first name"
              value={contactFirstName}
              onChange={(e) => setContactFirstName(e.target.value)}
              onBlur={() => handleBlur('contactFirstName')}
              invalid={!!fieldErrors.contactFirstName}
              invalidText={fieldErrors.contactFirstName}
              maxLength={250}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="contact-last-name">Last Name <span style={{color: 'red'}}>*</span></FormLabel>
          <div style={inputContainerStyle}>
            <TextInput
              id="contactLastName"
              labelText=""
              placeholder="Contact's last name"
              value={contactLastName}
              onChange={(e) => setContactLastName(e.target.value)}
              onBlur={() => handleBlur('contactLastName')}
              invalid={!!fieldErrors.contactLastName}
              invalidText={fieldErrors.contactLastName}
              maxLength={250}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="contact-title">Title</FormLabel>
          <div style={inputContainerStyle}>
            <TextInput
              id="contactTitle"
              labelText=""
              placeholder="e.g., General Manager"
              value={contactTitle}
              onChange={(e) => setContactTitle(e.target.value)}
              onBlur={() => handleBlur('contactTitle')}
              invalid={!!fieldErrors.contactTitle}
              invalidText={fieldErrors.contactTitle}
              maxLength={250}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="contact-mobile-phone">Phone Number <span style={{color: 'red'}}>*</span></FormLabel>
          <div style={inputContainerStyle}>
            <TextInput
              id="contactMobilePhoneRaw"
              type="tel"
              labelText=""
              placeholder={getPhonePlaceholder(selectedCountry?.code)}
              value={contactMobilePhoneFormatted} // Always show formatted value
              onChange={(e) => handlePhoneNumberChange(e, selectedCountry?.code, setContactMobilePhoneRaw, setContactMobilePhoneFormatted, setContactMobilePhoneError)}
              onBlur={() => {
                validatePhoneNumber(contactMobilePhoneRaw, selectedCountry?.code, "Contact Phone", setContactMobilePhoneError);
                handleBlur('contactMobilePhoneRaw');
              }}
              invalid={!!contactMobilePhoneError || !!fieldErrors.contactMobilePhoneRaw}
              invalidText={contactMobilePhoneError || fieldErrors.contactMobilePhoneRaw}
              maxLength={250}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="contact-email">Email <span style={{color: 'red'}}>*</span></FormLabel>
          <div style={inputContainerStyle}>
            <TextInput
              id="contactEmail"
              type="email"
              labelText=""
              placeholder="e.g., contact@example.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              onBlur={() => handleBlur('contactEmail')}
              invalid={!!fieldErrors.contactEmail}
              invalidText={fieldErrors.contactEmail}
              maxLength={250}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div style={buttonContainerStyle}>
          <Button kind="secondary" type="button" onClick={handleCancelAttempt} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" kind="primary" disabled={isSubmitting || loadingChains || loadingBrands}>
            {isSubmitting ? 'Saving...' : 'Save Hotel'}
          </Button>
        </div>
      </Form>

      <ComposedModal open={openCancelModal} onClose={closeModal} preventCloseOnClickOutside={false} size="sm">
        <ModalHeader title="Discard Changes?" closeModal={closeModal} />
        <ModalBody><p style={{ marginBottom: '1rem' }}>This action will discard ALL unsaved changes.</p><p>Are you sure you want to proceed?</p></ModalBody>
        <ModalFooter><Button kind="secondary" onClick={closeModal}>No</Button><Button kind="danger" onClick={proceedWithCancel}>Yes, Discard</Button></ModalFooter>
      </ComposedModal>
    </div>
  );
}

export default HotelNewForm;