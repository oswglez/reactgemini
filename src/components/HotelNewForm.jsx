// src/components/forms/HotelNewForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  FormLabel,
  TextInput,
  Dropdown,
  Button,
  NumberInput,
  InlineNotification,
  Loading,
  ComposedModal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@carbon/react';

// --- Estilos para el layout del formulario ---
const formContainerStyle = {
  padding: '2rem',
  maxWidth: '960px',
  minWidth: '700px', // Para ayudar a prevenir el encogimiento excesivo
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
  flex: '0 0 200px', // Ajusta este ancho según tus etiquetas
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

// --- Funciones Helper para Dropdown Placeholders ---
const createPlaceholderItem = (idSuffix, text) => ({ id: `placeholder-${idSuffix}`, text: `Select a ${text}...` });
const createLoadingItem = (idSuffix, text) => ({ id: `loading-${idSuffix}`, text: `Loading ${text}...` });
const createErrorItem = (idSuffix, text) => ({ id: `error-${idSuffix}`, text: `Error loading ${text}` });
const createSelectChainFirstItem = () => ({ id: `select-chain-brand`, text: 'Select chain first...' });
const createNoItemsItem = (idSuffix, text) => ({ id: `no-items-${idSuffix}`, text: `No ${text} available` });

// --- Listas de Items para Dropdowns (estáticas o cargadas) ---
const countryItems = [
  createPlaceholderItem('country', 'country'),
  { id: 'US', text: 'United States' },
  { id: 'CA', text: 'Canada' },
  { id: 'MX', text: 'Mexico' },
];

const contactTypeItems = [
  createPlaceholderItem('contact-type', 'contact type'),
  { id: 'MAIN', text: 'Main' },
  { id: 'BILLING', text: 'Billing' },
  { id: 'SALES', text: 'Sales' },
];

const hotelStatusItems = [
  createPlaceholderItem('hotel-status', 'hotel status'),
  { id: 'A', text: 'Active' },
  { id: 'I', text: 'Inactive' },
  { id: 'P', text: 'Pending' },
];

function HotelNewForm() {
  const navigate = useNavigate();

  // Estados del Formulario
  const [chains, setChains] = useState([createLoadingItem('chains', 'chains')]);
  const [selectedChain, setSelectedChain] = useState(null);
  const [brands, setBrands] = useState([createSelectChainFirstItem()]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [loadingChains, setLoadingChains] = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(false);

  const [hotelCode, setHotelCode] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [selectedHotelStatus, setSelectedHotelStatus] = useState(null);
  const [streetAddress, setStreetAddress] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [stateProvince, setStateProvince] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [mainPhoneNumber, setMainPhoneNumber] = useState('');
  const [website, setWebsite] = useState('');
  const [totalFloors, setTotalFloors] = useState('');
  const [totalRooms, setTotalRooms] = useState('');
  const [disclaimer, setDisclaimer] = useState('');

  const [pmsProviderItems, setPmsProviderItems] = useState([createLoadingItem('pms-vendors', 'PMS Vendors')]);
  const [selectedPmsProvider, setSelectedPmsProvider] = useState(null);
  const [pmsHotelId, setPmsHotelId] = useState('');
  const [pmsToken, setPmsToken] = useState('');
  const [crsProviderItems, setCrsProviderItems] = useState([createLoadingItem('crs-vendors', 'CRS Vendors')]);
  const [selectedCrsProvider, setSelectedCrsProvider] = useState(null);
  const [crsHotelId, setCrsHotelId] = useState('');
  const [crsToken, setCrsToken] = useState('');
  const [loadingPms, setLoadingPms] = useState(true);
  const [loadingCrs, setLoadingCrs] = useState(true);

  const [contactFirstName, setContactFirstName] = useState('');
  const [contactLastName, setContactLastName] = useState('');
  const [contactTitle, setContactTitle] = useState('');
  const [selectedContactType, setSelectedContactType] = useState(null);
  const [contactEmail, setContactEmail] = useState('');
  const [contactLocalPhone, setContactLocalPhone] = useState('');
  const [contactMobilePhone, setContactMobilePhone] = useState('');
  const [contactFax, setContactFax] = useState('');

  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openCancelModal, setOpenCancelModal] = useState(false);


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

  const fetchProviders = useCallback(async (providerType, setItemsFunc, setLoadingFunc, placeholderText, errorTextKey) => {
    setLoadingFunc(true);
    setItemsFunc([createLoadingItem(errorTextKey, placeholderText)]);
    try {
      const response = await fetch(`http://localhost:8090/api/provider/type?type=${providerType}`);
      if (!response.ok) throw new Error(`Network response for ${providerType} providers was not ok`);
      const data = await response.json();
      setItemsFunc(data && data.length > 0 ?
        [
          createPlaceholderItem(errorTextKey, placeholderText),
          ...data.map(p => ({ id: p.providerName, text: p.providerName }))
        ]
        : [createNoItemsItem(errorTextKey, placeholderText)]
      );
    } catch (error) {
      console.error(`Error fetching ${providerType} providers:`, error);
      setItemsFunc([createErrorItem(errorTextKey, errorTextKey)]);
      setFeedback({ type: 'error', message: `Error loading ${providerType} providers: ${error.message}` });
    } finally {
      setLoadingFunc(false);
    }
  }, []);
  
  const resetFormFields = useCallback(() => {
    setSelectedChain(null); // Esto disparará el useEffect de brands para resetearse
    // setSelectedBrand(null); // Ya se resetea en el useEffect de selectedChain
    
    setHotelCode('');
    setHotelName('');
    setSelectedHotelStatus(null);
    setStreetAddress('');
    setSelectedCountry(null);
    setStateProvince('');
    setCity('');
    setZipCode('');
    setMainPhoneNumber('');
    setWebsite('');
    setTotalFloors('');
    setTotalRooms('');
    setDisclaimer('');

    setSelectedPmsProvider(null);
    setPmsHotelId('');
    setPmsToken('');
    setSelectedCrsProvider(null);
    setCrsHotelId('');
    setCrsToken('');

    setContactFirstName('');
    setContactLastName('');
    setContactTitle('');
    setSelectedContactType(null);
    setContactEmail('');
    setContactLocalPhone('');
    setContactMobilePhone('');
    setContactFax('');

    // Considerar si recargar todos los dropdowns es deseable o solo los principales.
    // Si el usuario va a crear muchos hoteles seguidos, recargar puede ser bueno.
    fetchChainsData(); 
    fetchProviders('PMS', setPmsProviderItems, setLoadingPms, 'PMS Vendor', 'pms-vendors');
    fetchProviders('CRS', setCrsProviderItems, setLoadingCrs, 'CRS Vendor', 'crs-vendors');

  }, [fetchChainsData, fetchProviders]); // Dependencias de useCallback


  useEffect(() => {
    fetchChainsData();
    fetchProviders('PMS', setPmsProviderItems, setLoadingPms, 'PMS Vendor', 'pms-vendors');
    fetchProviders('CRS', setCrsProviderItems, setLoadingCrs, 'CRS Vendor', 'crs-vendors');
  }, [fetchChainsData, fetchProviders]); // Llamar al montar y si las funciones cambian

  useEffect(() => {
    if (selectedChain && selectedChain.id && !selectedChain.id.startsWith('placeholder-') && !selectedChain.id.startsWith('loading-') && !selectedChain.id.startsWith('error-')) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });
    setIsSubmitting(true);

    const formData = {
      hotelCode: hotelCode || null,
      hotelName,
      hotelStatus: selectedHotelStatus && !selectedHotelStatus.id.startsWith('placeholder-') ? selectedHotelStatus.id : null,
      brandId: selectedBrand && !selectedBrand.id.startsWith('placeholder-') && !selectedBrand.id.startsWith('select-chain-') && !selectedBrand.id.startsWith('no-items-') ? parseInt(selectedBrand.id, 10) : null,
      localPhone: mainPhoneNumber || null,
      pmsVendor: selectedPmsProvider && !selectedPmsProvider.id.startsWith('placeholder-') ? selectedPmsProvider.id : null,
      pmsHotelId: pmsHotelId ? parseInt(pmsHotelId) : null,
      pmsToken: pmsToken || null,
      crsVendor: selectedCrsProvider && !selectedCrsProvider.id.startsWith('placeholder-') ? selectedCrsProvider.id : null,
      crsHotelId: crsHotelId ? parseInt(crsHotelId) : null,
      crsToken: crsToken || null,
      disclaimer: disclaimer || null,
      totalFloors: totalFloors !== '' ? parseInt(totalFloors, 10) : null,
      totalRooms: totalRooms !== '' ? parseInt(totalRooms, 10) : null,
      hotelWebsiteUrl: website || null,
      mainContact: {
        firstName: contactFirstName,
        lastName: contactLastName,
        contactTitle: contactTitle || null,
        contactEmail,
        contactLocalNumber: contactLocalPhone || null,
        contactMobileNumber: contactMobilePhone || null,
        contactFaxNumber: contactFax || null,
        contactType: selectedContactType && !selectedContactType.id.startsWith('placeholder-') ? selectedContactType.id : 'MAIN',
      },
      mainAddress: {
        country: selectedCountry && !selectedCountry.id.startsWith('placeholder-') ? selectedCountry.id : null,
        state: stateProvince || null,
        city: city || null,
        street: streetAddress || null,
        postalCode: zipCode || null,
        addressType: 'MAIN',
      },
    };

    if (!formData.hotelName || !formData.brandId || !formData.mainContact.firstName || !formData.mainContact.lastName || !formData.mainContact.contactEmail || !formData.mainAddress.country || !formData.hotelStatus) {
      setFeedback({ type: 'error', message: 'Please fill in all required fields marked with an asterisk (*).' });
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    console.log('Submitting Form Data to Backend:', JSON.stringify(formData, null, 2));

    try {
      const response = await fetch('http://localhost:8090/api/hotels/createFull', { // Verifica tu endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      setIsSubmitting(false); // Mover aquí para reactivar botones antes del posible delay

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Backend error response:', errorBody);
        throw new Error(`API Error ${response.status}: ${errorBody || response.statusText}`);
      }
      const result = await response.json();
      console.log('Hotel created successfully via API:', result);
      setFeedback({ type: 'success', message: `Hotel "${result.hotelName || formData.hotelName}" created successfully! (ID: ${result.hotelId || 'N/A'})` });

      resetFormFields();
      window.scrollTo({ top: 0, behavior: 'smooth' });

      setTimeout(() => {
     //   if (feedback.type === 'success') { // Solo navega si el feedback es de éxito y no ha cambiado
            navigate(-1); // Navega a la pantalla anterior
     //   }
      }, 2500); // Delay para que el usuario vea el mensaje

    } catch (error) {
      console.error('Error submitting hotel creation form:', error);
      setFeedback({ type: 'error', message: `Error creating hotel: ${error.message}` });
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCancelAttempt = () => {
    setOpenCancelModal(true);
  };

  const proceedWithCancel = () => {
    console.log("Confirmed cancel - resetting form and navigating back");
    resetFormFields();
    setFeedback({ type: '', message: '' });
    setOpenCancelModal(false);
    navigate(-1);
  };

  const closeModal = () => {
    setOpenCancelModal(false);
  };

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

      {(loadingChains || loadingPms || loadingCrs) && !isSubmitting &&
        <Loading description="Loading initial data..." withOverlay={false} style={{ marginBottom: '1rem' }} />}

      <Form onSubmit={handleSubmit}>
        {/* --- Sección Chain & Brand --- */}
        <h2 style={formSectionTitleStyle}>Chain & Brand</h2>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="chain-dropdown">Chain <span style={{ color: 'red' }}>*</span></FormLabel>
          <div style={inputContainerStyle}>
            <Dropdown
              id="chain-dropdown"
              titleText=""
              label={loadingChains ? "Loading..." : (chains[0]?.text || "Select a chain...")}
              items={chains || []}
              itemToString={(item) => (item ? item.text : '')}
              onChange={({ selectedItem }) => setSelectedChain(selectedItem && !selectedItem.id.startsWith('placeholder-') && !selectedItem.id.startsWith('loading-') && !selectedItem.id.startsWith('error-') ? selectedItem : null)}
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
              items={brands || []}
              itemToString={(item) => (item ? item.text : '')}
              onChange={({ selectedItem }) => setSelectedBrand(selectedItem && !selectedItem.id.startsWith('placeholder-') && !selectedItem.id.startsWith('select-chain-') && !selectedItem.id.startsWith('no-items-') && !selectedItem.id.startsWith('loading-') && !selectedItem.id.startsWith('error-') ? selectedItem : null)}
              selectedItem={selectedBrand}
              style={{ width: '100%' }}
              disabled={!selectedChain || !!selectedChain?.id.startsWith('placeholder-') || loadingBrands || !brands.length || !!brands[0]?.id.startsWith('select-chain-') || !!brands[0]?.id.startsWith('loading-') || !!brands[0]?.id.startsWith('error-') || !!brands[0]?.id.startsWith('no-items-')}
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
          <FormLabel style={labelStyle} htmlFor="hotel-name">Property Name <span style={{color: 'red'}}>*</span></FormLabel>
          <div style={inputContainerStyle}><TextInput id="hotel-name" labelText="" placeholder="Official Property Name" value={hotelName} onChange={(e) => setHotelName(e.target.value)} style={{ width: '100%' }} required /></div>
        </div>
         <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="hotel-status-dropdown">Hotel Status <span style={{color: 'red'}}>*</span></FormLabel>
          <div style={inputContainerStyle}>
            <Dropdown 
              id="hotel-status-dropdown" 
              titleText="" 
              label={hotelStatusItems[0]?.text || "Select hotel status..."} // Usa el texto del primer item (placeholder)
              items={hotelStatusItems} 
              itemToString={(item) => (item ? item.text : '')} 
              onChange={({ selectedItem }) => setSelectedHotelStatus(selectedItem.id.startsWith('placeholder-') ? null : selectedItem)} 
              selectedItem={selectedHotelStatus} 
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="total-floors">Total Floors</FormLabel>
          <div style={inputContainerStyle}><NumberInput id="total-floors" label="" hideLabel value={totalFloors === '' ? undefined : Number(totalFloors)} onChange={(event, { value }) => setTotalFloors(value === undefined || isNaN(value) ? '' : String(value))} min={0} style={{ width: '100%' }} placeholder="Number of floors"/></div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="total-rooms">Total Rooms</FormLabel>
          <div style={inputContainerStyle}><NumberInput id="total-rooms" label="" hideLabel value={totalRooms === '' ? undefined : Number(totalRooms)} onChange={(event, { value }) => setTotalRooms(value === undefined || isNaN(value) ? '' : String(value))} min={0} style={{ width: '100%' }} placeholder="Total number of rooms"/></div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="street-address">Street Address</FormLabel>
          <div style={inputContainerStyle}><TextInput id="street-address" labelText="" placeholder="e.g., 123 Main St" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} style={{ width: '100%' }} /></div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="country-dropdown">Country <span style={{color: 'red'}}>*</span></FormLabel>
          <div style={inputContainerStyle}><Dropdown id="country-dropdown" titleText="" label={countryItems[0]?.text || "Select a country..."} items={countryItems} itemToString={(item) => (item ? item.text : '')} onChange={({ selectedItem }) => setSelectedCountry(selectedItem.id.startsWith('placeholder-') ? null : selectedItem)} selectedItem={selectedCountry} style={{ width: '100%' }} /></div>
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
          <FormLabel style={labelStyle} htmlFor="zip-code">Zip / Postal Code</FormLabel>
          <div style={inputContainerStyle}><TextInput id="zip-code" labelText="" placeholder="e.g., 10001" value={zipCode} onChange={(e) => setZipCode(e.target.value)} style={{ width: '100%' }} /></div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="main-phone-number">Main Phone Number</FormLabel>
          <div style={inputContainerStyle}><TextInput id="main-phone-number" type="tel" labelText="" placeholder="e.g., (555) 123-4567" value={mainPhoneNumber} onChange={(e) => setMainPhoneNumber(e.target.value)} style={{ width: '100%' }} /></div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="website">Website</FormLabel>
          <div style={inputContainerStyle}><TextInput id="website" type="url" labelText="" placeholder="e.g., https://www.example.com" value={website} onChange={(e) => setWebsite(e.target.value)} style={{ width: '100%' }} /></div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="disclaimer">Disclaimer</FormLabel>
          <div style={inputContainerStyle}><TextInput id="disclaimer" labelText="" placeholder="Short disclaimer text" value={disclaimer} onChange={(e) => setDisclaimer(e.target.value)} style={{ width: '100%' }} /></div>
        </div>
        
        {/* --- Sección System Integration --- */}
        <h2 style={formSectionTitleStyle}>System Integration</h2>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="pms-vendor-dropdown">PMS Vendor</FormLabel>
          <div style={inputContainerStyle}>
            <Dropdown id="pms-vendor-dropdown" titleText="" label={loadingPms ? "Loading..." : (pmsProviderItems[0]?.text || "Select a PMS Vendor...")} items={pmsProviderItems || []} itemToString={(item) => (item ? item.text : '')} onChange={({ selectedItem }) => setSelectedPmsProvider(selectedItem && !selectedItem.id.startsWith('placeholder-') && !selectedItem.id.startsWith('loading-') && !selectedItem.id.startsWith('error-') && !selectedItem.id.startsWith('no-items-') ? selectedItem : null)} selectedItem={selectedPmsProvider} style={{ width: '100%' }} disabled={loadingPms}/>
          </div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="pms-hotel-id">PMS Hotel ID</FormLabel>
          <div style={inputContainerStyle}><TextInput id="pms-hotel-id" labelText="" placeholder="ID in PMS" value={pmsHotelId} onChange={(e) => setPmsHotelId(e.target.value)} style={{ width: '100%' }}/></div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="pms-token">PMS Token</FormLabel>
          <div style={inputContainerStyle}><TextInput id="pms-token" labelText="" placeholder="API Token for PMS" value={pmsToken} onChange={(e) => setPmsToken(e.target.value)} type="password" style={{ width: '100%' }}/></div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="crs-vendor-dropdown">CRS Vendor</FormLabel>
          <div style={inputContainerStyle}>
            <Dropdown id="crs-vendor-dropdown" titleText="" label={loadingCrs ? "Loading..." : (crsProviderItems[0]?.text || "Select a CRS Vendor...")} items={crsProviderItems || []} itemToString={(item) => (item ? item.text : '')} onChange={({ selectedItem }) => setSelectedCrsProvider(selectedItem && !selectedItem.id.startsWith('placeholder-') && !selectedItem.id.startsWith('loading-') && !selectedItem.id.startsWith('error-') && !selectedItem.id.startsWith('no-items-') ? selectedItem : null)} selectedItem={selectedCrsProvider} style={{ width: '100%' }} disabled={loadingCrs}/>
          </div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="crs-hotel-id">CRS Hotel ID</FormLabel>
          <div style={inputContainerStyle}><TextInput id="crs-hotel-id" labelText="" placeholder="ID in CRS" value={crsHotelId} onChange={(e) => setCrsHotelId(e.target.value)} style={{ width: '100%' }}/></div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="crs-token">CRS Token</FormLabel>
          <div style={inputContainerStyle}><TextInput id="crs-token" labelText="" placeholder="API Token for CRS" value={crsToken} onChange={(e) => setCrsToken(e.target.value)} type="password" style={{ width: '100%' }}/></div>
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
          <FormLabel style={labelStyle} htmlFor="contact-type-dropdown">Contact Type <span style={{color: 'red'}}>*</span></FormLabel>
          <div style={inputContainerStyle}>
            <Dropdown id="contact-type-dropdown" titleText="" label={contactTypeItems[0]?.text || "Select contact type..."} items={contactTypeItems} itemToString={(item) => (item ? item.text : '')} onChange={({ selectedItem }) => setSelectedContactType(selectedItem.id.startsWith('placeholder-') ? null : selectedItem)} selectedItem={selectedContactType} style={{ width: '100%' }}/>
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
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="contact-local-phone">Local Phone</FormLabel>
          <div style={inputContainerStyle}><TextInput id="contact-local-phone" type="tel" labelText="" placeholder="e.g., (555) 123-4560" value={contactLocalPhone} onChange={(e) => setContactLocalPhone(e.target.value)} style={{ width: '100%' }} /></div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="contact-mobile-phone">Mobile Phone</FormLabel>
          <div style={inputContainerStyle}><TextInput id="contact-mobile-phone" type="tel" labelText="" placeholder="e.g., (555) 123-4561" value={contactMobilePhone} onChange={(e) => setContactMobilePhone(e.target.value)} style={{ width: '100%' }}/></div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="contact-fax">Fax Number</FormLabel>
          <div style={inputContainerStyle}><TextInput id="contact-fax" type="tel" labelText="" placeholder="e.g., (555) 123-4562" value={contactFax} onChange={(e) => setContactFax(e.target.value)} style={{ width: '100%' }}/></div>
        </div>
        
        <div style={buttonContainerStyle}>
          <Button kind="secondary" type="button" onClick={handleCancelAttempt} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" kind="primary" disabled={isSubmitting || loadingChains || loadingBrands || loadingPms || loadingCrs}>
            {isSubmitting ? 'Saving...' : 'Save Hotel'}
          </Button>
        </div>
      </Form>

      {/* MODAL DE CONFIRMACIÓN PARA CANCELAR */}
      <ComposedModal
        open={openCancelModal}
        onClose={closeModal}
        preventCloseOnClickOutside={false}
        size="sm" // Tamaño del modal
      >
        <ModalHeader
          title="Discard Changes?"
          closeModal={closeModal}
        />
        <ModalBody>
          <p style={{ marginBottom: '1rem' }}>
            This action will discard ALL unsaved changes.
          </p>
          <p>Are you sure you want to proceed?</p>
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" onClick={closeModal}>
            No
          </Button>
          <Button kind="danger" onClick={proceedWithCancel}>
            Yes, Discard
          </Button>
        </ModalFooter>
      </ComposedModal>

    </div>
  );
}

export default HotelNewForm;