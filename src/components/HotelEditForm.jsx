// src/components/forms/HotelEditForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  NumberInput,
} from '@carbon/react';
import { getData as getCountryDataList } from 'country-list';
import {
  AsYouType,
  getExampleNumber,
  parsePhoneNumberFromString,
  getCountryCallingCode,
} from 'libphonenumber-js';
import ReactDOM from 'react-dom';
import { useAuthenticatedFetch } from '../services/apiService';


// --- Estilos (copiados de versiones anteriores, asegúrate que sean los correctos para ti) ---
const formContainerStyle = {
  padding: '2rem', maxWidth: '960px', minWidth: '700px', margin: '2rem auto',
  backgroundColor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
};
const formRowStyle = { display: 'flex', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1.5rem' };
const labelStyle = {
  flex: '0 0 200px', paddingTop: '0.5rem', textAlign: 'left', fontSize: '0.875rem',
  color: '#161616', lineHeight: '1.4', wordBreak: 'break-word',
};
const inputContainerStyle = { flex: '1 1 auto', minWidth: '250px' };
const formSectionTitleStyle = {
  fontSize: '1.375rem', fontWeight: 600, marginTop: '2.5rem', marginBottom: '1.5rem',
  paddingBottom: '0.75rem', borderBottom: '1px solid #dfe3e6', color: '#161616',
};
const buttonContainerStyle = { marginTop: '3rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' };

// --- Funciones Helper para Dropdown Placeholders ---
const createPlaceholderItem = (idSuffix, text) => ({ id: `placeholder-${idSuffix}`, text: `Select a ${text}...` });
const createLoadingItem = (idSuffix, text) => ({ id: `loading-${idSuffix}`, text: `Loading ${text}...` });
const createErrorItem = (idSuffix, text) => ({ id: `error-${idSuffix}`, text: `Error loading ${text}` });
const createSelectChainFirstItem = () => ({ id: `select-chain-brand`, text: 'Select chain first...' });
const createNoItemsItem = (idSuffix, text) => ({ id: `no-items-${idSuffix}`, text: `No ${text} available` });

const hotelStatusItems = [
  createPlaceholderItem('hotel-status', 'hotel status'),
  { id: 'A', text: 'Active' }, { id: 'I', text: 'Inactive' }, { id: 'P', text: 'Pending' },
];

function HotelEditForm() {
  const navigate = useNavigate();
  const { hotelId } = useParams();

  // Eliminar logs de ambiente
  // console.log('HotelEditForm - API_BASE_URL:', API_BASE_URL);

  const [initialDataLoading, setInitialDataLoading] = useState(true);
  const [isHotelFound, setIsHotelFound] = useState(true);
  const [originalHotelData, setOriginalHotelData] = useState(null); // Para comparar cambios y resetear

  const [chains, setChains] = useState([createLoadingItem('chains', 'chains')]);
  const [selectedChain, setSelectedChain] = useState(null);
  const [brands, setBrands] = useState([createSelectChainFirstItem()]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [loadingChains, setLoadingChains] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [countryDropdownItems, setCountryDropdownItems] = useState([createLoadingItem('country', 'countries')]);

  const [hotelCode, setHotelCode] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [selectedHotelStatus, setSelectedHotelStatus] = useState(null);
  const [streetAddress, setStreetAddress] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);
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
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const [floor, setFloor] = useState(0);

  const authenticatedFetch = useAuthenticatedFetch();

  useEffect(() => {
    try {
      const rawCountries = getCountryDataList();
      const formattedCountries = rawCountries.map(country => {
        let label = country.name;
        try {
          const callingCode = getCountryCallingCode(country.code);
          label = `${country.name} (+${callingCode})`;
        } catch (e) {
          console.warn(`Could not get calling code for country: ${country.name} (${country.code})`);
        }
        return { id: country.code, text: label, code: country.code };
      }).sort((a, b) => a.text.localeCompare(b.text));
      setCountryDropdownItems([createPlaceholderItem('country', 'country'), ...formattedCountries]);
    } catch (error) {
      console.error("Error loading country list:", error);
      setCountryDropdownItems([createErrorItem('country', 'countries')]);
    }
  }, []);

  // Cargar cadenas al inicio
  useEffect(() => {
    const loadChains = async () => {
      setLoadingChains(true);
      try {
        const response = await authenticatedFetch(`/chain`);
        if (!response.ok) throw new Error('Network response for chains was not ok');
        const data = await response.json();
        const chainItems = [
          createPlaceholderItem('chain', 'chain'),
          ...data.map(c => ({ id: c.chainId.toString(), text: c.chainName }))
        ];
        setChains(chainItems);
      } catch (error) {
        console.error("Error fetching chains:", error);
        setChains([createErrorItem('chains', 'chains')]);
        setFeedback({ type: 'error', message: `Error loading chains: ${error.message}` });
      } finally {
        setLoadingChains(false);
      }
    };

    loadChains();
  }, [authenticatedFetch]);

  const fetchBrandsForChain = useCallback(async (chainId) => {
    if (!chainId || String(chainId).startsWith('placeholder-')) {
      setBrands([createSelectChainFirstItem()]);
      setSelectedBrand(null);
      return [createSelectChainFirstItem()];
    }
    setLoadingBrands(true);
    setBrands([createLoadingItem('brands', 'brands')]);
    try {
      const response = await authenticatedFetch(`/chain/${chainId}/brands`);
      if (!response.ok) throw new Error('Network response for brands was not ok');
      const data = await response.json();
      const brandItemsList = data && data.length > 0 ?
        [createPlaceholderItem('brand', 'brand'), ...data.map(b => ({ id: b.brandId.toString(), text: b.brandName }))]
        : [createNoItemsItem('brands', 'brands for this chain')];
      setBrands(brandItemsList);
      return brandItemsList;
    } catch (error) {
      console.error("Error fetching brands for chain " + chainId + ":", error);
      setBrands([createErrorItem('brands', 'brands')]);
      return [createErrorItem('brands', 'brands')];
    } finally {
      setLoadingBrands(false);
    }
  }, [authenticatedFetch]);

  // Cargar datos del hotel
  useEffect(() => {
    const fetchHotelData = async () => {
      if (!hotelId) {
        console.error('No hotelId provided');
        setIsHotelFound(false);
        return;
      }

      setInitialDataLoading(true);

      try {
        const apiUrl = `/hotels/${hotelId}/withRelations`;
        const hotelResponse = await authenticatedFetch(apiUrl);

        if (!hotelResponse.ok) {
          if (hotelResponse.status === 404) {
            setIsHotelFound(false);
          }
          const errorText = await hotelResponse.text();
          throw new Error(`Network error loading hotel: ${hotelResponse.status} ${errorText}`);
        }

        const data = await hotelResponse.json();
        console.log('Hotel data loaded:', data);
        setIsHotelFound(true);
        
        // Batch all state updates together
        const updates = {
          originalHotelData: data,
          hotelCode: data.hotelCode || '',
          hotelName: data.hotelName || '',
          selectedHotelStatus: hotelStatusItems.find(item => item.id === data.hotelStatus) || null,
          website: data.hotelWebsiteUrl || '',
          disclaimer: data.disclaimer || '',
          floor: data.floor !== undefined && data.floor !== null ? data.floor : 0,
        };

        // Handle address data
        if (data.mainAddress) {
          updates.streetAddress = data.mainAddress.street || '';
          updates.stateProvince = data.mainAddress.state || '';
          updates.city = data.mainAddress.city || '';
          updates.zipCode = data.mainAddress.postalCode || '';
          
          const countryCode = data.mainAddress.country;
          if (countryCode && countryDropdownItems.length > 1) {
            updates.selectedCountry = countryDropdownItems.find(c => c.id === countryCode) || null;
          }
        }

        // Handle phone number
        if (data.localPhone) {
          updates.mainPhoneNumberRaw = data.localPhone;
          const countryCode = data.mainAddress?.country;
          if (countryCode) {
            const formatter = new AsYouType(countryCode);
            updates.mainPhoneNumberFormatted = formatter.input(data.localPhone);
          } else {
            updates.mainPhoneNumberFormatted = data.localPhone;
          }
        }

        // Handle contact data
        if (data.mainContact) {
          updates.contactFirstName = data.mainContact.firstName || '';
          updates.contactLastName = data.mainContact.lastName || '';
          updates.contactTitle = data.mainContact.contactTitle || '';
          updates.contactEmail = data.mainContact.contactEmail || '';
          
          if (data.mainContact.contactMobileNumber) {
            updates.contactMobilePhoneRaw = data.mainContact.contactMobileNumber;
            const countryCode = data.mainAddress?.country;
            if (countryCode) {
              const formatter = new AsYouType(countryCode);
              updates.contactMobilePhoneFormatted = formatter.input(data.mainContact.contactMobileNumber);
            } else {
              updates.contactMobilePhoneFormatted = data.mainContact.contactMobileNumber;
            }
          }
        }

        // Handle chain and brand data
        if (data.chainId && chains.length > 1) {
          const chainItem = chains.find(c => c.id === data.chainId.toString());
          if (chainItem) {
            updates.selectedChain = chainItem;
            
            try {
              const brandsResponse = await authenticatedFetch(`/chain/${data.chainId}/brands`);
              if (brandsResponse.ok) {
                const brandsData = await brandsResponse.json();
                const brandItems = [
                  createPlaceholderItem('brand', 'brand'),
                  ...brandsData.map(b => ({ id: b.brandId.toString(), text: b.brandName }))
                ];
                updates.brands = brandItems;

                if (data.brandId) {
                  const brandItem = brandItems.find(b => b.id === data.brandId.toString());
                  if (brandItem) {
                    updates.selectedBrand = brandItem;
                  }
                }
              }
            } catch (error) {
              console.error("Error fetching brands for chain:", error);
              updates.brands = [createErrorItem('brands', 'brands')];
            }
          }
        }

        // Apply all updates at once using a React batch update
        ReactDOM.unstable_batchedUpdates(() => {
          setOriginalHotelData(updates.originalHotelData);
          setHotelCode(updates.hotelCode);
          setHotelName(updates.hotelName);
          setSelectedHotelStatus(updates.selectedHotelStatus);
          setWebsite(updates.website);
          setDisclaimer(updates.disclaimer);
          setFloor(updates.floor);
          
          if (updates.streetAddress !== undefined) {
            setStreetAddress(updates.streetAddress);
            setStateProvince(updates.stateProvince);
            setCity(updates.city);
            setZipCode(updates.zipCode);
            if (updates.selectedCountry) setSelectedCountry(updates.selectedCountry);
          }
          
          if (updates.mainPhoneNumberRaw !== undefined) {
            setMainPhoneNumberRaw(updates.mainPhoneNumberRaw);
            setMainPhoneNumberFormatted(updates.mainPhoneNumberFormatted);
          }
          
          if (updates.contactFirstName !== undefined) {
            setContactFirstName(updates.contactFirstName);
            setContactLastName(updates.contactLastName);
            setContactTitle(updates.contactTitle);
            setContactEmail(updates.contactEmail);
          }
          
          if (updates.contactMobilePhoneRaw !== undefined) {
            setContactMobilePhoneRaw(updates.contactMobilePhoneRaw);
            setContactMobilePhoneFormatted(updates.contactMobilePhoneFormatted);
          }
          
          if (updates.selectedChain !== undefined) {
            setSelectedChain(updates.selectedChain);
            if (updates.brands) setBrands(updates.brands);
            if (updates.selectedBrand) setSelectedBrand(updates.selectedBrand);
          }
          
          setIsHotelFound(true);
        });

      } catch (error) {
        console.error('Error loading hotel data:', error);
        setFeedback({
          type: 'error',
          message: error.message || 'Failed to load hotel data'
        });
        setIsHotelFound(false);
      } finally {
        setInitialDataLoading(false);
      }
    };

    // Solo ejecutar fetchHotelData cuando chains y countryDropdownItems estén cargados
    if (chains.length > 1 && countryDropdownItems.length > 1) {
      fetchHotelData();
    }
  }, [hotelId, chains, countryDropdownItems, authenticatedFetch]); // Agregamos las dependencias necesarias

  const validatePhoneNumber = (numberRaw, countryCodeISO, fieldName, setErrorFunc) => {
    if (!numberRaw || numberRaw.trim() === '') {
      setErrorFunc('');
      return null;
    }
    if (!countryCodeISO) {
      setErrorFunc(`${fieldName}: Select a country to validate phone.`);
      return null;
    }

    try {
      // Intentar parsear el número de teléfono
      const phoneNumber = parsePhoneNumberFromString(numberRaw, countryCodeISO);
      
      // Si no se puede parsear el número para este país, permitir el número sin validación
      if (!phoneNumber) {
        console.warn(`Country ${countryCodeISO} not supported for phone validation. Allowing number as-is.`);
        setErrorFunc('');
        return numberRaw;
      }

      // Si se pudo parsear, validar el número
      if (phoneNumber.isValid()) {
        setErrorFunc('');
        return phoneNumber.format('E.164');
      } else {
        setErrorFunc(`${fieldName}: Invalid phone number for selected country.`);
        return null;
      }
    } catch (error) {
      // Si hay un error con el país, permitir el número sin validación
      console.warn(`Error validating phone for country ${countryCodeISO}:`, error);
      setErrorFunc('');
      return numberRaw;
    }
  };

  const getPhonePlaceholder = (countryCodeISO) => {
    if (!countryCodeISO) return 'Enter phone number';
    
    try {
      const example = getExampleNumber(countryCodeISO, 'NATIONAL');
      if (example) return example.formatNational();
    } catch (e) {
      // Si no se puede obtener un ejemplo, devolver un formato genérico
      console.warn(`Could not get example for country ${countryCodeISO}:`, e);
    }
    return 'Enter phone number (no specific format available)';
  };
  
  const handlePhoneNumberChange = (rawValue, countryCodeISO, setRawValue, setFormattedValue, setErrorValue) => {
    setRawValue(rawValue);
    if (!countryCodeISO) {
      setFormattedValue(rawValue);
      if (rawValue) setErrorValue('Please select a country first to format/validate phone number.');
      else setErrorValue('');
      return;
    }

    try {
      const formatter = new AsYouType(countryCodeISO);
      const formattedNumber = formatter.input(rawValue);
      setFormattedValue(formattedNumber || rawValue);
      setErrorValue('');
    } catch (error) {
      // Si hay un error con el formato, mantener el número sin formato
      console.warn(`Could not format phone for country ${countryCodeISO}:`, error);
      setFormattedValue(rawValue);
      setErrorValue('');
    }
  };

  const resetFormFieldsToOriginal = useCallback(() => {
    if (!originalHotelData) return; // No hacer nada si no hay datos originales
    const data = originalHotelData; // Usar datos guardados
  
    setHotelCode(data.hotelCode || '');
    setHotelName(data.hotelName || '');
    const statusItem = hotelStatusItems.find(item => item.id === data.hotelStatus);
    setSelectedHotelStatus(statusItem || null);
    setWebsite(data.hotelWebsiteUrl || '');
    setDisclaimer(data.disclaimer || '');
    setFloor(data.floor !== undefined && data.floor !== null ? data.floor : 0);
  
    let hotelCountryCode = null;
    if (data.mainAddress) {
      setStreetAddress(data.mainAddress.street || '');
      setStateProvince(data.mainAddress.state || '');
      setCity(data.mainAddress.city || '');
      setZipCode(data.mainAddress.postalCode || '');
      hotelCountryCode = data.mainAddress.country;
      if (hotelCountryCode && countryDropdownItems.length > 1) {
        const countryItem = countryDropdownItems.find(c => c.id === hotelCountryCode);
        setSelectedCountry(countryItem || null);
      } else { setSelectedCountry(null); }
    } else { setSelectedCountry(null); }
  
    if (data.localPhone) {
      setMainPhoneNumberRaw(data.localPhone);
      if (hotelCountryCode) {
        const formatter = new AsYouType(hotelCountryCode);
        setMainPhoneNumberFormatted(formatter.input(data.localPhone));
      } else { setMainPhoneNumberFormatted(data.localPhone); }
    } else { setMainPhoneNumberRaw(''); setMainPhoneNumberFormatted(''); }
  
    if (data.mainContact) {
      setContactFirstName(data.mainContact.firstName || '');
      setContactLastName(data.mainContact.lastName || '');
      setContactTitle(data.mainContact.contactTitle || '');
      setContactEmail(data.mainContact.contactEmail || '');
      if (data.mainContact.contactMobileNumber) {
        setContactMobilePhoneRaw(data.mainContact.contactMobileNumber);
        if (hotelCountryCode) {
          const formatter = new AsYouType(hotelCountryCode);
          setContactMobilePhoneFormatted(formatter.input(data.mainContact.contactMobileNumber));
        } else { setContactMobilePhoneFormatted(data.mainContact.contactMobileNumber); }
      } else { setContactMobilePhoneRaw(''); setContactMobilePhoneFormatted('');}
    }
  
    if (data.chainId && data.chainName && chains.length > 1) {
      const chainItem = chains.find(c => c.id === data.chainId.toString());
      if (chainItem) {
        setSelectedChain(chainItem);
        // No llamamos a fetchBrands aquí, asumimos que se cargaron o se cargarán por el useEffect de selectedChain
        // y luego se intentará seleccionar la marca. Para un reset simple, esto es complejo.
        // Es más simple dejar que el usuario re-seleccione la marca si la cadena cambia.
        // O, si las marcas ya están cargadas para esa cadena:
        if (data.brandId && data.brandName && brands.length > 1) {
            const brandItem = brands.find(b => b.id === data.brandId.toString());
            setSelectedBrand(brandItem || null);
        } else {
            setSelectedBrand(null);
        }

      } else { setSelectedChain(null); setSelectedBrand(null); }
    } else { setSelectedChain(null); setSelectedBrand(null); }
    setMainPhoneNumberError('');
    setContactMobilePhoneError('');
    setFeedback({type: '', message: ''});

  }, [originalHotelData, countryDropdownItems, chains, brands]); // Dependencias para resetear


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    setFeedback({ type: '', message: '' });

    const currentCountryCode = selectedCountry ? selectedCountry.code : null;
    const finalValidatedMainPhone = validatePhoneNumber(mainPhoneNumberRaw, currentCountryCode, "Hotel Phone", setMainPhoneNumberError);
    const finalValidatedContactPhone = validatePhoneNumber(contactMobilePhoneRaw, currentCountryCode, "Contact Phone", setContactMobilePhoneError);

    if (!hotelName || !selectedBrand?.id || !selectedHotelStatus?.id || !contactFirstName || !contactLastName || !contactEmail || !selectedCountry?.id) {
      setFeedback({ type: 'error', message: 'Please fill in all required fields marked with an asterisk (*).' });
      setIsSubmitting(false); window.scrollTo({ top: 0, behavior: 'smooth' }); return;
    }
    if ((mainPhoneNumberRaw.trim() !== '' && !finalValidatedMainPhone) || (contactMobilePhoneRaw.trim() !== '' && !finalValidatedContactPhone)) {
      setFeedback({ type: 'error', message: 'Please correct the invalid phone numbers.' });
      setIsSubmitting(false); window.scrollTo({ top: 0, behavior: 'smooth' }); return;
    }

    const payload = {
      hotelCode: hotelCode || null,
      hotelName,
      hotelStatus: selectedHotelStatus.id,
      brandId: parseInt(selectedBrand.id, 10),
      localPhone: finalValidatedMainPhone,
      disclaimer: disclaimer || null,
      hotelWebsiteUrl: website || null,
      mainContact: {
        firstName: contactFirstName,
        lastName: contactLastName,
        contactTitle: contactTitle || null,
        contactEmail,
        contactMobileNumber: finalValidatedContactPhone,
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
      floor: floor !== undefined && floor !== null ? floor : 0,
    };
    console.log('Submitting Update Form Data to Backend:', JSON.stringify(payload, null, 2));

    try {
      const response = await authenticatedFetch(`/hotels/updateWithDetails/${hotelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API Error ${response.status}: ${errorBody || response.statusText}`);
      }
      const result = await response.json();
      setFeedback({ type: 'success', message: `Hotel "${result.hotelName || payload.hotelName}" updated successfully!` });
      setOriginalHotelData(prev => ({...prev, ...payload, // Actualizar data original con lo guardado
        brandName: selectedBrand?.text, chainName: selectedChain?.text // Añadir nombres para el reset
    })); 
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // No navegar automáticamente para que el usuario vea el mensaje.
      // setTimeout(() => navigate('/hotel-list'), 2000); 
    } catch (error) {
      console.error('Error updating hotel:', error);
      setFeedback({ type: 'error', message: `Error updating hotel: ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteAttempt = () => setOpenDeleteModal(true);
  const proceedWithDelete = async () => {
    setOpenDeleteModal(false);
    setIsSubmitting(true); 
    setFeedback({ type: '', message: '' });
    try {
      const response = await authenticatedFetch(`/hotels/${hotelId}/soft-delete`, {
        method: 'PUT',
      });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API Error ${response.status}: ${errorBody || response.statusText}`);
      }
      setFeedback({ type: 'success', message: `Hotel (ID: ${hotelId}) has been marked as deleted.` });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => navigate('/hotel-list'), 2500);
    } catch (error) {
      console.error('Error deleting hotel:', error);
      setFeedback({ type: 'error', message: `Error deleting hotel: ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };
  const closeDeleteModal = () => setOpenDeleteModal(false);

  const handleCancelAttempt = () => {
    // Aquí podrías añadir una lógica para verificar si hay cambios sin guardar
    // Si hay cambios, muestra el modal. Si no, simplemente navega.
    // Por ahora, siempre muestra el modal como en HotelNewForm.
    setOpenCancelModal(true);
  };
  const proceedWithCancel = () => {
    setOpenCancelModal(false);
    resetFormFieldsToOriginal(); // Opcional: resetear al estado original cargado
    navigate(-1);
  };
  const closeModal = () => setOpenCancelModal(false);

  const validateForm = () => {
    // Implementa la lógica para validar el formulario
    return true; // Placeholder, actual implementación necesaria
  };

  if (initialDataLoading) {
    return <Loading description="Loading hotel data..." withOverlay={false} style={{ margin: '2rem' }} />;
  }

  if (!isHotelFound) {
    return (
      <div style={formContainerStyle}>
        <InlineNotification
          kind="error" title="Hotel Not Found"
          subtitle={feedback.message || `Could not find hotel with ID ${hotelId}.`}
          onCloseButtonClick={() => navigate('/hotel-list')} lowContrast
        />
        <Button onClick={() => navigate('/hotel-list')} style={{marginTop: '1rem'}}>Back to Hotel List</Button>
      </div>
    );
  }

  return (
    <div style={formContainerStyle}>
      <h1 style={{ marginBottom: '0.5rem', color: '#161616' }}>Edit Hotel Configuration</h1>
      <p style={{ marginBottom: '2rem', color: '#525252', fontSize: '0.875rem' }}>
        Modify the hotel configuration below. Fields marked with (<span style={{ color: 'red' }}>*</span>) are required.
      </p>

      {isSubmitting && <Loading description="Processing..." withOverlay={false} style={{ marginBottom: '1rem' }} />}
      {feedback.message && (
        <div style={{ marginBottom: '1rem' }}>
          <InlineNotification
            kind={feedback.type === 'error' ? 'error' : 'success'}
            title={feedback.type === 'error' ? 'Error' : 'Success'}
            subtitle={feedback.message}
            onCloseButtonClick={() => setFeedback({ type: '', message: '' })}
            lowContrast={true}
          />
        </div>
      )}

      <Form onSubmit={handleSubmit}>
        {/* --- Sección Chain & Brand --- */}
        <h2 style={formSectionTitleStyle}>Chain & Brand</h2>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="chain-dropdown">Chain <span style={{ color: 'red' }}>*</span></FormLabel>
          <div style={inputContainerStyle}>
            <Dropdown
              id="chain-dropdown" titleText=""
              label={loadingChains ? "Loading chains..." : (selectedChain?.text || (chains[0]?.id.startsWith('placeholder-') ? chains[0]?.text : "Select a chain..."))}
              items={chains} itemToString={(item) => (item ? item.text : '')}
              onChange={({ selectedItem }) => {
                const newChain = selectedItem.id.startsWith('placeholder-') ? null : selectedItem;
                if (selectedChain?.id !== newChain?.id) {
                    setSelectedChain(newChain);
                    setSelectedBrand(null); 
                    if (newChain && newChain.id) fetchBrandsForChain(newChain.id);
                    else setBrands([createSelectChainFirstItem()]);
                }
              }}
              selectedItem={selectedChain} disabled={loadingChains || countryDropdownItems[0]?.id.startsWith('loading-')} style={{ width: '100%' }}
            />
          </div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="brand-dropdown">Brand <span style={{ color: 'red' }}>*</span></FormLabel>
          <div style={inputContainerStyle}>
            <Dropdown
              id="brand-dropdown" titleText=""
              label={loadingBrands ? "Loading brands..." : (selectedBrand?.text || (brands[0]?.id.startsWith('placeholder-') || brands[0]?.id.startsWith('select-chain-') ? brands[0]?.text : "Select brand..."))}
              items={brands} itemToString={(item) => (item ? item.text : '')}
              onChange={({ selectedItem }) => setSelectedBrand(selectedItem.id.startsWith('placeholder-') || selectedItem.id.startsWith('select-chain-') || selectedItem.id.startsWith('no-items-') ? null : selectedItem)}
              selectedItem={selectedBrand} disabled={!selectedChain || loadingBrands || brands.length === 0 || brands[0].id.startsWith('select-chain-') || brands[0].id.startsWith('loading-')} style={{ width: '100%' }}
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
          <FormLabel style={labelStyle} htmlFor="hotel-status-dropdown">Hotel Status <span style={{color: 'red'}}>*</span></FormLabel>
          <div style={inputContainerStyle}>
            <Dropdown 
              id="hotel-status-dropdown" 
              titleText="" 
              label={selectedHotelStatus?.text || (hotelStatusItems.find(s => s.id.startsWith('placeholder-'))?.text || "Select hotel status...")}
              items={hotelStatusItems} 
              itemToString={(item) => (item ? item.text : '')} 
              onChange={({ selectedItem }) => setSelectedHotelStatus(selectedItem.id.startsWith('placeholder-') ? null : selectedItem)} 
              selectedItem={selectedHotelStatus} 
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="street-address">Street Address</FormLabel>
          <div style={inputContainerStyle}><TextInput id="street-address" labelText="" placeholder="e.g., 123 Main St" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} style={{ width: '100%' }} /></div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="country-dropdown">Country <span style={{color: 'red'}}>*</span></FormLabel>
          <div style={inputContainerStyle}>
            <Dropdown
              id="country-dropdown" titleText=""
              label={selectedCountry?.text || (countryDropdownItems.find(c=>c.id.startsWith('placeholder-'))?.text || "Select country...")}
              items={countryDropdownItems} itemToString={(item) => (item ? item.text : '')}
              onChange={({ selectedItem }) => {
                const newCountry = selectedItem.id.startsWith('placeholder-') ? null : selectedItem;
                if (selectedCountry?.code !== newCountry?.code) {
                    setSelectedCountry(newCountry);
                    const newCountryCode = newCountry ? newCountry.code : null;
                    // Al cambiar de país, reformatear los teléfonos usando el valor RAW existente
                    setMainPhoneNumberFormatted(newCountryCode && mainPhoneNumberRaw ? new AsYouType(newCountryCode).input(mainPhoneNumberRaw) : mainPhoneNumberRaw);
                    setContactMobilePhoneFormatted(newCountryCode && contactMobilePhoneRaw ? new AsYouType(newCountryCode).input(contactMobilePhoneRaw) : contactMobilePhoneRaw);
                    setMainPhoneNumberError(''); 
                    setContactMobilePhoneError('');
                }
              }}
              selectedItem={selectedCountry} disabled={countryDropdownItems[0]?.id.startsWith('loading-')} style={{ width: '100%' }}
            />
          </div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="state-province">State / Province</FormLabel>
          <div style={inputContainerStyle}><TextInput id="state-province" labelText="" placeholder="e.g., Florida" value={stateProvince} onChange={(e) => setStateProvince(e.target.value)} style={{ width: '100%' }} /></div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="city">City</FormLabel>
          <div style={inputContainerStyle}><TextInput id="city" labelText="" placeholder="e.g., Miami" value={city} onChange={(e) => setCity(e.target.value)} style={{ width: '100%' }}/></div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="zip-code">Zip Code / Postal Code</FormLabel>
          <div style={inputContainerStyle}><TextInput id="zip-code" labelText="" placeholder="e.g., 33101" value={zipCode} onChange={(e) => setZipCode(e.target.value)} style={{ width: '100%' }} /></div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="main-phone-number">Phone Number</FormLabel>
          <div style={inputContainerStyle}>
            <TextInput id="main-phone-number" type="tel" 
              labelText="" 
              placeholder={getPhonePlaceholder(selectedCountry?.code)}
              value={mainPhoneNumberFormatted}
              onChange={(e) => handlePhoneNumberChange(e.target.value, selectedCountry?.code, setMainPhoneNumberRaw, setMainPhoneNumberFormatted, setMainPhoneNumberError)}
              onBlur={() => validatePhoneNumber(mainPhoneNumberRaw, selectedCountry?.code, "Hotel Phone", setMainPhoneNumberError)}
              invalid={!!mainPhoneNumberError} invalidText={mainPhoneNumberError} style={{ width: '100%' }}
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
              id="contact-mobile-phone" type="tel" labelText=""
              placeholder={getPhonePlaceholder(selectedCountry?.code)}
              value={contactMobilePhoneFormatted}
              onChange={(e) => handlePhoneNumberChange(e.target.value, selectedCountry?.code, setContactMobilePhoneRaw, setContactMobilePhoneFormatted, setContactMobilePhoneError)}
              onBlur={() => validatePhoneNumber(contactMobilePhoneRaw, selectedCountry?.code, "Contact Phone", setContactMobilePhoneError)}
              invalid={!!contactMobilePhoneError} invalidText={contactMobilePhoneError} style={{ width: '100%' }}
            />
          </div>
        </div>
        <div style={formRowStyle}>
          <FormLabel style={labelStyle} htmlFor="contact-email">Email <span style={{color: 'red'}}>*</span></FormLabel>
          <div style={inputContainerStyle}><TextInput id="contact-email" type="email" labelText="" placeholder="e.g., contact@example.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} style={{ width: '100%' }} required /></div>
        </div>
        
        <div style={buttonContainerStyle}>
          <Button kind="secondary" type="button" onClick={handleCancelAttempt} disabled={isSubmitting}>Cancel</Button>
          <Button kind="danger--tertiary" type="button" onClick={handleDeleteAttempt} disabled={isSubmitting} style={{marginRight: 'auto'}}>Delete Hotel</Button>
          <Button type="submit" kind="primary" disabled={isSubmitting || loadingChains || loadingBrands || initialDataLoading}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Form>

      <ComposedModal open={openCancelModal} onClose={closeModal} preventCloseOnClickOutside={false} size="sm">
        <ModalHeader title="Discard Changes?" closeModal={closeModal} />
        <ModalBody><p style={{ marginBottom: '1rem' }}>Any unsaved changes will be lost and you will be navigated away.</p><p>Are you sure you want to cancel?</p></ModalBody>
        <ModalFooter><Button kind="secondary" onClick={closeModal}>No</Button><Button kind="primary" onClick={proceedWithCancel}>Yes, Cancel</Button></ModalFooter>
      </ComposedModal>

      <ComposedModal open={openDeleteModal} onClose={closeDeleteModal} danger preventCloseOnClickOutside={false} size="sm">
        <ModalHeader title="Confirm Deletion" label="This action cannot be undone." closeModal={closeDeleteModal} />
        <ModalBody>
          <p style={{ marginBottom: '1rem' }}>
            Are you sure you want to delete the hotel: <strong>{originalHotelData?.hotelName || `ID ${hotelId}`}</strong>?
          </p>
          <p>This will mark the hotel as inactive and it may not be recoverable.</p>
        </ModalBody>
        <ModalFooter><Button kind="secondary" onClick={closeDeleteModal}>Cancel</Button><Button kind="danger" onClick={proceedWithDelete}>Delete Hotel</Button></ModalFooter>
      </ComposedModal>
    </div>
  );
}

export default HotelEditForm;