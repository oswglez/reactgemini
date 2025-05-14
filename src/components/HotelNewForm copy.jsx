// src/components/forms/HotelNewForm.jsx (o la ruta que uses)
import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom'; // Descomenta si usas para "Cancelar"
import {
  Form,
  FormLabel,
  TextInput,
  Dropdown,
  Button,
  NumberInput, // Añadido para totalFloors y totalRooms
  // TextArea, // Descomenta si necesitas TextAreas
  InlineNotification, // Para mostrar mensajes de error o éxito
  Loading, // Para indicar carga de datos
} from '@carbon/react';

// Estilos para el layout del formulario
const formContainerStyle = {
  padding: '2rem',
  maxWidth: '1024px', // Un poco más ancho para más campos
  margin: '2rem auto',
  backgroundColor: '#ffffff', // Fondo blanco para el formulario
  border: '1px solid #e0e0e0',
  borderRadius: '4px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
};

const formRowStyle = {
  display: 'flex',
  alignItems: 'flex-start', // Cambiado a flex-start para etiquetas más largas
  marginBottom: '1.25rem',
  gap: '1.5rem', // Usar gap para espaciado entre label y input container
};

const labelStyle = {
  flex: '0 0 200px', // Ancho base para las etiquetas (ajústalo!)
  // marginRight: '1.5rem', // Ya no es necesario si usas gap en formRowStyle
  paddingTop: '0.5rem', // Alineación vertical con el input de Carbon
  textAlign: 'left', 
  fontSize: '0.875rem',
  color: '#161616',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const inputContainerStyle = {
  flex: '1 1 auto',
  minWidth: '250px', 
};

const formSectionTitleStyle = {
  fontSize: '1.25rem',
  fontWeight: 600,
  marginTop: '2.5rem',
  marginBottom: '1.5rem', // Aumentado el margen inferior
  paddingBottom: '0.75rem',
  borderBottom: '1px solid #dfe3e6',
  color: '#161616',
};

const buttonContainerStyle = {
  marginTop: '2.5rem',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '1rem',
};

// --- Funciones Helper para placeholders de Dropdown ---
const initialPlaceholder = (text, keyPrefix = "placeholder") => [{ id: `${keyPrefix}-${text.toLowerCase().replace(/\s+/g, '-')}`, text: `Select a ${text}...` }];
const loadingPlaceholder = (text) => [{ id: `loading-${text.toLowerCase().replace(/\s+/g, '-')}`, text: `Loading ${text}...` }];
const errorPlaceholder = (text) => [{ id: `error-${text.toLowerCase().replace(/\s+/g, '-')}`, text: `Error loading ${text}` }];
const selectChainFirstPlaceholder = () => [{id: `select-chain-brand`, text: 'Select chain first...'}];
const noItemsPlaceholder = (text) => [{id: `no-items-${text.toLowerCase().replace(/\s+/g, '-')}`, text: `No ${text} available`}];


// --- Listas de ejemplo (reemplazar con carga de API) ---
const countryItems = [
  ...initialPlaceholder('country'),
  { id: 'US', text: 'United States' },
  { id: 'CA', text: 'Canada' },
  { id: 'MX', text: 'Mexico' },
];
const contactTypeItems = [
  ...initialPlaceholder('contact type'),
  { id: 'MAIN', text: 'Main' },
  { id: 'BILLING', text: 'Billing' },
  { id: 'SALES', text: 'Sales' },
];
const hotelStatusItems = [
  initialPlaceholder('hotel status')[0],
  {id: 'A', text: 'Active'},
  {id: 'I', text: 'Inactive'},
  {id: 'P', text: 'Pending'},
];


function HotelNewForm() {
  // const navigate = useNavigate();

  // --- Estados para Chain & Brand ---
  const [chains, setChains] = useState(loadingPlaceholder('chains'));
  const [selectedChain, setSelectedChain] = useState(null);
  const [brands, setBrands] = useState(selectChainFirstPlaceholder());
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [loadingChains, setLoadingChains] = useState(true); // Iniciar en true
  const [loadingBrands, setLoadingBrands] = useState(false);

  // --- Estados para Property Info ---
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

  // --- Estados para PMS y CRS ---
  const [selectedPmsProvider, setSelectedPmsProvider] = useState(null);
  const [pmsHotelId, setPmsHotelId] = useState('');
  const [pmsToken, setPmsToken] = useState('');
  const [selectedCrsProvider, setSelectedCrsProvider] = useState(null);
  const [crsHotelId, setCrsHotelId] = useState('');
  const [crsToken, setCrsToken] = useState('');
  const [pmsProviderItems, setPmsProviderItems] = useState(loadingPlaceholder('PMS Vendors'));
  const [crsProviderItems, setCrsProviderItems] = useState(loadingPlaceholder('CRS Vendors'));
  const [loadingPms, setLoadingPms] = useState(true); // Iniciar en true
  const [loadingCrs, setLoadingCrs] = useState(true); // Iniciar en true

  // --- Estados para Contact Info (Main Contact) ---
  const [contactFirstName, setContactFirstName] = useState('');
  const [contactLastName, setContactLastName] = useState('');
  const [contactTitle, setContactTitle] = useState('');
  const [selectedContactType, setSelectedContactType] = useState(null);
  const [contactEmail, setContactEmail] = useState('');
  const [contactLocalPhone, setContactLocalPhone] = useState('');
  const [contactMobilePhone, setContactMobilePhone] = useState('');
  const [contactFax, setContactFax] = useState('');

  // Estado para mensajes de feedback (éxito/error)
  const [feedback, setFeedback] = useState({ type: '', message: '' });


  // Cargar Chains
  useEffect(() => {
    const fetchChainsData = async () => {
      setLoadingChains(true);
      try {
        const response = await fetch('http://localhost:8090/api/chain'); // TU ENDPOINT REAL
        if (!response.ok) throw new Error('Network response was not ok for chains');
        const data = await response.json();
        setChains([
          initialPlaceholder('chain')[0], 
          ...data.map(c => ({ id: c.chainId.toString(), text: c.chainName }))
        ]);
      } catch (error) {
        console.error("Error fetching chains:", error);
        setChains(errorPlaceholder('chains'));
        setFeedback({ type: 'error', message: `Error loading chains: ${error.message}`});
      } finally {
        setLoadingChains(false);
      }
    };
    fetchChainsData();
  }, []);

  // Cargar Brands cuando cambia selectedChain
  useEffect(() => {
    if (selectedChain && selectedChain.id && !selectedChain.id.startsWith('placeholder-') && !selectedChain.id.startsWith('loading-') && !selectedChain.id.startsWith('error-')) {
      const fetchBrandsData = async () => {
        setLoadingBrands(true);
        setBrands(loadingPlaceholder('brands'));
        try {
          const response = await fetch(`http://localhost:8090/api/chain/${selectedChain.id}/brands`); // TU ENDPOINT REAL
          if (!response.ok) throw new Error('Network response was not ok for brands');
          const data = await response.json();
          setBrands(data && data.length > 0 ? 
            [initialPlaceholder('brand')[0], ...data.map(b => ({ id: b.brandId.toString(), text: b.brandName }))]
            : noItemsPlaceholder('brands for this chain')
          );
        } catch (error) {
          console.error("Error fetching brands:", error);
          setBrands(errorPlaceholder('brands'));
          setFeedback({ type: 'error', message: `Error loading brands: ${error.message}`});
        } finally {
          setLoadingBrands(false);
        }
      };
      fetchBrandsData();
    } else {
      setBrands(selectChainFirstPlaceholder());
    }
    setSelectedBrand(null); // Resetear marca al cambiar cadena o si la cadena no es válida
  }, [selectedChain]);

  // Cargar Proveedores (PMS y CRS)
  const fetchProviders = useCallback(async (providerType, setItems, setLoadingState, placeholderText, errorText, itemKey) => {
    setLoadingState(true);
    setItems(loadingPlaceholder(placeholderText));
    try {
      const response = await fetch(`http://localhost:8090/api/provider/type?type=${providerType}`); // TU ENDPOINT REAL
      if (!response.ok) throw new Error(`Network response was not ok for ${providerType} providers`);
      const data = await response.json();
      setItems(data && data.length > 0 ?
        [
          initialPlaceholder(placeholderText, itemKey)[0],
          // Asumiendo que quieres ENVIAR el NOMBRE del proveedor al backend.
          // Si pmsVendor/crsVendor en HotelCreationRequestDTO esperan el ID, cambia a p.providerId.toString()
          ...data.map(p => ({ id: p.providerName, text: p.providerName })) 
        ]
        : noItemsPlaceholder(placeholderText)
      );
    } catch (error) {
      console.error(`Error fetching ${providerType} providers:`, error);
      setItems(errorPlaceholder(errorText));
      setFeedback({ type: 'error', message: `Error loading ${providerType} providers: ${error.message}`});
    } finally {
      setLoadingState(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders('PMS', setPmsProviderItems, setLoadingPms, 'PMS Vendor', 'PMS Vendors', 'pms-vendor');
    fetchProviders('CRS', setCrsProviderItems, setLoadingCrs, 'CRS Vendor', 'CRS Vendors', 'crs-vendor');
  }, [fetchProviders]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' }); // Limpiar feedback anterior

    const formData = {
      hotelCode: hotelCode || null, // Enviar null si está vacío
      hotelName,
      hotelStatus: selectedHotelStatus ? selectedHotelStatus.id : null,
      brandId: selectedBrand && !selectedBrand.id.startsWith('placeholder-') ? parseInt(selectedBrand.id, 10) : null,
      localPhone: mainPhoneNumber || null,
      pmsVendor: selectedPmsProvider && !selectedPmsProvider.id.startsWith('placeholder-') ? selectedPmsProvider.id : null, // Aquí .id es el providerName
      pmsHotelId: pmsHotelId ? parseInt(pmsHotelId, 10) : null,
      pmsToken: pmsToken || null,
      crsVendor: selectedCrsProvider && !selectedCrsProvider.id.startsWith('placeholder-') ? selectedCrsProvider.id : null, // Aquí .id es el providerName
      crsHotelId: crsHotelId ? parseInt(crsHotelId, 10) : null,
      crsToken: crsToken || null,
      disclaimer: disclaimer || null,
      totalFloors: totalFloors ? parseInt(totalFloors, 10) : null,
      totalRooms: totalRooms ? parseInt(totalRooms, 10) : null,
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

    // Validación básica de ejemplo (mejora esto)
    if (!formData.hotelName || !formData.brandId || !formData.mainContact.firstName || !formData.mainContact.lastName || !formData.mainContact.contactEmail || !formData.mainAddress.country) {
        setFeedback({type: 'error', message: 'Please fill in all required fields (*).'});
        return;
    }
    console.log('Submitting Form Data:', JSON.stringify(formData, null, 2));
    
    setLoadingChains(true); // Usar un estado de loading general para el submit
    try {
      const response = await fetch('http://localhost:8090/api/hotels/createFull', { // Asegúrate que el endpoint termina con /
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.text(); // Intenta obtener más info del error
        throw new Error(`HTTP error ${response.status}: ${errorData || response.statusText}`);
      }
      const result = await response.json();
      console.log('Hotel created successfully:', result);
      setFeedback({type: 'success', message: `Hotel "${result.hotelName}" created successfully!`});
      // Aquí podrías resetear el formulario o redirigir
      // navigate('/hotels');
    } catch (error) {
      console.error('Error creating hotel:', error);
      setFeedback({type: 'error', message: `Error creating hotel: ${error.message}`});
    } finally {
      setLoadingChains(false); // Reutilizo loadingChains, idealmente un `isSubmitting`
    }
  };
  
  const handleCancel = () => {
    console.log("Cancel clicked");
    // navigate('/hotels'); // Ejemplo de navegación
    // O resetear el formulario
  };


  return (
    <div style={formContainerStyle}>
      <h1 style={{ marginBottom: '0.5rem', color: '#161616' }}>Hotel Configuration</h1>
      <p style={{ marginBottom: '2rem', color: '#525252', fontSize: '0.875rem' }}>
        Complete the hotel configuration by entering key property details, including the hotel chain, brand, property name, address, and contact information. Fields marked with a red asterisk (<span style={{color: 'red'}}>*</span>) are required. When finished, click 'Save' to store the information and return to the main menu, or select 'Cancel' to discard changes.
      </p>

      {feedback.message && (
        <InlineNotification
          kind={feedback.type === 'error' ? 'error' : 'success'}
          title={feedback.type === 'error' ? 'Error' : 'Success'}
          subtitle={feedback.message}
          onCloseButtonClick={() => setFeedback({ type: '', message: '' })}
          lowContrast={true}
          style={{ marginBottom: '1rem' }}
        />
      )}

      {(loadingChains || loadingBrands || loadingPms || loadingCrs) && <Loading description="Loading form data..." withOverlay={false} />}


      <Form onSubmit={handleSubmit}>
        {/* --- Sección Chain & Brand --- */}
        <h2 style={formSectionTitleStyle}>Chain & Brand</h2>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="chain-dropdown">Chain <span style={{color: 'red'}}>*</span></FormLabel>
          <div style={inputContainerStyle}>
            <Dropdown id="chain-dropdown" titleText="" label={loadingChains ? "Loading..." : "Select a chain..."} items={chains} itemToString={(item) => (item ? item.text : '')} onChange={({ selectedItem }) => setSelectedChain(selectedItem.id.startsWith('placeholder-') || selectedItem.id.startsWith('error-') || selectedItem.id.startsWith('loading-') ? null : selectedItem)} selectedItem={selectedChain} style={{ width: '100%' }} disabled={loadingChains}/>
          </div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="brand-dropdown">Brand <span style={{color: 'red'}}>*</span></FormLabel>
          <div style={inputContainerStyle}>
            <Dropdown id="brand-dropdown" titleText="" label={loadingBrands ? "Loading..." : (!selectedChain ? "Select chain first" : "Select a brand...")} items={brands} itemToString={(item) => (item ? item.text : '')} onChange={({ selectedItem }) => setSelectedBrand(selectedItem.id.startsWith('placeholder-') || selectedItem.id.startsWith('select-chain-') || selectedItem.id.startsWith('error-') || selectedItem.id.startsWith('loading-') || selectedItem.id.startsWith('no-items-') ? null : selectedItem)} selectedItem={selectedBrand} style={{ width: '100%' }} disabled={!selectedChain || loadingBrands || brands.length === 0 || (brands.length > 0 && brands[0].id.startsWith('select-chain-'))}/>
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
            <Dropdown id="hotel-status-dropdown" titleText="" label="Select hotel status..." items={hotelStatusItems} itemToString={(item) => (item ? item.text : '')} onChange={({ selectedItem }) => setSelectedHotelStatus(selectedItem.id.startsWith('placeholder-') ? null : selectedItem)} selectedItem={selectedHotelStatus} style={{ width: '100%' }}/>
          </div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="total-floors">Total Floors</FormLabel>
          <div style={inputContainerStyle}><NumberInput id="total-floors" label="" hideLabel value={totalFloors} onChange={(e, { value }) => setTotalFloors(value)} min={0} style={{ width: '100%' }} placeholder="Number of floors"/></div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="total-rooms">Total Rooms</FormLabel>
          <div style={inputContainerStyle}><NumberInput id="total-rooms" label="" hideLabel value={totalRooms} onChange={(e, { value }) => setTotalRooms(value)} min={0} style={{ width: '100%' }} placeholder="Total number of rooms"/></div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="street-address">Street Address</FormLabel>
          <div style={inputContainerStyle}><TextInput id="street-address" labelText="" placeholder="e.g., 123 Main St" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} style={{ width: '100%' }} /></div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="country-dropdown">Country <span style={{color: 'red'}}>*</span></FormLabel>
          <div style={inputContainerStyle}><Dropdown id="country-dropdown" titleText="" label="Select a country..." items={countryItems} itemToString={(item) => (item ? item.text : '')} onChange={({ selectedItem }) => setSelectedCountry(selectedItem.id.startsWith('placeholder-') ? null : selectedItem)} selectedItem={selectedCountry} style={{ width: '100%' }} /></div>
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
            <Dropdown id="pms-vendor-dropdown" titleText="" label={loadingPms ? "Loading..." : "Select a PMS Vendor..."} items={pmsProviderItems} itemToString={(item) => (item ? item.text : '')} onChange={({ selectedItem }) => setSelectedPmsProvider(selectedItem.id.startsWith('placeholder-') || selectedItem.id.startsWith('error-') || selectedItem.id.startsWith('loading-') || selectedItem.id.startsWith('no-items-') ? null : selectedItem)} selectedItem={selectedPmsProvider} style={{ width: '100%' }} disabled={loadingPms}/>
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
            <Dropdown id="crs-vendor-dropdown" titleText="" label={loadingCrs ? "Loading..." : "Select a CRS Vendor..."} items={crsProviderItems} itemToString={(item) => (item ? item.text : '')} onChange={({ selectedItem }) => setSelectedCrsProvider(selectedItem.id.startsWith('placeholder-') || selectedItem.id.startsWith('error-') || selectedItem.id.startsWith('loading-') || selectedItem.id.startsWith('no-items-') ? null : selectedItem)} selectedItem={selectedCrsProvider} style={{ width: '100%' }} disabled={loadingCrs}/>
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
            <Dropdown id="contact-type-dropdown" titleText="" label="Select contact type..." items={contactTypeItems} itemToString={(item) => (item ? item.text : '')} onChange={({ selectedItem }) => setSelectedContactType(selectedItem.id.startsWith('placeholder-') ? null : selectedItem)} selectedItem={selectedContactType} style={{ width: '100%' }}/>
          </div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="contact-email">Email <span style={{color: 'red'}}>*</span></FormLabel>
          <div style={inputContainerStyle}><TextInput id="contact-email" type="email" labelText="" placeholder="e.g., contact@example.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} style={{ width: '100%' }} required /></div>
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
        
        {/* Botones de Acción */}
        <div style={buttonContainerStyle}>
          <Button kind="secondary" type="button" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" kind="primary" disabled={loadingChains || loadingBrands || loadingPms || loadingCrs}>
            Save
          </Button>
        </div>
      </Form>
    </div>
  );
}

export default HotelNewForm;