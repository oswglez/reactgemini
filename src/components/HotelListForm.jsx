import React, { useState, useEffect } from 'react';
import {
  Form,
  TextInput,
  Button,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Loading,
  InlineNotification
} from '@carbon/react';
import { getApiBaseUrl } from '../services/config';

function HotelListForm() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);
        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}/api/hotels`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setHotels(data);
        setError(null);
      } catch (err) {
        setError(`Error fetching hotels: ${err.message}`);
        console.error('Error fetching hotels:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, []); // No need for API_BASE_URL dependency

  const filteredHotels = hotels.filter(hotel =>
    hotel.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const headers = [
    { key: 'name', header: 'Hotel Name' },
    { key: 'location', header: 'Location' },
    { key: 'status', header: 'Status' }
  ];

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Hotel List</h1>
      <p>Current API Endpoint: {getApiBaseUrl()}/api/hotels</p>

      {error && (
        <InlineNotification
          kind="error"
          title="Error"
          subtitle={error}
          style={{ marginBottom: '1rem' }}
        />
      )}

      <Form style={{ marginBottom: '2rem' }}>
        <TextInput
          id="search"
          labelText="Search Hotels"
          placeholder="Enter hotel name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Form>

      {loading ? (
        <Loading description="Loading hotels..." withOverlay={false} />
      ) : (
        <DataTable rows={filteredHotels} headers={headers}>
          {({ rows, headers, getHeaderProps }) => (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {headers.map(header => (
                      <TableHeader {...getHeaderProps({ header })}>
                        {header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map(row => (
                    <TableRow key={row.id}>
                      {row.cells.map(cell => (
                        <TableCell key={cell.id}>{cell.value}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
      )}
    </div>
  );
}

export default HotelListForm; 