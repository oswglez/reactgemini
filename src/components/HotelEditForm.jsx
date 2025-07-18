// src/components/HotelEditForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
import { getData as getCountryDataList } from 'country-list';
import {
  AsYouType,
  parsePhoneNumberFromString,
  getCountryCallingCode,
} from 'libphonenumber-js';
import { useAuthenticatedFetch } from '../services/apiService';
import './HotelEditForm.css';

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
  const location = useLocation();
  const { hotelId } = useParams();
  
  // Get user role info from navigation state
  const userRoleInfo = location.state?.userRoleInfo;
  
  // Determine if form should be disabled based on user permissions
  const isFormDisabled = userRoleInfo && !userRoleInfo.canEdit;

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
          console.log('Error loading country list:', e);
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
        const response = await authenticatedFetch(`/users/available-chains`);
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
      const response = await authenticatedFetch(`/users/available-brands?chainId=${chainId}`);
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
//      await new Promise(res => setTimeout(res, 2000)); // 2 segundos de delay para ver el spinning

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

        // Apply all updates at once
          setOriginalHotelData(updates.originalHotelData);
          setHotelCode(updates.hotelCode);
          setHotelName(updates.hotelName);
          setSelectedHotelStatus(updates.selectedHotelStatus);
          setWebsite(updates.website);
          setDisclaimer(updates.disclaimer);
          
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
    
    // Return a generic placeholder since getExampleNumber is not available
    return 'Enter phone number';
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
    // setFloor(data.floor !== undefined && data.floor !== null ? data.floor : 0); // Removed unused floor state
  
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

  // Compara los valores actuales con los originales para detectar cambios
  const isFormDirty = () => {
    if (!originalHotelData) return false;
    return (
      hotelCode !== originalHotelData.hotelCode ||
      hotelName !== originalHotelData.hotelName ||
      selectedHotelStatus?.id !== originalHotelData.hotelStatus ||
      streetAddress !== (originalHotelData.mainAddress?.street || '') ||
      selectedCountry?.id !== (originalHotelData.mainAddress?.countryCode || '') ||
      stateProvince !== (originalHotelData.mainAddress?.stateProvince || '') ||
      city !== (originalHotelData.mainAddress?.city || '') ||
      zipCode !== (originalHotelData.mainAddress?.zipCode || '') ||
      mainPhoneNumberRaw !== (originalHotelData.mainContact?.contactMobileNumber || '') ||
      website !== originalHotelData.hotelWebsiteUrl ||
      disclaimer !== originalHotelData.disclaimer ||
      contactFirstName !== (originalHotelData.mainContact?.firstName || '') ||
      contactLastName !== (originalHotelData.mainContact?.lastName || '') ||
      contactTitle !== (originalHotelData.mainContact?.contactTitle || '') ||
      contactMobilePhoneRaw !== (originalHotelData.mainContact?.contactMobileNumber || '') ||
      contactEmail !== (originalHotelData.mainContact?.contactEmail || '') ||
      selectedChain?.id !== (originalHotelData.chainId ? originalHotelData.chainId.toString() : '') ||
      selectedBrand?.id !== (originalHotelData.brandId ? originalHotelData.brandId.toString() : '')
    );
  };

  const handleCancelAttempt = () => {
    if (!isFormDisabled && isFormDirty()) {
      // Debug: muestra diferencias
      console.log('Diferencias detectadas:', {
 //       hotelCode, original: originalHotelData.hotelCode,
        hotelName, original: originalHotelData.hotelName,
        // ...agrega aquí los campos que quieras comparar
      });
    }
    if (isFormDisabled || !isFormDirty()) {
      navigate('/hotel-list');
    } else {
      setOpenCancelModal(true);
    }
  };
  const proceedWithCancel = () => {
    setOpenCancelModal(false);
    resetFormFieldsToOriginal(); // Opcional: resetear al estado original cargado
    navigate(-1);
  };
  const closeModal = () => setOpenCancelModal(false);

  const handleDeleteAttempt = () => setOpenDeleteModal(true);
  const closeDeleteModal = () => setOpenDeleteModal(false);

  const proceedWithDelete = async () => {
    setOpenDeleteModal(false);
    setIsSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      const response = await authenticatedFetch(`/hotels/${hotelId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        throw new Error(`HTTP ${response.status}: ${response.statusText || 'Failed to delete hotel'}. ${errorData}`);
      }

      console.log('Hotel deleted successfully');

      setFeedback({ 
        type: 'success', 
        message: `Hotel "${originalHotelData?.hotelName || `ID ${hotelId}`}" deleted successfully! Redirecting to hotel list...` 
      });

      // Redirect to hotel list after a short delay
      setTimeout(() => {
        navigate('/hotels');
      }, 2000);

    } catch (error) {
      console.error('Error deleting hotel:', error);
      setFeedback({ 
        type: 'error', 
        message: `Failed to delete hotel: ${error.message}` 
      });
    } finally {
      setIsSubmitting(false);
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
        hotelStatus: selectedHotelStatus.id,
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

      console.log('Submitting hotel update data:', hotelData);

      const response = await authenticatedFetch(`/hotels/updateWithDetails/${hotelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hotelData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        throw new Error(`HTTP ${response.status}: ${response.statusText || 'Failed to update hotel'}. ${errorData}`);
      }

      const result = await response.json();
      console.log('Hotel updated successfully:', result);

      setFeedback({ 
        type: 'success', 
        message: `Hotel "${hotelName}" updated successfully! Redirecting to hotel list...` 
      });

      // Redirect to hotel list after a short delay
      setTimeout(() => {
        navigate('/hotels');
      }, 2000);

    } catch (error) {
      console.error('Error updating hotel:', error);
      setFeedback({ 
        type: 'error', 
        message: `Failed to update hotel: ${error.message}` 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateRequiredFields = () => {
    const requiredFields = {
      selectedChain: 'Chain',
      selectedBrand: 'Brand',
      hotelName: 'Hotel Name',
      selectedHotelStatus: 'Hotel Status',
      selectedCountry: 'Country',
      contactFirstName: 'Contact First Name',
      contactLastName: 'Contact Last Name',
      contactEmail: 'Contact Email'
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      const value = eval(field);
      if (!value || (typeof value === 'string' && !value.trim())) {
        setFeedback({ type: 'error', message: `${label} is required.` });
        return false;
      }
    }

    return true;
  };

  if (initialDataLoading) {
    return (
      <div className="hotel-edit-form-container">
        <Loading description="Loading hotel data..." withOverlay={false} className="loading-indicator" />
      </div>
    );
  }

  if (!isHotelFound) {
    return (
      <div className="hotel-edit-form-container">
        <div className="hotel-edit-form-content">
        <InlineNotification
            kind="error" 
            title="Hotel Not Found"
          subtitle={feedback.message || `Could not find hotel with ID ${hotelId}.`}
            onCloseButtonClick={() => navigate('/hotels')} 
            lowContrast
        />
          <Button onClick={() => navigate('/hotels')} className="nav-button back-button">
            <span className="nav-icon">←</span>
            Back to Properties
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="hotel-edit-form-container">
      <div className="hotel-edit-form-content">
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
          <h1 className="page-title">Edit Property</h1>
        </div>

        {/* Loading and Notifications */}
        {isSubmitting && <Loading description="Processing..." withOverlay={false} className="loading-indicator" />}
      {feedback.message && (
          <div className="notification-container">
          <InlineNotification
            kind={feedback.type === 'error' ? 'error' : 'success'}
            title={feedback.type === 'error' ? 'Error' : 'Success'}
            subtitle={feedback.message}
            onCloseButtonClick={() => setFeedback({ type: '', message: '' })}
            lowContrast={true}
          />
        </div>
      )}

        {/* Show read-only warning if user doesn't have edit permissions */}
        {userRoleInfo && !userRoleInfo.canEdit && (
          <div className="notification-container">
          <InlineNotification
            kind="warning"
            title="Read-Only Mode"
            subtitle="You don't have permission to edit this hotel. All fields are disabled."
            lowContrast
          />
          </div>
        )}
        
        <Form onSubmit={handleSubmit} className="hotel-form">
        {/* Wrapper to disable only text input fields when user doesn't have edit permissions */}
          <div className={isFormDisabled ? 'read-only-mode' : ''}>
        
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
                      id="chain-dropdown"
                      titleText=""
                      placeholder={loadingChains ? "Loading..." : "Select a chain..."}
                      items={chains}
                      itemToString={(item) => (item ? item.text : '')}
              onChange={({ selectedItem }) => {
                        const newChain = selectedItem && !selectedItem.id.startsWith('placeholder-') ? selectedItem : null;
                if (selectedChain?.id !== newChain?.id) {
                    setSelectedChain(newChain);
                    setSelectedBrand(null); 
                    if (newChain && newChain.id) fetchBrandsForChain(newChain.id);
                    else setBrands([createSelectChainFirstItem()]);
                }
              }}
                      selectedItem={selectedChain}
                      disabled={loadingChains || countryDropdownItems[0]?.id.startsWith('loading-') || isFormDisabled}
                      className="form-dropdown"
            />
          </div>
                  <div className="form-field">
                    <FormLabel className="field-label" htmlFor="brand-dropdown">
                      Brand Name <span className="required-mark">*</span>
                    </FormLabel>
            <Dropdown
                      id="brand-dropdown"
                      titleText=""
                      placeholder={loadingBrands ? "Loading..." : (!selectedChain || selectedChain.id.startsWith('placeholder-') ? "Select chain first" : "Select a brand...")}
                      items={brands}
                      itemToString={(item) => (item ? item.text : '')}
                      onChange={({ selectedItem }) => setSelectedBrand(selectedItem && !selectedItem.id.startsWith('placeholder-') && !selectedItem.id.startsWith('select-chain-') && !selectedItem.id.startsWith('no-items-') ? selectedItem : null)}
                      selectedItem={selectedBrand}
                      disabled={!selectedChain || !!selectedChain?.id.startsWith('placeholder-') || loadingBrands || !brands.length || !!brands[0]?.id.startsWith('select-chain-') || !!brands[0]?.id.startsWith('no-items-') || !!brands[0]?.id.startsWith('error-') || !!brands[0]?.id.startsWith('loading-') || isFormDisabled}
                      className="form-dropdown"
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
                <div className="form-row three-columns">
                  <div className="form-field">
                    <FormLabel className="field-label" htmlFor="hotel-code">
                      Hotel Code
                    </FormLabel>
                    <TextInput 
                      id="hotel-code" 
                      labelText="" 
                      placeholder="Internal Hotel Code" 
                      value={hotelCode} 
                      onChange={(e) => setHotelCode(e.target.value)} 
                      disabled={isFormDisabled} 
                      className="form-input"
                    />
        </div>
                  <div className="form-field">
                    <FormLabel className="field-label" htmlFor="hotel-name">
                      Name <span className="required-mark">*</span>
                    </FormLabel>
                    <TextInput 
                      id="hotel-name" 
                      labelText="" 
                      placeholder="Official Property Name" 
                      value={hotelName} 
                      onChange={(e) => setHotelName(e.target.value)} 
                      disabled={isFormDisabled} 
                      className="form-input"
                      required 
                    />
                  </div>
                  <div className="form-field">
                    <FormLabel className="field-label" htmlFor="hotel-status-dropdown">
                      Hotel Status <span className="required-mark">*</span>
                    </FormLabel>
            <Dropdown 
              id="hotel-status-dropdown" 
              titleText="" 
                      placeholder="Select hotel status..."
              items={hotelStatusItems} 
              itemToString={(item) => (item ? item.text : '')} 
                      onChange={({ selectedItem }) => setSelectedHotelStatus(selectedItem && !selectedItem.id.startsWith('placeholder-') ? selectedItem : null)} 
              selectedItem={selectedHotelStatus} 
              disabled={isFormDisabled}
                      className="form-dropdown"
            />
          </div>
        </div>

                <div className="form-row three-columns">
                  <div className="form-field">
                    <FormLabel className="field-label" htmlFor="street-address">
                      Street Address
                    </FormLabel>
                    <TextInput 
                      id="street-address" 
                      labelText="" 
                      placeholder="e.g., 123 Main St" 
                      value={streetAddress} 
                      onChange={(e) => setStreetAddress(e.target.value)} 
                      disabled={isFormDisabled} 
                      className="form-input"
                    />
        </div>
                  <div className="form-field">
                    <FormLabel className="field-label" htmlFor="country-dropdown">
                      Country <span className="required-mark">*</span>
                    </FormLabel>
            <Dropdown
                      id="country-dropdown"
                      titleText=""
                      placeholder="Select country..."
                      items={countryDropdownItems}
                      itemToString={(item) => (item ? item.text : '')}
              onChange={({ selectedItem }) => {
                        const newCountry = selectedItem && !selectedItem.id.startsWith('placeholder-') ? selectedItem : null;
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
                      selectedItem={selectedCountry}
                      disabled={countryDropdownItems[0]?.id.startsWith('loading-') || isFormDisabled}
                      className="form-dropdown"
            />
          </div>
                  <div className="form-field">
                    <FormLabel className="field-label" htmlFor="state-province">
                      State / Province
                    </FormLabel>
                    <TextInput 
                      id="state-province" 
                      labelText="" 
                      placeholder="e.g., Florida" 
                      value={stateProvince} 
                      onChange={(e) => setStateProvince(e.target.value)} 
                      disabled={isFormDisabled} 
                      className="form-input"
                    />
        </div>
        </div>

                <div className="form-row three-columns">
                  <div className="form-field">
                    <FormLabel className="field-label" htmlFor="city">
                      City
                    </FormLabel>
                    <TextInput 
                      id="city" 
                      labelText="" 
                      placeholder="e.g., Miami" 
                      value={city} 
                      onChange={(e) => setCity(e.target.value)} 
                      disabled={isFormDisabled} 
                      className="form-input"
                    />
        </div>
                  <div className="form-field">
                    <FormLabel className="field-label" htmlFor="zip-code">
                      Zip Code / Postal Code
                    </FormLabel>
                    <TextInput 
                      id="zip-code" 
                      labelText="" 
                      placeholder="e.g., 33101" 
                      value={zipCode} 
                      onChange={(e) => setZipCode(e.target.value)} 
                      disabled={isFormDisabled} 
                      className="form-input"
                    />
        </div>
                  <div className="form-field">
                    <FormLabel className="field-label" htmlFor="main-phone-number">
                      Phone Number
                    </FormLabel>
                    <TextInput 
                      id="main-phone-number" 
                      type="tel" 
              labelText="" 
              placeholder={getPhonePlaceholder(selectedCountry?.code)}
              value={mainPhoneNumberFormatted}
              onChange={(e) => handlePhoneNumberChange(e.target.value, selectedCountry?.code, setMainPhoneNumberRaw, setMainPhoneNumberFormatted, setMainPhoneNumberError)}
              onBlur={() => validatePhoneNumber(mainPhoneNumberRaw, selectedCountry?.code, "Hotel Phone", setMainPhoneNumberError)}
                      invalid={!!mainPhoneNumberError} 
                      invalidText={mainPhoneNumberError} 
                      disabled={isFormDisabled} 
                      className="form-input"
            />
          </div>
        </div>

                <div className="form-row two-columns">
                  <div className="form-field">
                    <FormLabel className="field-label" htmlFor="website">
                      Website
                    </FormLabel>
                    <TextInput 
                      id="website" 
                      type="url" 
                      labelText="" 
                      placeholder="e.g., https://www.example.com" 
                      value={website} 
                      onChange={(e) => setWebsite(e.target.value)} 
                      disabled={isFormDisabled} 
                      className="form-input"
                    />
        </div>
                  <div className="form-field">
                    <FormLabel className="field-label" htmlFor="disclaimer">
                      Disclaimer
                    </FormLabel>
                    <TextInput 
                      id="disclaimer" 
                      labelText="" 
                      placeholder="Short disclaimer text" 
                      value={disclaimer} 
                      onChange={(e) => setDisclaimer(e.target.value)} 
                      disabled={isFormDisabled} 
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
                <div className="form-row three-columns">
                  <div className="form-field">
                    <FormLabel className="field-label" htmlFor="contact-first-name">
                      First Name <span className="required-mark">*</span>
                    </FormLabel>
                    <TextInput 
                      id="contact-first-name" 
                      labelText="" 
                      placeholder="Contact's first name" 
                      value={contactFirstName} 
                      onChange={(e) => setContactFirstName(e.target.value)} 
                      disabled={isFormDisabled} 
                      className="form-input"
                      required 
                    />
        </div>
                  <div className="form-field">
                    <FormLabel className="field-label" htmlFor="contact-last-name">
                      Last Name <span className="required-mark">*</span>
                    </FormLabel>
                    <TextInput 
                      id="contact-last-name" 
                      labelText="" 
                      placeholder="Contact's last name" 
                      value={contactLastName} 
                      onChange={(e) => setContactLastName(e.target.value)} 
                      disabled={isFormDisabled} 
                      className="form-input"
                      required 
                    />
        </div>
                  <div className="form-field">
                    <FormLabel className="field-label" htmlFor="contact-title">
                      Title
                    </FormLabel>
            <TextInput
                      id="contact-title" 
                      labelText="" 
                      placeholder="e.g., General Manager" 
                      value={contactTitle} 
                      onChange={(e) => setContactTitle(e.target.value)} 
                      disabled={isFormDisabled} 
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-row two-columns">
                  <div className="form-field">
                    <FormLabel className="field-label" htmlFor="contact-mobile-phone">
                      Phone Number
                    </FormLabel>
                    <TextInput
                      id="contact-mobile-phone" 
                      type="tel" 
                      labelText=""
              placeholder={getPhonePlaceholder(selectedCountry?.code)}
              value={contactMobilePhoneFormatted}
              onChange={(e) => handlePhoneNumberChange(e.target.value, selectedCountry?.code, setContactMobilePhoneRaw, setContactMobilePhoneFormatted, setContactMobilePhoneError)}
              onBlur={() => validatePhoneNumber(contactMobilePhoneRaw, selectedCountry?.code, "Contact Phone", setContactMobilePhoneError)}
                      invalid={!!contactMobilePhoneError} 
                      invalidText={contactMobilePhoneError} 
                      disabled={isFormDisabled} 
                      className="form-input"
            />
          </div>
                  <div className="form-field">
                    <FormLabel className="field-label" htmlFor="contact-email">
                      Email <span className="required-mark">*</span>
                    </FormLabel>
                    <TextInput 
                      id="contact-email" 
                      type="email" 
                      labelText="" 
                      placeholder="e.g., contact@example.com" 
                      value={contactEmail} 
                      onChange={(e) => setContactEmail(e.target.value)} 
                      disabled={isFormDisabled} 
                      className="form-input"
                      required 
                    />
        </div>
                </div>
              </div>
        </div>
        
            {/* Form Actions */}
            <div className="form-actions">
              <div>
          {userRoleInfo && userRoleInfo.canDelete && (
                  <Button 
                    kind="danger--tertiary" 
                    type="button" 
                    onClick={handleDeleteAttempt} 
                    disabled={isSubmitting}
                    className="delete-button"
                  >
                    Delete Hotel
                  </Button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Button 
                  kind="secondary" 
                  type="button" 
                  onClick={handleCancelAttempt} 
                  disabled={isSubmitting}
                  className="cancel-button"
                >
                  Cancel
                </Button>
          {userRoleInfo && userRoleInfo.canEdit ? (
                  <Button 
                    type="submit" 
                    kind="primary" 
                    disabled={isSubmitting || loadingChains || loadingBrands || initialDataLoading}
                    className="submit-button"
                  >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          ) : (
                  <div className="read-only-message">
              <span>Read-only mode - You don't have permission to edit this hotel</span>
            </div>
          )}
              </div>
        </div>
        </div> {/* Close wrapper div */}
      </Form>

        {/* Modals */}
      <ComposedModal open={openCancelModal} onClose={closeModal} preventCloseOnClickOutside={false} size="sm">
        <ModalHeader title="Discard Changes?" closeModal={closeModal} />
          <ModalBody>
            <p style={{ marginBottom: '1rem' }}>Any unsaved changes will be lost and you will be navigated away.</p>
            <p>Are you sure you want to cancel?</p>
          </ModalBody>
          <ModalFooter>
            <Button kind="secondary" onClick={closeModal}>No</Button>
            <Button kind="primary" onClick={proceedWithCancel}>Yes, Cancel</Button>
          </ModalFooter>
      </ComposedModal>

      <ComposedModal open={openDeleteModal} onClose={closeDeleteModal} danger preventCloseOnClickOutside={false} size="sm">
        <ModalHeader title="Confirm Deletion" label="This action cannot be undone." closeModal={closeDeleteModal} />
        <ModalBody>
          <p style={{ marginBottom: '1rem' }}>
            Are you sure you want to delete the hotel: <strong>{originalHotelData?.hotelName || `ID ${hotelId}`}</strong>?
          </p>
          <p>This will mark the hotel as inactive and it may not be recoverable.</p>
        </ModalBody>
          <ModalFooter>
            <Button kind="secondary" onClick={closeDeleteModal}>Cancel</Button>
            <Button kind="danger" onClick={proceedWithDelete}>Delete Hotel</Button>
          </ModalFooter>
      </ComposedModal>
      </div>
    </div>
  );
}

export default HotelEditForm;