// src/components/HotelNewForm.jsx
import React, { useState, useEffect } from 'react';
import { TextInput, Select, SelectItem, Button } from '@carbon/react'; // Asegúrate que SelectItem esté importado

const HotelNewForm = () => {
  // --- State variables (sin cambios) ---
  const [chain, setChain] = useState('');
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [faxNumber, setFaxNumber] = useState('');
  const [website, setWebsite] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactTitle, setContactTitle] = useState('');
  const [contactPhoneNumber, setContactPhoneNumber] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // --- State for dynamic dropdown options (sin cambios) ---
  const [chains, setChains] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loadingChains, setLoadingChains] = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [errorChains, setErrorChains] = useState(null);
  const [errorBrands, setErrorBrands] = useState(null);

  // --- Fetch Chains on Mount (sin cambios) ---
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

  // --- Fetch Brands when a Chain is Selected (sin cambios) ---
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
    if (chain) {
      fetchBrands(chain);
    } else {
      setBrands([]);
    }
  }, [chain]);

  // --- Handle Change functions ---
  const handleChange = (e) => {
    const { name, value } = e.target; // Esto funcionará para TextInput y Select
    if (name === 'chain') {
      setChain(value);
      setBrand(''); // Reset brand when chain changes
    } else if (name === 'brand') {
      setBrand(value);
    } else if (name === 'name') {
      setName(value);
    } else if (name === 'streetAddress') {
      setStreetAddress(value);
    } else if (name === 'country') {
      setCountry(value); // Asumiendo que el Select de country también usa handleChange
    } else if (name === 'city') {
      setCity(value);
    } else if (name === 'zipCode') {
      setZipCode(value);
    } else if (name === 'phoneNumber') {
      setPhoneNumber(value);
    } else if (name === 'faxNumber') {
      setFaxNumber(value);
    } else if (name === 'website') {
      setWebsite(value);
    } else if (name === 'contactName') {
      setContactName(value);
    } else if (name === 'contactTitle') {
      setContactTitle(value);
    } else if (name === 'contactPhoneNumber') {
      setContactPhoneNumber(value);
    } else if (name === 'contactEmail') {
      setContactEmail(value);
    }
  };

  // handleDropdownChange ya no es necesario si handleChange maneja los Select
  // const handleDropdownChange = (field, { selectedItem }) => { ... };

  // --- handleSubmit (sin cambios en su lógica interna) ---
  const handleSubmit = (event) => {
    event.preventDefault();
    const newHotelData = {
      chainId: chain,
      brandId: brand,
      name,
      streetAddress,
      country,
      city,
      zipCode,
      phoneNumber,
      faxNumber,
      website,
      contactName,
      contactTitle,
      contactPhoneNumber,
      contactEmail,
    };
    console.log('New Hotel Data:', newHotelData);
    // ... tu lógica de llamada a la API
  };

  return (
    <div>
      <h2>Hotel Configuration</h2>
      <p>
        "Complete the hotel configuration by entering key property details,
        including the hotel chain, brand, property name, address, and contact
        information. Fields marked with a red asterisk (*) are required. When
        finished, click 'Save' to store the information and return to the main
        menu, or select 'Cancel' to discard changes."
      </p>

      <form onSubmit={handleSubmit}> {/* Envuelve tus secciones en un <form> si aún no lo has hecho */}
        <section>
          <h3>Chain & Brand</h3>
          <Select
            id="chain"
            name="chain" // Importante para que handleChange identifique el campo
            labelText={
              loadingChains
                ? 'Loading chains...'
                : errorChains
                ? 'Error loading chains'
                : 'Chain'
            }
            value={chain}
            onChange={handleChange} // Usar handleChange, que espera un evento
            disabled={loadingChains || !!errorChains} // Es buena práctica usar !! para asegurar booleano
            // Las props 'items' e 'itemToString' se eliminan
          >
            <SelectItem value="" text="Select a chain..." /> {/* Opción por defecto o placeholder */}
            {chains.map((c) => (
              <SelectItem key={c.id} value={c.id} text={c.text} />
            ))}
          </Select>
          <Select
            id="brand"
            name="brand" // Importante para que handleChange identifique el campo
            labelText={
              loadingBrands
                ? 'Loading brands...'
                : errorBrands
                ? 'Error loading brands'
                : 'Brand'
            }
            value={brand}
            onChange={handleChange} // Usar handleChange, que espera un evento
            disabled={loadingBrands || !!errorBrands || !chain}
            // Las props 'items' e 'itemToString' se eliminan
          >
            <SelectItem value="" text="Select a brand..." /> {/* Opción por defecto o placeholder */}
            {brands.map((b) => (
              <SelectItem key={b.id} value={b.id} text={b.text} />
            ))}
          </Select>
        </section>

        <section>
          <h3>Property Info</h3>
          <TextInput
            id="name"
            name="name" // Añadir name para handleChange
            labelText="Name"
            value={name}
            onChange={handleChange}
          />
          <TextInput
            id="street-address"
            name="streetAddress" // Añadir name para handleChange
            labelText="Street Address"
            value={streetAddress}
            onChange={handleChange}
          />
          <Select
            id="country"
            name="country" // Añadir name para handleChange
            labelText="Country"
            value={country}
            onChange={handleChange} // handleChange debería poder manejar esto si obtiene value de e.target.value
          >
            <SelectItem value="" text="Select a country..." />
            {/* Debes poblar estas opciones, ya sea estáticamente o desde una API */}
            <SelectItem value="US" text="United States" />
            <SelectItem value="CA" text="Canada" />
            <SelectItem value="UY" text="Uruguay" />
            {/* ... más países */}
          </Select>
          <TextInput
            id="city"
            name="city" // Añadir name para handleChange
            labelText="City"
            value={city}
            onChange={handleChange}
          />
          <TextInput
            id="zip-code"
            name="zipCode" // Añadir name para handleChange
            labelText="Zip Code / Postal Code"
            value={zipCode}
            onChange={handleChange}
          />
          <TextInput
            id="phone-number"
            name="phoneNumber" // Añadir name para handleChange
            labelText="Phone Number"
            type="tel"
            value={phoneNumber}
            onChange={handleChange}
          />
          <TextInput
            id="fax-number"
            name="faxNumber" // Añadir name para handleChange
            labelText="Fax Number"
            type="tel"
            value={faxNumber}
            onChange={handleChange}
          />
          <TextInput
            id="website"
            name="website" // Añadir name para handleChange
            labelText="Website"
            type="url"
            value={website}
            onChange={handleChange}
          />
        </section>

        <section>
          <h3>Contact Info</h3>
          <TextInput
            id="contact-name"
            name="contactName" // Añadir name para handleChange
            labelText="Name"
            value={contactName}
            onChange={handleChange}
          />
          <TextInput
            id="contact-title"
            name="contactTitle" // Añadir name para handleChange
            labelText="Title"
            value={contactTitle}
            onChange={handleChange}
          />
          <TextInput
            id="contact-phone-number"
            name="contactPhoneNumber" // Añadir name para handleChange
            labelText="Phone Number"
            type="tel"
            value={contactPhoneNumber}
            onChange={handleChange}
          />
          <TextInput
            id="contact-email"
            name="contactEmail" // Añadir name para handleChange
            labelText="Email"
            type="email"
            value={contactEmail}
            onChange={handleChange}
          />
        </section>

        <div style={{marginTop: '1rem'}}> {/* Contenedor para botones */}
            <Button kind="secondary" type="button" style={{marginRight: '0.5rem'}}> {/* type="button" si no submite el form */}
                Cancel
            </Button>
            <Button kind="primary" type="submit"> {/* onClick={handleSubmit} no es necesario si el form lo maneja */}
                Save
            </Button>
        </div>

      </form> {/* Cierre del tag form */}

      {/* Error messages for loading chains and brands */}
      {errorChains && (
        <p style={{ color: 'red', marginTop: '1rem' }}>Error loading chains: {errorChains}</p>
      )}
      {errorBrands && (
        <p style={{ color: 'red', marginTop: '1rem' }}>Error loading brands: {errorBrands}</p>
      )}
    </div>
  );
};

export default HotelNewForm;