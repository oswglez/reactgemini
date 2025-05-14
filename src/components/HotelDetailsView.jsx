// src/components/HotelDetailsView.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Loading,
  InlineNotification,
  Grid,
  Column,
  // StructuredList... // Optional
} from '@carbon/react';

// Styles for labels (medium-dark gray)
const labelStyle = {
  fontWeight: 'bold',
  color: '#525252', // $gray-70
  marginRight: '0.5rem',
};

// Styles for values (dark gray)
const valueStyle = {
  color: '#262626', // $gray-90
};

// Helper component to display a Key/Value pair
// Translating the label prop received is handled when calling DetailItem
function DetailItem({ label, value }) {
  // Display a dash if value is null, undefined, or empty string
  const displayValue =
    value === null || typeof value === 'undefined' || value === ''
      ? '-'
      : String(value);
  return (
    <div style={{ marginBottom: '1rem' }}>
      {' '}
      {/* Space between items */}
      <span style={labelStyle}>{label}:</span>
      <span style={valueStyle}>{displayValue}</span>
    </div>
  );
}

function HotelDetailsView() {
  const { hotelId } = useParams(); // Get ID from URL
  const [hotelData, setHotelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Function to load details for the specific hotel
    const fetchHotelDetails = async () => {
      if (!hotelId) {
        setError('Hotel ID was not provided.'); // Translated
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // --- REAL API CALL ---
        const response = await fetch(
          `http://localhost:8090/api/hotels/${hotelId}`
        ); // Endpoint for one hotel

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Hotel with ID ${hotelId} not found.`); // Translated
          }
          // Translated error message
          throw new Error(
            `HTTP Error ${response.status}: ${
              response.statusText || 'Could not fetch details'
            }`
          );
        }
        const data = await response.json();
        setHotelData(data); // Store hotel data in state
      } catch (err) {
        // Translated error message
        setError(err.message || 'Could not load hotel details.');
        console.error(`Error fetching hotel ${hotelId}:`, err);
        setHotelData(null); // Clear data on error
      } finally {
        setLoading(false);
      }
    };

    fetchHotelDetails();
  }, [hotelId]); // Reload if hotelId changes

  // Conditional Rendering
  if (loading) {
    // Translated description
    return (
      <Loading
        description={`Loading details for hotel ID ${hotelId}...`}
        withOverlay={false}
      />
    );
  }

  if (error) {
    return (
      <InlineNotification
        kind="error"
        title="Error Loading Details" // Translated
        subtitle={error}
        onClose={() => setError(null)}
        lowContrast
      />
    );
  }

  if (!hotelData) {
    // Translated message
    return (
      <p style={{ color: '#161616' }}>No data found for hotel ID {hotelId}.</p>
    );
  }

  // Render hotel details
  return (
    <div>
      {/* Translated Title */}
      <h3 style={{ marginBottom: '1.5rem', color: '#161616' }}>
        Hotel Details
      </h3>
      <Grid>
        {/* Column 1 */}
        <Column lg={8} md={4} sm={4}>
          {/* Translated Section Title */}
          <h4
            style={{
              borderBottom: '1px solid #e0e0e0',
              paddingBottom: '0.5rem',
              marginBottom: '1rem',
              color: '#161616',
            }}
          >
            General Information
          </h4>
          {/* Translated Labels for DetailItem */}
          <DetailItem label="Name" value={hotelData.hotelName} />
          <DetailItem label="ID" value={hotelData.hotelId} />
          <DetailItem label="Chain" value={hotelData.hotelChain} />
          <DetailItem label="Brand" value={hotelData.hotelBrand} />
          <DetailItem label="Local Phone" value={hotelData.localPhone} />
          <DetailItem label="Cell Phone" value={hotelData.celularPhone} />{' '}
          {/* Assuming data still has celularPhone */}
          <DetailItem label="Total Floors" value={hotelData.totalFloors} />
          <DetailItem label="Total Rooms" value={hotelData.totalRooms} />
        </Column>

        {/* Column 2 */}
        <Column lg={8} md={4} sm={4}>
          {/* Translated Section Title */}
          <h4
            style={{
              borderBottom: '1px solid #e0e0e0',
              paddingBottom: '0.5rem',
              marginBottom: '1rem',
              color: '#161616',
            }}
          >
            Integrations
          </h4>
          <p style={{ color: labelStyle.color, marginBottom: '0.5rem' }}>
            PMS:
          </p>
          {/* Translated Labels */}
          <DetailItem label="PMS Provider" value={hotelData.pmsVendor} />
          <DetailItem label="Hotel ID (PMS)" value={hotelData.pmsHotelId} />
          {/* We don't show pmsToken for security */}

          <p
            style={{
              color: labelStyle.color,
              marginTop: '1.5rem',
              marginBottom: '0.5rem',
            }}
          >
            CRS:
          </p>
          {/* Translated Labels */}
          <DetailItem label="CRS Provider" value={hotelData.crsVendor} />
          <DetailItem label="Hotel ID (CRS)" value={hotelData.crsHotelId} />
          {/* We don't show crsToken for security */}
        </Column>

        {/* Disclaimer Row */}
        <Column lg={16} md={8} sm={4} style={{ marginTop: '1rem' }}>
          {/* Translated Section Title */}
          <h4
            style={{
              borderBottom: '1px solid #e0e0e0',
              paddingBottom: '0.5rem',
              marginBottom: '1rem',
              color: '#161616',
            }}
          >
            Disclaimer
          </h4>
          <p style={valueStyle}>{hotelData.disclaimer || '-'}</p>
        </Column>
      </Grid>

      {/* Commented out StructuredList alternative ... */}
    </div>
  );
}

export default HotelDetailsView;
