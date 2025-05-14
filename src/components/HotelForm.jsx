// src/components/HotelForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form,
  TextInput,
  Dropdown,
  TextArea,
  NumberInput,
  Button,
  Grid,
  Column,
  InlineNotification,
  Loading,
} from '@carbon/react';

// Estado inicial
const initialHotelState = {
  hotelChain: '',
  hotelBrand: '',
  hotelName: '',
  localPhone: '',
  cellPhone: '',
  pmsVendor: '',
  pmsHotelId: '',
  pmsToken: '',
  crsVendor: '',
  crsHotelId: '',
  crsToken: '',
  disclaimer: '',
  totalFloors: 1,
  totalRooms: 1,
};

function HotelForm() {
  const { hotelId } = useParams();
  const isEditMode = !!hotelId;
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialHotelState);
  const [errors, setErrors] = useState({});
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(isEditMode);
  const [initialLoadError, setInitialLoadError] = useState(null);
  // State for dynamic dropdown options
  const [chains, setChains] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loadingChains, setLoadingChains] = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [errorChains, setErrorChains] = useState(null);
  const [errorBrands, setErrorBrands] = useState(null);

  // State para PMS y CRS Vendors
  const [pmsVendors, setPmsVendors] = useState([]);
  const [crsVendors, setCrsVendors] = useState([]);
  const [loadingPmsVendors, setLoadingPmsVendors] = useState(true);
  const [loadingCrsVendors, setLoadingCrsVendors] = useState(true);
  const [errorPmsVendors, setErrorPmsVendors] = useState(null);
  const [errorCrsVendors, setErrorCrsVendors] = useState(null);

  // --- Fetch Chains on Mount ---
  useEffect(() => {
    const fetchChains = async () => {
      setLoadingChains(true);
      setErrorChains(null);
      try {
        const response = await fetch('http://localhost:8090/api/chain');
        if (!response.ok) {
          throw new Error(
            `HTTP Error ${response.status}: Could not load hotel chains`
          );
        }
        const data = await response.json();
        setChains(
          data.map((chain) => ({ id: chain.chainId, text: chain.chainName }))
        );
      } catch (error) {
        console.error('Error fetching hotel chains:', error);
        setErrorChains(error.message || 'Failed to load hotel chains.');
      } finally {
        setLoadingChains(false);
      }
    };
    fetchChains();
  }, []);

  // --- Fetch Brands when a Chain is Selected ---
  useEffect(() => {
    const fetchBrands = async (chainId) => {
      if (!chainId) {
        setBrands([]);
        return;
      }
      setLoadingBrands(true);
      setErrorBrands(null);
      try {
        const response = await fetch(
          `http://localhost:8090/api/chain/${chainId}/brands`
        );
        if (!response.ok) {
          throw new Error(
            `HTTP Error ${response.status}: Could not load brands for chain ID ${chainId}`
          );
        }
        const data = await response.json();
        setBrands(
          data.map((brand) => ({ id: brand.brandId, text: brand.brandName }))
        );
      } catch (error) {
        console.error(`Error fetching brands for chain ID ${chainId}:`, error);
        setErrorBrands(error.message || 'Failed to load hotel brands.');
        setBrands([]);
      } finally {
        setLoadingBrands(false);
      }
    };
    if (formData.hotelChain) {
      fetchBrands(formData.hotelChain);
    } else {
      setBrands([]); // Clear brands if no chain is selected
    }
  }, [formData.hotelChain]);

  // --- Fetch PMS Vendors ---
  useEffect(() => {
    const fetchPmsVendors = async () => {
      setLoadingPmsVendors(true);
      setErrorPmsVendors(null);
      try {
        const response = await fetch(
          'http://localhost:8090/api/provider/type?type=PMS'
        );
        if (!response.ok) {
          throw new Error(
            `HTTP Error ${response.status}: Could not load PMS vendors`
          );
        }
        const data = await response.json();
        setPmsVendors(
          data.map((vendor) => ({
            id: vendor.providerId,
            text: vendor.providerName,
          }))
        ); //  Mapeo ajustado
      } catch (error) {
        console.error('Error fetching PMS vendors:', error);
        setErrorPmsVendors(error.message || 'Failed to load PMS vendors.');
      } finally {
        setLoadingPmsVendors(false);
      }
    };
    fetchPmsVendors();
  }, []);

  // --- Fetch CRS Vendors ---
  useEffect(() => {
    const fetchCrsVendors = async () => {
      setLoadingCrsVendors(true);
      setErrorCrsVendors(null);
      try {
        const response = await fetch(
          'http://localhost:8090/api/provider/type?type=CRS'
        );
        if (!response.ok) {
          throw new Error(
            `HTTP Error ${response.status}: Could not load CRS vendors`
          );
        }
        const data = await response.json();
        setCrsVendors(
          data.map((vendor) => ({
            id: vendor.providerId,
            text: vendor.providerName,
          }))
        ); //  Mapeo ajustado
      } catch (error) {
        console.error('Error fetching CRS vendors:', error);
        setErrorCrsVendors(error.message || 'Failed to load CRS vendors.');
      } finally {
        setLoadingCrsVendors(false);
      }
    };
    fetchCrsVendors();
  }, []);

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleDropdownChange = (field, { selectedItem }) => {
    const value = selectedItem ? selectedItem.id : '';
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    // Clear brands if chain changes
    if (field === 'hotelChain') {
      setFormData((prev) => ({ ...prev, hotelBrand: '' }));
    }
  };

  const handleNumberInputChange = (fieldName, value) => {
    const numericValue =
      value === null || value === '' || typeof value === 'undefined'
        ? ''
        : Number(value);
    if (isNaN(numericValue) && value !== '') {
      setFormData((prev) => ({ ...prev, [fieldName]: value }));
    } else {
      setFormData((prev) => ({ ...prev, [fieldName]: numericValue }));
    }
    if (errors[fieldName])
      setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
  };

  // --- useEffect para Carga de Datos para Edición ---
  useEffect(() => {
    if (isEditMode && hotelId) {
      setIsLoadingData(true);
      setInitialLoadError(null);
      setErrors({});
      setSubmitStatus(null);
      const fetchHotelData = async () => {
        try {
          const apiUrl = `http://localhost:8090/api/hotels/${hotelId}`;
          const response = await fetch(apiUrl);
          if (!response.ok) {
            if (response.status === 404)
              throw new Error(`Hotel with ID ${hotelId} not found.`);
            throw new Error(
              `Could not fetch hotel data (Status: ${response.status})`
            );
          }
          const fetchedData = await response.json();
          setFormData({
            hotelChain: fetchedData.chainId?.toString() || '',
            hotelBrand: fetchedData.brandId?.toString() || '',
            hotelName: fetchedData.hotelName || '',
            localPhone: fetchedData.localPhone || '',
            cellPhone: fetchedData.celularPhone || '',
            pmsVendor: fetchedData.pmsVendor || '',
            pmsHotelId: fetchedData.pmsHotelId?.toString() || '',
            pmsToken: fetchedData.pmsToken || '',
            crsVendor: fetchedData.crsVendor || '',
            crsHotelId: fetchedData.crsHotelId?.toString() || '',
            crsToken: fetchedData.crsToken || '',
            disclaimer: fetchedData.disclaimer || '',
            totalFloors: fetchedData.totalFloors ?? 1,
            totalRooms: fetchedData.totalRooms ?? 1,
          });
        } catch (error) {
          console.error('Error fetching hotel data for edit:', error);
          setInitialLoadError(error.message || 'Failed to load hotel data.');
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchHotelData();
    } else {
      setFormData(initialHotelState);
      setIsLoadingData(false);
      setInitialLoadError(null);
      setErrors({});
      setSubmitStatus(null);
    }
  }, [hotelId, isEditMode]);

  // --- Validación (CON LÓGICA) ---
  const validateForm = () => {
    const newErrors = {};
    const {
      hotelChain,
      hotelBrand,
      hotelName,
      localPhone,
      cellPhone,
      pmsVendor,
      pmsHotelId,
      pmsToken,
      disclaimer,
      totalFloors,
      totalRooms,
      crsHotelId,
    } = formData;
    if (!hotelChain) newErrors.hotelChain = 'Hotel chain is required.';
    if (!hotelBrand) newErrors.hotelBrand = 'Hotel brand is required.';
    if (!hotelName.trim()) newErrors.hotelName = 'Hotel name is required.';
    if (!localPhone.trim()) newErrors.localPhone = 'Local phone is required.';
    if (!cellPhone.trim()) newErrors.cellPhone = 'Cell phone is required.';
    if (!pmsVendor) newErrors.pmsVendor = 'PMS provider is required.';
    if (
      !pmsHotelId?.toString().trim() ||
      !/^\d+$/.test(pmsHotelId.toString())
    ) {
      newErrors.pmsHotelId = 'PMS Hotel ID is required and must be numeric.';
    }
    if (!pmsToken.trim()) newErrors.pmsToken = 'PMS token is required.';
    if (!disclaimer.trim()) newErrors.disclaimer = 'Disclaimer is required.';
    if (
      totalFloors === '' ||
      typeof totalFloors !== 'number' ||
      totalFloors < 1
    )
      newErrors.totalFloors = 'Total floors must be at least 1.';
    if (totalRooms === '' || typeof totalRooms !== 'number' || totalRooms < 1)
      newErrors.totalRooms = 'Total rooms must be at least 1.';
    const localPhonePattern = /^[\d\s-()]*$/;
    if (localPhone && !localPhonePattern.test(localPhone)) {
      newErrors.localPhone = 'Invalid local phone format.';
    }
    const cellPhonePattern = /^\+\d[\d\s]*$/;
    if (cellPhone && !cellPhonePattern.test(cellPhone)) {
      newErrors.cellPhone = 'Invalid format. Ex: +1 555 1234567';
    }
    if (crsHotelId?.toString().trim() && !/^\d+$/.test(crsHotelId.toString())) {
      newErrors.crsHotelId = 'CRS Hotel ID must be numeric if entered.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Envío (CON LÓGICA) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus(null);
    if (!validateForm()) {
      console.log('Validation Errors:', errors);
      return;
    }
    setLoadingSubmit(true);
    const payload = {
      hotelChain: formData.hotelChain,
      hotelBrand: formData.hotelBrand,
      hotelName: formData.hotelName,
      localPhone: formData.localPhone,
      celularPhone: formData.cellPhone,
      pmsVendor: formData.pmsVendor,
      pmsHotelId: formData.pmsHotelId
        ? parseInt(formData.pmsHotelId, 10)
        : null,
      pmsToken: formData.pmsToken,
      ...(formData.crsVendor && {
        crsVendor: formData.crsVendor,
        crsHotelId: formData.crsHotelId
          ? parseInt(formData.crsHotelId, 10)
          : null,
        crsToken: formData.crsToken,
      }),
      disclaimer: formData.disclaimer,
      totalFloors: formData.totalFloors,
      totalRooms: formData.totalRooms,
    };
    const apiUrl = isEditMode
      ? `http://localhost:8090/api/hotels/${hotelId}`
      : 'http://localhost:8090/api/hotels/';
    const method = isEditMode ? 'PUT' : 'POST';
    console.log(
      `Sending ${method} Payload to ${apiUrl}:`,
      JSON.stringify(payload, null, 2)
    );
    try {
      const response = await fetch(apiUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
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
      console.log(`Hotel ${isEditMode ? 'updated' : 'created'}:`, result);
      setSubmitStatus('success');
      if (method === 'POST' && result?.hotelId) {
        setTimeout(() => {
          navigate(`/hotel/${result.hotelId}`);
        }, 3000);
      } else if (method === 'PUT') {
        setTimeout(() => {
          setFormData(initialHotelState);
          setErrors({});
          setSubmitStatus(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Error saving hotel:', error);
      setSubmitStatus('error');
      setErrors((prev) => ({
        ...prev,
        api: error.message || 'An unexpected error occurred.',
      }));
    } finally {
      setLoadingSubmit(false);
    }
  };

  // --- Pre-cálculo para Dropdowns ---
  const currentChainItem =
    chains.find((item) => item.id === formData.hotelChain) || null;
  const currentBrandItem =
    brands.find((item) => item.id === formData.hotelBrand) || null;
  const currentPmsVendorItem =
    pmsVendors.find((item) => item.id === formData.pmsVendor) || null;
  const currentCrsVendorItem =
    crsVendors.find((item) => item.id === formData.crsVendor) || null;

  return (
    <div>
      <h2 style={{ marginBottom: '2rem', textAlign: 'left' }}>
        {isEditMode ? `Edit Hotel (ID: ${hotelId})` : 'Register New Hotel'}
      </h2>
      {initialLoadError && (
        <InlineNotification
          kind="error"
          title="Error Loading Data"
          subtitle={initialLoadError}
          onClose={() => setInitialLoadError(null)}
          lowContrast
          style={{ marginBottom: '1rem' }}
        />
      )}
      {isLoadingData && (
        <Loading description="Loading hotel data..." withOverlay={false} />
      )}
      {!initialLoadError && (
        <Form onSubmit={handleSubmit}>
          <fieldset
            disabled={
              isLoadingData ||
              loadingSubmit ||
              loadingChains ||
              loadingBrands ||
              loadingPmsVendors ||
              loadingCrsVendors
            }
            style={{ border: 'none', padding: 0, margin: 0 }}
          >
            <Grid>
              {/* --- Sección General --- */}
              <Column lg={16} md={8} sm={4} style={{ marginBottom: '1rem' }}>
                <h4>General Hotel Information</h4>
              </Column>
              <Column lg={5} md={8} sm={4}>
                <Dropdown
                  id="hotelChain"
                  name="hotelChain"
                  titleText="Hotel Chain"
                  label={
                    loadingChains
                      ? 'Loading chains...'
                      : errorChains
                      ? 'Error loading chains'
                      : 'Select...'
                  }
                  items={chains}
                  itemToString={(item) => (item ? item.text : '')}
                  onChange={(selection) =>
                    handleDropdownChange('hotelChain', selection)
                  }
                  selectedItem={currentChainItem}
                  invalid={!!errors.hotelChain}
                  invalidText={errors.hotelChain}
                  disabled={loadingChains || errorChains}
                  light
                />
              </Column>
              <Column lg={5} md={8} sm={4}>
                <Dropdown
                  id="hotelBrand"
                  name="hotelBrand"
                  titleText="Hotel Brand"
                  label={
                    loadingBrands
                      ? 'Loading brands...'
                      : errorBrands
                      ? 'Error loading brands'
                      : currentChainItem
                      ? 'Select...'
                      : 'Select a chain first'
                  }
                  items={brands}
                  itemToString={(item) => (item ? item.text : '')}
                  onChange={(selection) =>
                    handleDropdownChange('hotelBrand', selection)
                  }
                  selectedItem={currentBrandItem}
                  invalid={!!errors.hotelBrand}
                  invalidText={errors.hotelBrand}
                  disabled={
                    loadingBrands || errorBrands || !formData.hotelChain
                  }
                  light
                />
              </Column>
              <Column lg={6} md={8} sm={4}>
                <TextInput
                  id="hotelName"
                  name="hotelName"
                  labelText="Hotel Name"
                  value={formData.hotelName}
                  onChange={handleChange}
                  invalid={!!errors.hotelName}
                  invalidText={errors.hotelName}
                  light
                />
              </Column>
              {/* --- Sección Contacto --- */}
              <Column
                lg={16}
                md={8}
                sm={4}
                style={{ marginTop: '2rem', marginBottom: '1rem' }}
              >
                <h4>Contact Information</h4>
              </Column>
              <Column lg={8} md={8} sm={4}>
                <TextInput
                  id="localPhone"
                  name="localPhone"
                  labelText="Local Phone"
                  value={formData.localPhone}
                  onChange={handleChange}
                  invalid={!!errors.localPhone}
                  invalidText={errors.localPhone}
                  placeholder="(xxx) xxx-xxxx"
                  light
                />
              </Column>
              <Column lg={8} md={8} sm={4}>
                <TextInput
                  id="cellPhone"
                  name="cellPhone"
                  labelText="Cell Phone"
                  value={formData.cellPhone}
                  onChange={handleChange}
                  invalid={!!errors.cellPhone}
                  invalidText={errors.cellPhone}
                  placeholder="(xxx) xxx-xxxx"
                  helperText="Include country code"
                  light
                />
              </Column>
              {/* --- Sección PMS --- */}
              <Column
                lg={16}
                md={8}
                sm={4}
                style={{ marginTop: '2rem', marginBottom: '1rem' }}
              >
                <h4>Property Management System (PMS) Information</h4>
              </Column>
              <Column lg={5} md={8} sm={4}>
                <Dropdown
                  id="pmsVendor"
                  name="pmsVendor"
                  titleText="PMS Provider"
                  label={
                    loadingPmsVendors
                      ? 'Loading PMS providers...'
                      : errorPmsVendors
                      ? 'Error loading PMS providers'
                      : 'Select...'
                  }
                  items={pmsVendors}
                  itemToString={(item) => (item ? item.text : '')}
                  onChange={(selection) =>
                    handleDropdownChange('pmsVendor', selection)
                  }
                  selectedItem={currentPmsVendorItem}
                  invalid={!!errors.pmsVendor}
                  invalidText={errors.pmsVendor}
                  disabled={loadingPmsVendors || errorPmsVendors}
                  light
                />
              </Column>
              <Column lg={5} md={8} sm={4}>
                <TextInput
                  id="pmsHotelId"
                  name="pmsHotelId"
                  labelText="Hotel ID in PMS"
                  value={formData.pmsHotelId}
                  onChange={handleChange}
                  invalid={!!errors.pmsHotelId}
                  invalidText={errors.pmsHotelId}
                  light
                />
              </Column>
              <Column lg={6} md={8} sm={4}>
                <TextInput
                  id="pmsToken"
                  name="pmsToken"
                  labelText="PMS Token"
                  type="password"
                  value={formData.pmsToken}
                  onChange={handleChange}
                  invalid={!!errors.pmsToken}
                  invalidText={errors.pmsToken}
                  light
                />
              </Column>
              {/* --- Sección CRS --- */}
              <Column
                lg={16}
                md={8}
                sm={4}
                style={{ marginTop: '2rem', marginBottom: '1rem' }}
              >
                <h4>Central Reservation System (CRS) Information</h4>
              </Column>
              <Column lg={5} md={8} sm={4}>
                <Dropdown
                  id="crsVendor"
                  name="crsVendor"
                  titleText="CRS Provider"
                  label={
                    loadingCrsVendors
                      ? 'Loading CRS providers...'
                      : errorCrsVendors
                      ? 'Error loading CRS providers'
                      : 'Select...'
                  }
                  items={crsVendors}
                  itemToString={(item) => (item ? item.text : '')}
                  onChange={(selection) =>
                    handleDropdownChange('crsVendor', selection)
                  }
                  selectedItem={currentCrsVendorItem}
                  invalid={!!errors.crsVendor}
                  invalidText={errors.crsVendor}
                  disabled={loadingCrsVendors || errorCrsVendors}
                  light
                />
              </Column>
              <Column lg={5} md={8} sm={4}>
                <TextInput
                  id="crsHotelId"
                  name="crsHotelId"
                  labelText="Hotel ID in CRS"
                  value={formData.crsHotelId}
                  onChange={handleChange}
                  invalid={!!errors.crsHotelId}
                  invalidText={errors.crsHotelId}
                  light
                />
              </Column>
              <Column lg={6} md={8} sm={4}>
                <TextInput
                  id="crsToken"
                  name="crsToken"
                  labelText="CRS Token"
                  type="password"
                  value={formData.crsToken}
                  onChange={handleChange}
                  invalid={!!errors.crsToken}
                  invalidText={errors.crsToken}
                  light
                />
              </Column>
              {/* --- Sección Adicional --- */}
              <Column
                lg={16}
                md={8}
                sm={4}
                style={{ marginTop: '2rem', marginBottom: '1rem' }}
              >
                <h4>Additional Information</h4>
              </Column>
              <Column lg={8} md={8} sm={4}>
                <NumberInput
                  id="totalFloors"
                  name="totalFloors"
                  label="Total Floors"
                  min={1}
                  step={1}
                  value={formData.totalFloors}
                  onChange={(e, { value }) =>
                    handleNumberInputChange('totalFloors', value)
                  }
                  invalid={!!errors.totalFloors}
                  invalidText={errors.totalFloors}
                  allowEmpty={false}
                  light
                />
              </Column>
              <Column lg={8} md={8} sm={4}>
                <NumberInput
                  id="totalRooms"
                  name="totalRooms"
                  label="Total Rooms"
                  min={1}
                  step={1}
                  value={formData.totalRooms}
                  onChange={(e, { value }) =>
                    handleNumberInputChange('totalRooms', value)
                  }
                  invalid={!!errors.totalRooms}
                  invalidText={errors.totalRooms}
                  allowEmpty={false}
                  light
                />
              </Column>
              {/* --- Sección Disclaimer --- */}
              <Column
                lg={16}
                md={8}
                sm={4}
                style={{ marginTop: '2rem', marginBottom: '1rem' }}
              >
                <h4>Disclaimer</h4>
              </Column>
              <Column lg={16} md={8} sm={4}>
                <TextArea
                  id="disclaimer"
                  name="disclaimer"
                  labelText="Disclaimer"
                  value={formData.disclaimer}
                  onChange={handleChange}
                  invalid={!!errors.disclaimer}
                  invalidText={errors.disclaimer}
                  rows={4}
                  light
                />
              </Column>
              {/* Área de Submit */}
              <Column
                lg={16}
                md={8}
                sm={4}
                style={{
                  marginTop: '2rem',
                  borderTop: '1px solid #888',
                  paddingTop: '1.5rem',
                }}
              >
                {loadingSubmit && (
                  <Loading description="Saving hotel..." withOverlay={false} />
                )}
                {!loadingSubmit && submitStatus === 'success' && (
                  <InlineNotification
                    kind="success"
                    title="Success!"
                    subtitle={
                      isEditMode
                        ? 'Hotel updated successfully.'
                        : 'Hotel created successfully. Redirecting...'
                    }
                    onClose={() => setSubmitStatus(null)}
                    lowContrast
                    style={{ marginBottom: '1rem' }}
                  />
                )}
                {!loadingSubmit && submitStatus === 'error' && (
                  <InlineNotification
                    kind="error"
                    title="Save Error"
                    subtitle={errors.api || 'An unexpected error occurred.'}
                    onClose={() => {
                      setSubmitStatus(null);
                      setErrors((prev) => ({ ...prev, api: undefined }));
                    }}
                    lowContrast
                    style={{ marginBottom: '1rem' }}
                  />
                )}
                {/* Botón de Envío */}
                <Button
                  type="submit"
                  disabled={
                    isLoadingData ||
                    loadingSubmit ||
                    loadingChains ||
                    loadingBrands ||
                    loadingPmsVendors ||
                    loadingCrsVendors ||
                    !formData.hotelChain ||
                    !formData.hotelBrand
                  }
                >
                  {loadingSubmit
                    ? 'Saving...'
                    : isEditMode
                    ? 'Save Changes'
                    : 'Create Hotel'}
                </Button>
              </Column>
            </Grid>
          </fieldset>
        </Form>
      )}
      {errorChains && (
        <InlineNotification
          kind="error"
          title="Error Loading Chains"
          subtitle={errorChains}
          onClose={() => setErrorChains(null)}
          lowContrast
          style={{ marginTop: '1rem' }}
        />
      )}
      {errorBrands && (
        <InlineNotification
          kind="error"
          title="Error Loading Brands"
          subtitle={errorBrands}
          onClose={() => setErrorBrands(null)}
          lowContrast
          style={{ marginTop: '1rem' }}
        />
      )}
      {errorPmsVendors && (
        <InlineNotification
          kind="error"
          title="Error Loading PMS Vendors"
          subtitle={errorPmsVendors}
          onClose={() => setErrorPmsVendors(null)}
          lowContrast
          style={{ marginTop: '1rem' }}
        />
      )}
      {errorCrsVendors && (
        <InlineNotification
          kind="error"
          title="Error Loading CRS Vendors"
          subtitle={errorCrsVendors}
          onClose={() => setErrorCrsVendors(null)}
          lowContrast
          style={{ marginTop: '1rem' }}
        />
      )}
    </div>
  );
}

export default HotelForm;
