// src/components/HotelNewForm.jsx
import React, { useState, useEffect } from 'react';
import { TextInput, Select, SelectItem, Button } from '@carbon/react';

const HotelNewForm = () => {
  // --- State variables ---
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

  // --- State for dynamic dropdown options ---
  const [chains, setChains] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loadingChains, setLoadingChains] = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [errorChains, setErrorChains] = useState(null);
  const [errorBrands, setErrorBrands] = useState(null);

  // --- Fetch Chains on Mount (reused from HotelForm) ---
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

  // --- Fetch Brands when a Chain is Selected (reused from HotelForm) ---
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
      // Use the local state 'chain'
      fetchBrands(chain);
    } else {
      setBrands([]); // Clear brands if no chain is selected
    }
  }, [chain]); // Listen to the local 'chain' state

  // --- Handle Change functions ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    // ... update corresponding state
    if (name === 'chain') {
      setChain(value); // Update the local 'chain' state
      setBrand(''); // Reset brand when chain changes
    } else if (name === 'brand') {
      setBrand(value); // Update the local 'brand' state
    } else if (name === 'name') {
      setName(value);
    } else if (name === 'streetAddress') {
      setStreetAddress(value);
    } else if (name === 'country') {
      setCountry(value);
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

  const handleDropdownChange = (field, { selectedItem }) => {
    const value = selectedItem ? selectedItem.id : '';
    if (field === 'chain') {
      setChain(value);
      setBrand(''); // Reset brand when chain changes via dropdown
    } else if (field === 'brand') {
      setBrand(value);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // --- Your form submission logic ---
    const newHotelData = {
      chainId: chain, // Use the local 'chain' state for submission
      brandId: brand, // Use the local 'brand' state for submission
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
      // ... other relevant data
    };
    console.log('New Hotel Data:', newHotelData);
    // ... your API call
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

      <section>
        <h3>Chain & Brand</h3>
        <Select
          id="chain"
          labelText={
            loadingChains
              ? 'Loading chains...'
              : errorChains
              ? 'Error loading chains'
              : 'Chain'
          }
          value={chain}
          onChange={(selection) => handleDropdownChange('chain', selection)}
          items={chains}
          itemToString={(item) => (item ? item.text : '')}
          disabled={loadingChains || errorChains}
        >
          <SelectItem value="" text="" />
          {/* Chains will be dynamically loaded here */}
        </Select>
        <Select
          id="brand"
          labelText={
            loadingBrands
              ? 'Loading brands...'
              : errorBrands
              ? 'Error loading brands'
              : 'Brand'
          }
          value={brand}
          onChange={(selection) => handleDropdownChange('brand', selection)}
          items={brands}
          itemToString={(item) => (item ? item.text : '')}
          disabled={loadingBrands || errorBrands || !chain}
        >
          <SelectItem value="" text="" />
          {/* Brands will be dynamically loaded here */}
        </Select>
      </section>

      <section>
        <h3>Property Info</h3>
        <TextInput
          id="name"
          labelText="Name"
          value={name}
          onChange={handleChange}
        />
        <TextInput
          id="street-address"
          labelText="Street Address"
          value={streetAddress}
          onChange={handleChange}
        />
        <Select
          id="country"
          labelText="Country"
          value={country}
          onChange={handleChange}
        >
          <SelectItem value="" text="" />
          {/* Add your country options here */}
          <SelectItem value="country1" text="Country 1" />
          <SelectItem value="country2" text="Country 2" />
        </Select>
        <TextInput
          id="city"
          labelText="City"
          value={city}
          onChange={handleChange}
        />
        <TextInput
          id="zip-code"
          labelText="Zip Code / Postal Code"
          value={zipCode}
          onChange={handleChange}
        />
        <TextInput
          id="phone-number"
          labelText="Phone Number"
          type="tel"
          value={phoneNumber}
          onChange={handleChange}
        />
        <TextInput
          id="fax-number"
          labelText="Fax Number"
          type="tel"
          value={faxNumber}
          onChange={handleChange}
        />
        <TextInput
          id="website"
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
          labelText="Name"
          value={contactName}
          onChange={handleChange}
        />
        <TextInput
          id="contact-title"
          labelText="Title"
          value={contactTitle}
          onChange={handleChange}
        />
        <TextInput
          id="contact-phone-number"
          labelText="Phone Number"
          type="tel"
          value={contactPhoneNumber}
          onChange={handleChange}
        />
        <TextInput
          id="contact-email"
          labelText="Email"
          type="email"
          value={contactEmail}
          onChange={handleChange}
        />
      </section>

      <Button kind="secondary">Cancel</Button>
      <Button kind="primary" type="submit" onClick={handleSubmit}>
        Save
      </Button>

      {/* Error messages for loading chains and brands */}
      {errorChains && (
        <p style={{ color: 'red' }}>Error loading chains: {errorChains}</p>
      )}
      {errorBrands && (
        <p style={{ color: 'red' }}>Error loading brands: {errorBrands}</p>
      )}
    </div>
  );
};

export default HotelNewForm;
