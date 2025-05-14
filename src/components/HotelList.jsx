// src/components/HotelList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Loading,
  InlineNotification,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Checkbox,
  Grid,
  Row,
  Column,
  Stack,
} from '@carbon/react';
import { AddFilled } from '@carbon/icons-react'; // Import Add icon

// Styles (using inline styles where needed, consider CSS modules/styled-components)
const containerStyle = {
  marginTop: '1rem',
  width: '100%', // Ensure it takes full width of its container
  padding: '20px',
  border: '2px solid blue',
  backgroundColor: '#f9f9f9', // Background color to match the image
};

const actionButtonStyle = {
  marginRight: '0.5rem',
};

function HotelList() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHotels, setSelectedHotels] = useState([]);

  useEffect(() => {
    const fetchHotels = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('http://localhost:8090/api/hotels/hotelList');
        if (!response.ok) {
          throw new Error(
            `HTTP Error ${response.status}: ${
              response.statusText || 'Could not fetch list'
            }`
          );
        }
        const data = await response.json();
        // Assuming your API returns the necessary fields
        setHotels(data || []);
      } catch (err) {
        setError(err.message || 'Could not load hotel list.');
        console.error('Error fetching hotels:', err);
        setHotels([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, []);

  const handleCheckboxChange = (id) => {
    const isSelected = selectedHotels.includes(id);
    if (isSelected) {
      setSelectedHotels(
        selectedHotels.filter((selectedId) => selectedId !== id)
      );
    } else {
      setSelectedHotels([...selectedHotels, id]);
    }
  };

  return (
    <div style={containerStyle}>
      {/* Header Section */}
      <h2 style={{ textAlign: 'center', color: '#3751ff' }}>
        SelectVista AI Properties
      </h2>
      <p style={{ fontSize: '0.875rem', color: '#555', marginBottom: '20px' }}>
        Below you will find the list of properties in the SelectVista AI
        platform. To create a new property select "Create New Property". To view
        or edit the details of a property, select the corresponding row and
        click on "View Details".
      </p>

      {/* Buttons Section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        {/* Left Side (Empty for now) */}
        <div></div>

        {/* Right Side (Buttons) */}
        <div>
          <Link to="/hotel/new" style={{ textDecoration: 'none' }}>
            <Button kind="primary" renderIcon={AddFilled}>
              Create New Property
            </Button>
          </Link>
        </div>
      </div>

      {/* Table Section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        {/* Left Side (Table Title) */}
        <div>
          <h3>List of Hotels</h3>
        </div>

        {/* Right Side (Action Buttons) */}
        <div>
          <Button kind="secondary">View Property Amenities</Button>
          <Button kind="secondary" style={{ marginLeft: '10px' }}>
            View Property Details
          </Button>
        </div>
      </div>

      {/* Table */}
      {loading && (
        <Loading description="Loading hotels..." withOverlay={false} />
      )}
      {!loading && error && (
        <InlineNotification
          kind="error"
          title="Error Loading List"
          subtitle={error}
          onClose={() => setError(null)}
          lowContrast
          style={{ marginBottom: '1rem' }}
        />
      )}
      {!loading && !error && (
        <div style={{ width: '100%' }}>
          {hotels.length === 0 ? (
            <p>No hotels registered yet.</p>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader style={{ width: '50px' }}>Select</TableHeader>
                  <TableHeader style={{ width: '50px' }}>
                    Hotel Code
                  </TableHeader>
                  <TableHeader style={{ width: '50px' }}>Chain</TableHeader>
                  <TableHeader style={{ width: '50px' }}>Brand</TableHeader>
                  <TableHeader style={{ width: '50px' }}>
                    Hotel Name
                  </TableHeader>
                  <TableHeader style={{ width: '50px' }}>
                    Street Address
                  </TableHeader>
                  <TableHeader style={{ width: '50px' }}>City</TableHeader>
                  <TableHeader style={{ width: '50px' }}>State</TableHeader>
                  <TableHeader style={{ width: '50px' }}>Country</TableHeader>
                  <TableHeader style={{ width: '50px' }}>
                    Contact Name
                  </TableHeader>
                  <TableHeader style={{ width: '50px' }}>
                    Contact Title
                  </TableHeader>
                  <TableHeader style={{ width: '50px' }}>
                    Website URL
                  </TableHeader>
                  <TableHeader style={{ width: '50px' }}>Status</TableHeader>
                  <TableHeader style={{ width: '50px' }}>Select</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {hotels.map((hotel) => (
                  <TableRow key={hotel.hotelId}>
                    <TableCell>
                      <Checkbox
                        id={`hotel-checkbox-${hotel.hotelId}`}
                        onChange={() => handleCheckboxChange(hotel.hotelId)}
                        checked={selectedHotels.includes(hotel.hotelId)}
                      />
                    </TableCell>
                    <TableCell>{hotel.hotelCode || 'N/A'}</TableCell>
                     <TableCell>{hotel.hotelChain || 'N/A'}</TableCell>
                     <TableCell>{hotel.hotelBrand || 'N/A'}</TableCell>
                    <TableCell>{hotel.hotelName || 'N/A'}</TableCell>
                    <TableCell>{hotel.hotelStreet || 'N/A'}</TableCell>
                    <TableCell>{hotel.hotelCity || 'N/A'}</TableCell>
                    <TableCell>{hotel.hotelState || 'N/A'}</TableCell>
                    <TableCell>{hotel.hotelCountry || 'N/A'}</TableCell>
                    <TableCell>{hotel.contactName || 'N/A'}</TableCell>
                    <TableCell>{hotel.contactTitle || 'N/A'}</TableCell>
                    <TableCell>{hotel.hotelWebsiteUrl || 'N/A'}</TableCell>
                    <TableCell>{hotel.status || 'N/A'}</TableCell>
                    <TableCell>
                      <Link
                        to={`/hotel/${hotel.hotelId}`}
                        state={{ hotelName: hotel.hotelName }}
                        style={{ textDecoration: 'none' }}
                      >
                        <Button
                          size="sm"
                          kind="tertiary"
                          style={actionButtonStyle}
                        >
                          Select
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}

export default HotelList;
