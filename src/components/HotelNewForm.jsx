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
      const response = await authenticatedFetch(`/users/available-chains`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Network response for chains was not ok: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      const formattedChains = [
        createPlaceholderItem('chain', 'chain'),
        ...data.map(c => ({ id: c.chainId.toString(), text: c.chainName }))
      ];
      
      setChains(formattedChains);
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
          const response = await authenticatedFetch(`/users/available-brands`);
          if (!response.ok) throw new Error('Network response for brands was not ok');
          const data = await response.json();
          
          // Filter brands by selected chain
          const filteredBrands = data.filter(brand => brand.chainId.toString() === selectedChain.id);
          
          setBrands(filteredBrands && filteredBrands.length > 0 ?
            [createPlaceholderItem('brand', 'brand'), ...filteredBrands.map(b => ({ id: b.brandId.toString(), text: b.brandName }))]
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
      try {
        const asYouType = new AsYouType(countryCodeISO);
        const formattedValue = asYouType.input(rawValue);
        setFormattedValue(formattedValue);
        
        // Clear error if user is typing
        if (setErrorValue) {
          setErrorValue('');
        }
      } catch (error) {
        console.warn('Error formatting phone number:', error);
        setFormattedValue(rawValue);
      }
    } else {
      setFormattedValue(rawValue);
    }
  };

  const validatePhoneNumber = (numberRaw, countryCodeISO, fieldName, setErrorFunc) => {
    if (!numberRaw || !countryCodeISO) {
      setErrorFunc('');
      return;
    }

    try {
      const phoneNumber = parsePhoneNumberFromString(numberRaw, countryCodeISO);
      if (phoneNumber && phoneNumber.isValid()) {
        setErrorFunc('');
      } else {
        setErrorFunc(`${fieldName} is not a valid phone number for the selected country.`);
      }
    } catch (error) {
      console.warn('Error validating phone number:', error);
      setErrorFunc(`${fieldName} validation failed. Please check the format.`);
    }
  };

  const getPhonePlaceholder = (countryCodeISO) => {
    if (!countryCodeISO) return 'Enter phone number...';
    
      try {
      const exampleNumber = getExampleNumber(countryCodeISO);
      if (exampleNumber) {
        return exampleNumber.formatNational();
      }
    } catch {
      console.warn('Could not get example number for country:', countryCodeISO);
    }
    
    return 'Enter phone number...';
  };

  const validateRequiredFields = () => {
    const errors = {};

    if (!selectedChain || selectedChain.id.startsWith('placeholder-')) {
      errors.selectedChain = 'Chain is required';
    }
    if (!selectedBrand || selectedBrand.id.startsWith('placeholder-') || selectedBrand.id.startsWith('select-chain-') || selectedBrand.id.startsWith('no-items-')) {
      errors.selectedBrand = 'Brand is required';
    }
    if (!hotelName.trim()) {
      errors.hotelName = 'Hotel name is required';
    }
    if (!streetAddress.trim()) {
      errors.streetAddress = 'Street address is required';
    }
    if (!selectedCountry || selectedCountry.id.startsWith('placeholder-')) {
      errors.selectedCountry = 'Country is required';
    }
    if (!stateProvince.trim()) {
      errors.stateProvince = 'State/Province is required';
    }
    if (!city.trim()) {
      errors.city = 'City is required';
    }
    if (!zipCode.trim()) {
      errors.zipCode = 'Zip/Postal code is required';
    }
    if (!mainPhoneNumberRaw.trim()) {
      errors.mainPhoneNumberRaw = 'Phone number is required';
    }
    if (!website.trim()) {
      errors.website = 'Website is required';
    }
    if (!contactFirstName.trim()) {
      errors.contactFirstName = 'Contact first name is required';
    }
    if (!contactLastName.trim()) {
      errors.contactLastName = 'Contact last name is required';
    }
    if (!contactMobilePhoneRaw.trim()) {
      errors.contactMobilePhoneRaw = 'Contact phone number is required';
    }
    if (!contactEmail.trim()) {
      errors.contactEmail = 'Contact email is required';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBlur = (field) => {
    // Clear field-specific error when user starts typing again
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateRequiredFields()) {
      setFeedback({ type: 'error', message: 'Please fill in all required fields.' });
        return;
    }
    
    setIsSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      const hotelData = {
        hotelCode: hotelCode.trim(),
        hotelName: hotelName.trim(),
        chainId: parseInt(selectedChain.id),
        chainName: selectedChain.text,
        brandId: parseInt(selectedBrand.id),
        brandName: selectedBrand.text,
        localPhone: mainPhoneNumberRaw.trim(),
        hotelWebsiteUrl: website.trim(),
        disclaimer: disclaimer.trim(),
        hotelStatus: 'A', // Active status
      mainContact: {
          firstName: contactFirstName.trim(),
          lastName: contactLastName.trim(),
          contactTitle: contactTitle.trim(),
          contactEmail: contactEmail.trim(),
          contactMobileNumber: contactMobilePhoneRaw.trim(),
          contactType: 'MAIN'
      },
      mainAddress: {
          country: selectedCountry.code,
          state: stateProvince.trim(),
          city: city.trim(),
          street: streetAddress.trim(),
          postalCode: zipCode.trim(),
          addressType: 'MAIN'
        }
    };
    
      console.log('Submitting hotel data:', hotelData);

      const response = await authenticatedFetch('/hotels/createFull', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hotelData),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        throw new Error(`HTTP ${response.status}: ${response.statusText || 'Failed to create hotel'}. ${errorData}`);
      }

      const result = await response.json();
      console.log('Hotel created successfully:', result);

      setFeedback({ 
        type: 'success', 
        message: `Hotel "${hotelName}" created successfully! Redirecting to hotel list...` 
      });

      // Redirect to hotel list after a short delay
      setTimeout(() => {
        navigate('/hotels');
      }, 2000);

    } catch (error) {
      console.error('Error creating hotel:', error);
      setFeedback({ 
        type: 'error', 
        message: `Failed to create hotel: ${error.message}` 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAttempt = () => setOpenCancelModal(true);
  const proceedWithCancel = () => {
    setOpenCancelModal(false);
    navigate('/hotels');
  };
  const closeModal = () => setOpenCancelModal(false);

  return (
    <div className="hotel-new-form-container">
      <div className="hotel-new-form-content">
        {/* Header Navigation */}
        <div className="header-navigation">
          <Button 
            kind="tertiary" 
            onClick={() => navigate("/")}
            className="nav-button"
          >
            <span className="nav-icon">🏠</span>
            Home
          </Button>
          <Button 
            kind="tertiary" 
            onClick={() => navigate("/hotels")}
            className="nav-button back-button"
          >
            <span className="nav-icon">←</span>
            Back to Properties
          </Button>
          <h1 className="page-title">Add New Property</h1>
        </div>

        {/* Loading and Notifications */}
        {isSubmitting && <Loading description="Submitting form..." withOverlay={false} className="loading-indicator" />}
      {feedback.message && (
          <div className="notification-container">
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
          <Loading description="Loading initial data..." withOverlay={false} className="loading-indicator" />}

        <Form onSubmit={handleSubmit} className="hotel-form">
          {/* Chain & Brand Information Card */}
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">Chain & Brand Information</h2>
            </div>
            <div className="section-content">
              <div className="form-row two-columns">
                <div className="form-field">
                  <FormLabel className="field-label" htmlFor="chain-dropdown">
                    Chain Name <span className="required-mark">*</span>
                  </FormLabel>
            <Dropdown
              id="selectedChain"
              titleText=""
                    placeholder={loadingChains ? "Loading..." : "Select a chain..."}
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
                    className="form-dropdown"
              disabled={loadingChains}
            />
          </div>
                <div className="form-field">
                  <FormLabel className="field-label" htmlFor="brand-dropdown">
                    Brand Name <span className="required-mark">*</span>
                  </FormLabel>
            <Dropdown
              id="selectedBrand"
              titleText=""
                    placeholder={loadingBrands ? "Loading..." : (!selectedChain || selectedChain.id.startsWith('placeholder-') ? "Select chain first" : "Select a brand...")}
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
                    className="form-dropdown"
              disabled={!selectedChain || !!selectedChain?.id.startsWith('placeholder-') || loadingBrands || !brands.length || !!brands[0]?.id.startsWith('select-chain-') || !!brands[0]?.id.startsWith('no-items-') || !!brands[0]?.id.startsWith('error-') || !!brands[0]?.id.startsWith('loading-')}
            />
          </div>
        </div>
        </div>
          </div>

          {/* Property Information Card */}
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">Property Information</h2>
        </div>
            <div className="section-content">
              {/* Country & Property Name - 2 columns */}
              <div className="form-row two-columns">
                <div className="form-field">
                  <FormLabel className="field-label" htmlFor="country-dropdown">
                    Country <span className="required-mark">*</span>
                  </FormLabel>
            <Dropdown
              id="selectedCountry"
              titleText=""
                    placeholder="Select a country..."
                    items={countryDropdownItems}
              itemToString={(item) => (item ? item.text : '')}
              onChange={({ selectedItem }) => {
                const newCountry = selectedItem.id.startsWith('placeholder-') ? null : selectedItem;
                setSelectedCountry(newCountry);
                // Clear/reformat phone numbers when changing country
                setMainPhoneNumberRaw(''); setMainPhoneNumberFormatted(''); setMainPhoneNumberError('');
                setContactMobilePhoneRaw(''); setContactMobilePhoneFormatted(''); setContactMobilePhoneError('');
                // Clear validation errors when changing country
                if (fieldErrors.selectedCountry) {
                  setFieldErrors(prev => ({ ...prev, selectedCountry: undefined }));
                }
              }}
              onBlur={() => handleBlur('selectedCountry')}
              selectedItem={selectedCountry}
              invalid={!!fieldErrors.selectedCountry}
              invalidText={fieldErrors.selectedCountry}
                    className="form-dropdown"
                  />
                </div>
                <div className="form-field">
                  <FormLabel className="field-label" htmlFor="hotel-name">
                    Property Name <span className="required-mark">*</span>
                  </FormLabel>
                  <TextInput
                    id="hotelName"
                    labelText=""
                    placeholder="Enter property name"
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                    onBlur={() => handleBlur('hotelName')}
                    invalid={!!fieldErrors.hotelName}
                    invalidText={fieldErrors.hotelName}
                    maxLength={250}
                    className="form-input"
            />
          </div>
        </div>

              {/* Street Address - Full width */}
              <div className="form-row full-width">
                <div className="form-field">
                  <FormLabel className="field-label" htmlFor="street-address">
                    Street Address <span className="required-mark">*</span>
                  </FormLabel>
            <TextInput 
                    id="streetAddress"
              labelText="" 
                    placeholder="Enter street address" 
                    value={streetAddress} 
                    onChange={(e) => setStreetAddress(e.target.value)}
                    onBlur={() => handleBlur('streetAddress')}
                    invalid={!!fieldErrors.streetAddress}
                    invalidText={fieldErrors.streetAddress}
              maxLength={250}
                    className="form-input"
            />
          </div>
        </div>

              {/* City, State, Zipcode - 3 columns */}
              <div className="form-row three-columns">
                <div className="form-field">
                  <FormLabel className="field-label" htmlFor="city">
                    City Name <span className="required-mark">*</span>
                  </FormLabel>
            <TextInput 
              id="city"
              labelText="" 
                    placeholder="Enter city name" 
              value={city} 
              onChange={(e) => setCity(e.target.value)}
              onBlur={() => handleBlur('city')}
              invalid={!!fieldErrors.city}
              invalidText={fieldErrors.city}
              maxLength={250}
                    className="form-input"
            />
          </div>
                <div className="form-field">
                  <FormLabel className="field-label" htmlFor="state-province">
                    State Name <span className="required-mark">*</span>
                  </FormLabel>
                  <TextInput 
                    id="stateProvince"
                    labelText="" 
                    placeholder="Enter state name" 
                    value={stateProvince} 
                    onChange={(e) => setStateProvince(e.target.value)}
                    onBlur={() => handleBlur('stateProvince')}
                    invalid={!!fieldErrors.stateProvince}
                    invalidText={fieldErrors.stateProvince}
                    maxLength={250}
                    className="form-input"
                  />
        </div>
                <div className="form-field">
                  <FormLabel className="field-label" htmlFor="zip-code">
                    Zipcode / Postal Code <span className="required-mark">*</span>
                  </FormLabel>
            <TextInput 
              id="zipCode"
              labelText="" 
                    placeholder="Enter zipcode" 
              value={zipCode} 
              onChange={(e) => setZipCode(e.target.value)}
              onBlur={() => handleBlur('zipCode')}
              invalid={!!fieldErrors.zipCode}
              invalidText={fieldErrors.zipCode}
              maxLength={250}
                    className="form-input"
            />
          </div>
        </div>

              {/* Phone Number & Fax Number - 2 columns */}
              <div className="form-row two-columns">
                <div className="form-field">
                  <FormLabel className="field-label" htmlFor="main-phone-number">
                    Phone Number <span className="required-mark">*</span>
                  </FormLabel>
            <TextInput
              id="mainPhoneNumberRaw"
              type="tel"
              labelText=""
              placeholder={getPhonePlaceholder(selectedCountry?.code)}
                    value={mainPhoneNumberFormatted}
              onChange={(e) => handlePhoneNumberChange(e, selectedCountry?.code, setMainPhoneNumberRaw, setMainPhoneNumberFormatted, setMainPhoneNumberError)}
              onBlur={() => {
                validatePhoneNumber(mainPhoneNumberRaw, selectedCountry?.code, "Hotel Phone", setMainPhoneNumberError);
                handleBlur('mainPhoneNumberRaw');
              }}
              invalid={!!mainPhoneNumberError || !!fieldErrors.mainPhoneNumberRaw}
              invalidText={mainPhoneNumberError || fieldErrors.mainPhoneNumberRaw}
              maxLength={250}
                    className="form-input"
                  />
                </div>
                <div className="form-field">
                  <FormLabel className="field-label" htmlFor="hotel-code">Hotel Code</FormLabel>
                  <TextInput 
                    id="hotel-code" 
                    labelText="" 
                    placeholder="Internal Hotel Code" 
                    value={hotelCode} 
                    onChange={(e) => setHotelCode(e.target.value)} 
                    className="form-input"
            />
          </div>
        </div>

              {/* Property Website - Full width */}
              <div className="form-row full-width">
                <div className="form-field">
                  <FormLabel className="field-label" htmlFor="website">
                    Property Website <span className="required-mark">*</span>
                  </FormLabel>
            <TextInput 
              id="website"
              type="url" 
              labelText="" 
                    placeholder="Enter property website URL" 
              value={website} 
              onChange={(e) => setWebsite(e.target.value)}
              onBlur={() => handleBlur('website')}
              invalid={!!fieldErrors.website}
              invalidText={fieldErrors.website}
              maxLength={250}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Disclaimer - Full width */}
              <div className="form-row full-width">
                <div className="form-field">
                  <FormLabel className="field-label" htmlFor="disclaimer">Disclaimer</FormLabel>
                  <TextInput 
                    id="disclaimer" 
                    labelText="" 
                    placeholder="Short disclaimer text" 
                    value={disclaimer} 
                    onChange={(e) => setDisclaimer(e.target.value)} 
                    className="form-input"
            />
          </div>
        </div>
            </div>
        </div>

          {/* Contact Information Card */}
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">Contact Information</h2>
            </div>
            <div className="section-content">
              <div className="form-row two-columns">
                <div className="form-field">
                  <FormLabel className="field-label" htmlFor="contact-first-name">
                    First Name <span className="required-mark">*</span>
                  </FormLabel>
            <TextInput
              id="contactFirstName"
              labelText=""
                    placeholder="Enter first name"
              value={contactFirstName}
              onChange={(e) => setContactFirstName(e.target.value)}
              onBlur={() => handleBlur('contactFirstName')}
              invalid={!!fieldErrors.contactFirstName}
              invalidText={fieldErrors.contactFirstName}
              maxLength={250}
                    className="form-input"
            />
          </div>
                <div className="form-field">
                  <FormLabel className="field-label" htmlFor="contact-last-name">
                    Last Name <span className="required-mark">*</span>
                  </FormLabel>
            <TextInput
              id="contactLastName"
              labelText=""
                    placeholder="Enter last name"
              value={contactLastName}
              onChange={(e) => setContactLastName(e.target.value)}
              onBlur={() => handleBlur('contactLastName')}
              invalid={!!fieldErrors.contactLastName}
              invalidText={fieldErrors.contactLastName}
              maxLength={250}
                    className="form-input"
            />
          </div>
        </div>
              <div className="form-row full-width">
                <div className="form-field">
                  <FormLabel className="field-label" htmlFor="contact-title">Title</FormLabel>
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
                    className="form-input"
            />
          </div>
        </div>
              <div className="form-row two-columns">
                <div className="form-field">
                  <FormLabel className="field-label" htmlFor="contact-mobile-phone">
                    Phone Number <span className="required-mark">*</span>
                  </FormLabel>
            <TextInput
              id="contactMobilePhoneRaw"
              type="tel"
              labelText=""
              placeholder={getPhonePlaceholder(selectedCountry?.code)}
                    value={contactMobilePhoneFormatted}
              onChange={(e) => handlePhoneNumberChange(e, selectedCountry?.code, setContactMobilePhoneRaw, setContactMobilePhoneFormatted, setContactMobilePhoneError)}
              onBlur={() => {
                validatePhoneNumber(contactMobilePhoneRaw, selectedCountry?.code, "Contact Phone", setContactMobilePhoneError);
                handleBlur('contactMobilePhoneRaw');
              }}
              invalid={!!contactMobilePhoneError || !!fieldErrors.contactMobilePhoneRaw}
              invalidText={contactMobilePhoneError || fieldErrors.contactMobilePhoneRaw}
              maxLength={250}
                    className="form-input"
            />
          </div>
                <div className="form-field">
                  <FormLabel className="field-label" htmlFor="contact-email">
                    Email <span className="required-mark">*</span>
                  </FormLabel>
            <TextInput
              id="contactEmail"
              type="email"
              labelText=""
                    placeholder="Enter email address"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              onBlur={() => handleBlur('contactEmail')}
              invalid={!!fieldErrors.contactEmail}
              invalidText={fieldErrors.contactEmail}
              maxLength={250}
                    className="form-input"
            />
                </div>
              </div>
          </div>
        </div>

          {/* Form Actions */}
          <div className="form-actions">
            <Button 
              kind="secondary" 
              type="button" 
              onClick={handleCancelAttempt} 
              disabled={isSubmitting}
              className="cancel-button"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              kind="primary" 
              disabled={isSubmitting || loadingChains || loadingBrands}
              className="submit-button"
            >
              {isSubmitting ? 'Saving...' : 'Save Property'}
          </Button>
        </div>
      </Form>
      </div>

      {/* Cancel Confirmation Modal */}
      <ComposedModal open={openCancelModal} onClose={closeModal} preventCloseOnClickOutside={false} size="sm">
        <ModalHeader title="Discard Changes?" closeModal={closeModal} />
        <ModalBody>
          <p style={{ marginBottom: '1rem' }}>This action will discard ALL unsaved changes.</p>
          <p>Are you sure you want to proceed?</p>
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" onClick={closeModal}>No</Button>
          <Button kind="danger" onClick={proceedWithCancel}>Yes, Discard</Button>
        </ModalFooter>
      </ComposedModal>
    </div>
  );
}

import './HotelNewForm.css';

export default HotelNewForm;