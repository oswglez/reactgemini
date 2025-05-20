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
import { getData as getCountryDataList } from 'country-list'; // Renombrado para claridad
import {
  AsYouType,
  getExampleNumber,
  parsePhoneNumberFromString,
  getCountryCallingCode,
  isValidPhoneNumber,
} from 'libphonenumber-js';

// --- Estilos (sin cambios) ---
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

// --- Funciones Helper para Dropdown Placeholders (sin cambios) ---
const createPlaceholderItem = (idSuffix, text) => ({ id: `placeholder-${idSuffix}`, text: `Select a ${text}...` });
const createLoadingItem = (idSuffix, text) => ({ id: `loading-${idSuffix}`, text: `Loading ${text}...` });
const createErrorItem = (idSuffix, text) => ({ id: `error-${idSuffix}`, text: `Error loading ${text}` });
const createSelectChainFirstItem = () => ({ id: `select-chain-brand`, text: 'Select chain first...' });
const createNoItemsItem = (idSuffix, text) => ({ id: `no-items-${idSuffix}`, text: `No ${text} available` });


function HotelNewForm() {
  const navigate = useNavigate();

  const [chains, setChains] = useState([createLoadingItem('chains', 'chains')]);
  const [selectedChain, setSelectedChain] = useState(null);
  const [brands, setBrands] = useState([createSelectChainFirstItem()]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [loadingChains, setLoadingChains] = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(false);

  // Estado para la lista de países, ahora se cargará dinámicamente
  const [countryDropdownItems, setCountryDropdownItems] = useState([createLoadingItem('country', 'countries')]);

  const [hotelCode, setHotelCode] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null); // Almacena el objeto {id: 'US', text: 'United States (+1)', code: 'US'}
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

  // Cargar lista de países al montar el componente
  useEffect(() => {
    try {
      const rawCountries = getCountryDataList(); // Obtiene [{code: 'US', name: 'United States'}, ...]
      const formattedCountries = rawCountries.map(country => {
        let label = country.name;
        try {
          // `getCountryCallingCode` espera un código ISO de 2 letras válido.
          // `country-list` debería proporcionar códigos válidos.
          const callingCode = getCountryCallingCode(country.code);
          label = `${country.name} (+${callingCode})`;
        } catch (e) {
          // Algunos códigos de `country-list` podrían no ser reconocidos por `libphonenumber-js`
          // o ser regiones sin código de llamada directo.
          console.warn(`Could not get calling code for country: ${country.name} (${country.code})`);
        }
        return { id: country.code, text: label, code: country.code }; // Guardamos el código ISO original también
      }).sort((a, b) => a.text.localeCompare(b.text)); // Ordenar alfabéticamente

      setCountryDropdownItems([createPlaceholderItem('country', 'country'), ...formattedCountries]);
    } catch (error) {
      console.error("Error loading country list:", error);
      setCountryDropdownItems([createErrorItem('country', 'countries')]);
    }
  }, []);

  const fetchChainsData = useCallback(async () => {
    setLoadingChains(true);
    try {
      const response = await fetch('http://localhost:8090/api/chain');
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
  }, []);

  useEffect(() => {
    fetchChainsData();
  }, [fetchChainsData]);

  useEffect(() => {
    if (selectedChain && selectedChain.id && !selectedChain.id.startsWith('placeholder-')) {
      const fetchBrandsData = async () => {
        setLoadingBrands(true);
        setBrands([createLoadingItem('brands', 'brands')]);
        try {
          const response = await fetch(`http://localhost:8090/api/chain/${selectedChain.id}/brands`);
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
  }, [selectedChain]);

  const handlePhoneNumberChange = (e, countryCodeISO, setRawValue, setFormattedValue, setErrorValue) => {
    const rawValue = e.target.value;
    setRawValue(rawValue); // Siempre actualiza el valor raw

    if (countryCodeISO) {
      const formatter = new AsYouType(countryCodeISO);
      // Formatea el valor raw completo cada vez para manejar pegados y borrados correctamente
      let formatted = '';
      for (const char of rawValue) { // Re-formatear el raw
        if (/\d/.test(char) || char === '+') { // Solo procesar dígitos y el '+' inicial
            formatted = formatter.input(char);
        } else {
            // Para otros caracteres (como espacios, paréntesis que el usuario podría escribir)
            // AsYouType los maneja internamente, pero si queremos un control más estricto
            // podríamos filtrarlos aquí o simplemente dejar que AsYouType haga su trabajo.
            // Por ahora, confiamos en AsYouType. Si el usuario escribe caracteres no válidos,
            // el formateo podría detenerse o comportarse de forma extraña.
            // La validación final en onBlur/submit lo detectará.
        }
      }
      // Si rawValue está vacío después de la iteración (ej. solo tenía caracteres no válidos), 
      // el `formatted` de AsYouType podría no estar vacío si ya había formateado algo.
      // Por eso, es mejor formatear el rawValue completo.
      const finalFormatter = new AsYouType(countryCodeISO);
      setFormattedValue(finalFormatter.input(rawValue));

      setErrorValue(''); // Limpiar error mientras escribe
    } else {
      setFormattedValue(rawValue); // Sin país, mostrar raw como formateado
      if (rawValue) { // Solo mostrar error si hay algo escrito y no hay país
        setErrorValue('Please select a country first to format/validate phone number.');
      } else {
        setErrorValue('');
      }
    }
  };

  const validatePhoneNumber = (numberRaw, countryCodeISO, fieldName, setErrorFunc) => {
    if (!numberRaw || numberRaw.trim() === '') { // Si el campo está vacío
      setErrorFunc(''); // No hay número, no hay error (a menos que sea requerido explícitamente)
      return null; // Devolver null para que no se envíe
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
      } catch (e) { /* No hacer nada si no hay ejemplo */ }
    }
    return 'Enter phone number';
  };

  const resetFormFields = useCallback(() => {
    setSelectedChain(null);
    setHotelCode('');
    setHotelName('');
    setStreetAddress('');
    setSelectedCountry(null); // Esto también limpiará los placeholders de teléfono
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' }); // Limpiar feedback anterior

    const currentCountryCode = selectedCountry ? selectedCountry.code : null;

    // Forzar validación final antes de enviar
    const finalValidatedMainPhone = validatePhoneNumber(mainPhoneNumberRaw, currentCountryCode, "Hotel Phone", setMainPhoneNumberError);
    const finalValidatedContactPhone = validatePhoneNumber(contactMobilePhoneRaw, currentCountryCode, "Contact Phone", setContactMobilePhoneError);

    // Verificar si las validaciones de teléfono produjeron errores
    let phoneValidationFailed = false;
    if (mainPhoneNumberRaw && !finalValidatedMainPhone) {
        setMainPhoneNumberError("Hotel Phone: Invalid phone number for selected country."); // Re-asegurar mensaje de error
        phoneValidationFailed = true;
    }
    if (contactMobilePhoneRaw && !finalValidatedContactPhone) {
        setContactMobilePhoneError("Contact Phone: Invalid phone number for selected country."); // Re-asegurar mensaje de error
        phoneValidationFailed = true;
    }

    // Validar campos requeridos del formulario
    if (!hotelName || !selectedBrand?.id || !contactFirstName || !contactLastName || !contactEmail || !selectedCountry?.id) {
      setFeedback({ type: 'error', message: 'Please fill in all required fields marked with an asterisk (*).' });
      setIsSubmitting(false); // Asegurar que isSubmitting se resetee
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    if (phoneValidationFailed) {
        setFeedback({ type: 'error', message: 'Please correct the invalid phone numbers before submitting.' });
        setIsSubmitting(false); // Asegurar que isSubmitting se resetee
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    
    setIsSubmitting(true);

    const formData = {
      hotelCode: hotelCode || null,
      hotelName,
      hotelStatus: 'P',
      brandId: parseInt(selectedBrand.id, 10),
      localPhone: finalValidatedMainPhone, // Usar el número validado y formateado a E.164
      disclaimer: disclaimer || null,
      hotelWebsiteUrl: website || null,
      mainContact: {
        firstName: contactFirstName,
        lastName: contactLastName,
        contactTitle: contactTitle || null,
        contactEmail,
        contactMobileNumber: finalValidatedContactPhone, // Usar el número validado y formateado a E.164
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
      const response = await fetch('http://localhost:8090/api/hotels/createFull', {
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
        {/* --- Sección Chain & Brand (sin cambios respecto a la última versión) --- */}
        <h2 style={formSectionTitleStyle}>Chain & Brand</h2>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="chain-dropdown">Chain <span style={{ color: 'red' }}>*</span></FormLabel>
          <div style={inputContainerStyle}>
            <Dropdown
              id="chain-dropdown"
              titleText=""
              label={loadingChains ? "Loading..." : (chains[0]?.text || "Select a chain...")}
              items={chains}
              itemToString={(item) => (item ? item.text : '')}
              onChange={({ selectedItem }) => setSelectedChain(selectedItem && !selectedItem.id.startsWith('placeholder-') ? selectedItem : null)}
              selectedItem={selectedChain}
              style={{ width: '100%' }}
              disabled={loadingChains}
            />
          </div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="brand-dropdown">Brand <span style={{ color: 'red' }}>*</span></FormLabel>
          <div style={inputContainerStyle}>
            <Dropdown
              id="brand-dropdown"
              titleText=""
              label={loadingBrands ? "Loading..." : (!selectedChain || selectedChain.id.startsWith('placeholder-') ? "Select chain first" : (brands[0]?.text || "Select a brand..."))}
              items={brands}
              itemToString={(item) => (item ? item.text : '')}
              onChange={({ selectedItem }) => setSelectedBrand(selectedItem && !selectedItem.id.startsWith('placeholder-') && !selectedItem.id.startsWith('select-chain-') && !selectedItem.id.startsWith('no-items-') ? selectedItem : null)}
              selectedItem={selectedBrand}
              style={{ width: '100%' }}
              disabled={!selectedChain || !!selectedChain?.id.startsWith('placeholder-') || loadingBrands || !brands.length || !!brands[0]?.id.startsWith('select-chain-') || !!brands[0]?.id.startsWith('no-items-') || !!brands[0]?.id.startsWith('error-') || !!brands[0]?.id.startsWith('loading-')}
            />
          </div>
        </div>

        {/* --- Sección Property Info --- */}
        <h2 style={formSectionTitleStyle}>Property Info</h2>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="hotel-code">Hotel Code</FormLabel>
          <div style={inputContainerStyle}><TextInput id="hotel-code" labelText="" placeholder="Internal Hotel Code" value={hotelCode} onChange={(e) => setHotelCode(e.target.value)} style={{ width: '100%' }}/></div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="hotel-name">Name <span style={{color: 'red'}}>*</span></FormLabel>
          <div style={inputContainerStyle}><TextInput id="hotel-name" labelText="" placeholder="Official Property Name" value={hotelName} onChange={(e) => setHotelName(e.target.value)} style={{ width: '100%' }} required /></div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="street-address">Street Address</FormLabel>
          <div style={inputContainerStyle}><TextInput id="street-address" labelText="" placeholder="e.g., 123 Main St" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} style={{ width: '100%' }} /></div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="country-dropdown">Country <span style={{color: 'red'}}>*</span></FormLabel>
          <div style={inputContainerStyle}>
            <Dropdown
              id="country-dropdown"
              titleText=""
              label={selectedCountry ? selectedCountry.text : (countryDropdownItems[0]?.text || "Select a country...")}
              items={countryDropdownItems} // Usar la lista de países cargada
              itemToString={(item) => (item ? item.text : '')}
              onChange={({ selectedItem }) => {
                const newCountry = selectedItem.id.startsWith('placeholder-') ? null : selectedItem;
                setSelectedCountry(newCountry);
                const newCountryCode = newCountry ? newCountry.code : null;
                // Limpiar/reformatear teléfonos al cambiar de país
                setMainPhoneNumberRaw(''); setMainPhoneNumberFormatted(''); setMainPhoneNumberError('');
                setContactMobilePhoneRaw(''); setContactMobilePhoneFormatted(''); setContactMobilePhoneError('');
                // Actualizar placeholders
                if (newCountryCode) {
                    // Esto no funciona directamente, los placeholders de TextInput no se actualizan así.
                    // El placeholder se pasa en la prop `placeholder` del TextInput.
                }
              }}
              selectedItem={selectedCountry}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="state-province">State / Province</FormLabel>
          <div style={inputContainerStyle}><TextInput id="state-province" labelText="" placeholder="e.g., California" value={stateProvince} onChange={(e) => setStateProvince(e.target.value)} style={{ width: '100%' }} /></div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="city">City</FormLabel>
          <div style={inputContainerStyle}><TextInput id="city" labelText="" placeholder="e.g., New York" value={city} onChange={(e) => setCity(e.target.value)} style={{ width: '100%' }}/></div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="zip-code">Zip Code / Postal Code</FormLabel>
          <div style={inputContainerStyle}><TextInput id="zip-code" labelText="" placeholder="e.g., 10001" value={zipCode} onChange={(e) => setZipCode(e.target.value)} style={{ width: '100%' }} /></div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="main-phone-number">Phone Number</FormLabel>
          <div style={inputContainerStyle}>
            <TextInput
              id="main-phone-number"
              type="tel"
              labelText=""
              placeholder={getPhonePlaceholder(selectedCountry?.code)}
              value={mainPhoneNumberFormatted} // Mostrar siempre el formateado
              onChange={(e) => handlePhoneNumberChange(e, selectedCountry?.code, setMainPhoneNumberRaw, setMainPhoneNumberFormatted, setMainPhoneNumberError)}
              onBlur={() => validatePhoneNumber(mainPhoneNumberRaw, selectedCountry?.code, "Hotel Phone", setMainPhoneNumberError)}
              invalid={!!mainPhoneNumberError}
              invalidText={mainPhoneNumberError}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="website">Website</FormLabel>
          <div style={inputContainerStyle}><TextInput id="website" type="url" labelText="" placeholder="e.g., https://www.example.com" value={website} onChange={(e) => setWebsite(e.target.value)} style={{ width: '100%' }} /></div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="disclaimer">Disclaimer</FormLabel>
          <div style={inputContainerStyle}><TextInput id="disclaimer" labelText="" placeholder="Short disclaimer text" value={disclaimer} onChange={(e) => setDisclaimer(e.target.value)} style={{ width: '100%' }} /></div>
        </div>

        {/* --- Sección Contact Info (Main Contact) --- */}
        <h2 style={formSectionTitleStyle}>Contact Info (Main Contact)</h2>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="contact-first-name">First Name <span style={{color: 'red'}}>*</span></FormLabel>
          <div style={inputContainerStyle}><TextInput id="contact-first-name" labelText="" placeholder="Contact's first name" value={contactFirstName} onChange={(e) => setContactFirstName(e.target.value)} style={{ width: '100%' }} required /></div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="contact-last-name">Last Name <span style={{color: 'red'}}>*</span></FormLabel>
          <div style={inputContainerStyle}><TextInput id="contact-last-name" labelText="" placeholder="Contact's last name" value={contactLastName} onChange={(e) => setContactLastName(e.target.value)} style={{ width: '100%' }} required /></div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="contact-title">Title</FormLabel>
          <div style={inputContainerStyle}><TextInput id="contact-title" labelText="" placeholder="e.g., General Manager" value={contactTitle} onChange={(e) => setContactTitle(e.target.value)} style={{ width: '100%' }} /></div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="contact-mobile-phone">Phone Number</FormLabel>
          <div style={inputContainerStyle}>
            <TextInput
              id="contact-mobile-phone"
              type="tel"
              labelText=""
              placeholder={getPhonePlaceholder(selectedCountry?.code)}
              value={contactMobilePhoneFormatted} // Mostrar siempre el formateado
              onChange={(e) => handlePhoneNumberChange(e, selectedCountry?.code, setContactMobilePhoneRaw, setContactMobilePhoneFormatted, setContactMobilePhoneError)}
              onBlur={() => validatePhoneNumber(contactMobilePhoneRaw, selectedCountry?.code, "Contact Phone", setContactMobilePhoneError)}
              invalid={!!contactMobilePhoneError}
              invalidText={contactMobilePhoneError}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="contact-email">Email <span style={{color: 'red'}}>*</span></FormLabel>
          <div style={inputContainerStyle}>
            <TextInput
              id="contact-email"
              type="email"
              labelText=""
              placeholder="e.g., contact@example.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              style={{ width: '100%' }}
              required
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