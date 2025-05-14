// src/components/HotelList.jsx
import React, { useState, useEffect, useCallback } from 'react';
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
  Pagination,
  TableContainer,
} from '@carbon/react';
import { AddFilled, ArrowUp, ArrowDown, ArrowsVertical } from '@carbon/icons-react';

const containerStyle = {
  marginTop: '1rem',
  width: '100%',
  padding: '20px',
  border: '2px solid blue',
  backgroundColor: '#f9f9f9',
};

const actionButtonStyle = {
  marginRight: '0.5rem',
};

const headerButtonContainerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
};

const tableTitleContainerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
};
const statusMap = {
  A: 'Active',
  P: 'Pending',
  I: 'Inactive',
};

// NUEVO: Función para obtener el texto del estado
const getStatusText = (statusCode) => {
  return statusMap[statusCode] || statusCode; // Devuelve el código original si no se encuentra mapeo
};

function HotelList() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHotels, setSelectedHotels] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [totalElements, setTotalElements] = useState(0);
  const [sortColumn, setSortColumn] = useState('hotelId'); // Columna visible
  const [sortDirection, setSortDirection] = useState('asc');

  const fetchHotels = useCallback(async (page, size, column, direction) => {
    setLoading(true);
    setError(null);

    try {
      let url = `http://localhost:8090/api/hotels/hotelList?page=${page}&size=${size}`;
      if (column && direction) {
        url += `&sort=${column},${direction}`;
      }

      console.log('Fetching URL:', url); // Verifica que el sort esté incluido

      const response = await fetch(url);
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${response.statusText || 'Could not fetch list'}. Body: ${errorBody}`);
      }

      const data = await response.json();

      console.log('Data received from API:', data); // Confirma si está ordenado

      setHotels(data.content || []);
      setTotalElements(data.totalElements || 0);
      setCurrentPage(data.number || 0);
      setPageSize(data.size || 25);
    } catch (err) {
      setError(err.message || 'Could not load hotel list.');
      console.error('Error fetching hotels:', err);
      setHotels([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('useEffect triggered with:', { currentPage, pageSize, sortColumn, sortDirection });
    fetchHotels(currentPage, pageSize, sortColumn, sortDirection);
  }, [fetchHotels, currentPage, pageSize, sortColumn, sortDirection]);

  const handleCheckboxChange = (id) => {
    setSelectedHotels(prevSelected =>
      prevSelected.includes(id)
        ? prevSelected.filter((selectedId) => selectedId !== id)
        : [...prevSelected, id]
    );
  };

  const handlePaginationChange = ({ page, pageSize: newPageSize }) => {
    const newRequestedPage = page - 1;
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setCurrentPage(0);
    } else if (newRequestedPage !== currentPage) {
      setCurrentPage(newRequestedPage);
    }
  };

  const handleSort = (columnKey) => {
    console.log(`handleSort called with column: ${columnKey}`); // Confirmar ejecución

    if (sortColumn === columnKey) {
      setSortDirection(prevDirection => (prevDirection === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }

    if (currentPage !== 0) {
      setCurrentPage(0);
    }
  };

  const getSortIcon = (columnKey) => {
    if (sortColumn === columnKey) {
      return sortDirection === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />;
    }
    return <ArrowsVertical size={16} style={{ opacity: 0.3 }} />;
  };

  const handleHeaderClick = (header) => {
    console.log(`Header clicked: ${header.key}`); // Si ves esto, el evento funciona
    if (!header.nonSortable) {
      handleSort(header.key);
    }
  };

  const headers = [
    { key: 'select', header: 'Select', nonSortable: true, style: { width: '60px' } },
    { key: 'hotelCode', header: 'Code', style: { width: '100px' } },
    { key: 'hotelChain', header: 'Chain', style: { width: '120px' } },
    { key: 'hotelBrand', header: 'Brand', style: { width: '120px' } },
    { key: 'hotelName', header: 'Hotel Name', style: { width: '220px' } },
    { key: 'hotelStreet', header: 'Street', style: { width: '200px' } },
    { key: 'hotelCity', header: 'City', style: { width: '120px' } },
    { key: 'hotelState', header: 'State', style: { width: '100px' } },
    { key: 'hotelCountry', header: 'Country', style: { width: '100px' } },
    { key: 'contactFirstName', header: 'Contact First', style: { width: '130px' } },
    { key: 'contactLastName', header: 'Contact Last', style: { width: '130px' } },
    { key: 'contactTitle', header: 'Title', style: { width: '150px' } },
    { key: 'hotelWebsiteUrl', header: 'Website', style: { width: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } },
    { key: 'hotelStatus', header: 'Status', style: { width: '100px' } },
    { key: 'actions', header: 'Actions', nonSortable: true, style: { width: '100px' } },
  ];

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: 'center', color: '#3751ff', marginBottom: '10px' }}>
        SelectVista AI Properties
      </h2>
      <p style={{ fontSize: '0.875rem', color: '#555', marginBottom: '20px', textAlign: 'center' }}>
        Below you will find the list of properties in the SelectVista AI platform.
        To create a new property select "Create New Property".
        To view or edit the details of a property, select the corresponding row and click on "View Details".
      </p>

      {/* Botón crear propiedad */}
      <div style={headerButtonContainerStyle}>
        <div />
        <Link to="/hotel/new" style={{ textDecoration: 'none' }}>
          <Button kind="primary" renderIcon={AddFilled}>
            Create New Property
          </Button>
        </Link>
      </div>

      {/* Título y botones de acción */}
      <div style={tableTitleContainerStyle}>
        <h3>List of Hotels ({totalElements})</h3>
        <div>
          <Button kind="secondary" style={actionButtonStyle} disabled={selectedHotels.length === 0}>
            View Property Amenities
          </Button>
          <Button kind="secondary" disabled={selectedHotels.length !== 1}>
            View Property Details
          </Button>
        </div>
      </div>

      {/* Estado de carga o error */}
      {loading && <Loading description="Loading hotels..." withOverlay={false} style={{ marginTop: '2rem' }} />}
      {!loading && error && (
        <InlineNotification
          kind="error"
          title="Error Loading List"
          subtitle={error}
          onCloseButtonClick={() => setError(null)}
          lowContrast
        />
      )}

      {/* Tabla de hoteles */}
      {!loading && !error && (
        <div style={{ width: '100%', marginTop: '1rem' }}>
          {hotels.length === 0 ? (
            <p style={{ textAlign: 'center', marginTop: '2rem' }}>No hotels registered yet.</p>
          ) : (
            <>
              <TableContainer>
                <Table size="md" useZebraStyles={false}>
                  <TableHead>
                    <TableRow>
                      {headers.map((header) => (
                        <TableHeader
                          key={header.key}
                          style={{
                            ...header.style,
                            cursor: header.nonSortable ? 'default' : 'pointer',
                          }}
                          onClick={() => handleHeaderClick(header)}
                        >
                          {header.header}
                          {!header.nonSortable && (
                            <span style={{ marginLeft: '8px' }}>
                              {getSortIcon(header.key)}
                            </span>
                          )}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {hotels.map((hotel) => (
                      <TableRow key={hotel.hotelId}>
                        <TableCell>
                          <Checkbox
                            id={`checkbox-${hotel.hotelId}`}
                            onChange={() => handleCheckboxChange(hotel.hotelId)}
                            checked={selectedHotels.includes(hotel.hotelId)}
                            labelText=""
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
                        <TableCell>{hotel.contactFirstName || 'N/A'}</TableCell>
                        <TableCell>{hotel.contactLastName || 'N/A'}</TableCell>
                        <TableCell>{hotel.contactTitle || 'N/A'}</TableCell>
                        <TableCell style={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {hotel.hotelWebsiteUrl ? (
                            <a
                              href={hotel.hotelWebsiteUrl.startsWith('http') ? hotel.hotelWebsiteUrl : `http://${hotel.hotelWebsiteUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#0f62fe', textDecoration: 'underline' }}
                            >
                              {hotel.hotelWebsiteUrl}
                            </a>
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell>{getStatusText(hotel.hotelStatus) || 'N/A'}</TableCell>
                        <TableCell>
                          <Link
                            to={`/hotel/${hotel.hotelId}`}
                            state={{ hotelName: hotel.hotelName }}
                            style={{ textDecoration: 'none' }}
                          >
                            <Button size="sm" kind="tertiary">
                              Select
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Paginación */}
              {totalElements > 0 && (
                <Pagination
                  totalItems={totalElements}
                  pageSize={pageSize}
                  pageSizes={[10, 25, 50, 100]}
                  page={currentPage + 1}
                  onChange={handlePaginationChange}
                  style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default HotelList;