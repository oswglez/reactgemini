// src/components/HotelList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Loading,
  InlineNotification,
  Button,
  Checkbox,
  Pagination,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
} from '@carbon/react';
import { AddFilled, ArrowUp, ArrowDown } from '@carbon/icons-react';

const containerStyle = {
  marginTop: '1rem',
  width: '100%',
  padding: '20px',
  border: '2px solid blue', // Para visualización
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

// Función para decodificar el estado del hotel
const decodeHotelStatus = (statusKey) => {
  const statusMap = {
    A: 'Active',
    P: 'Pending',
    I: 'Inactive',
  };
  return statusMap[statusKey] || statusKey; // Devuelve el valor decodificado o la clave si no se encuentra
};

function HotelList() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set()); // Para checkboxes

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [totalElements, setTotalElements] = useState(0);

  const [sortColumn, setSortColumn] = useState('hotelName');
  const [sortDirection, setSortDirection] = useState('ASC');

  const fetchHotels = useCallback(async (page, size, column, direction) => {
    setLoading(true);
    setError(null);
    try {
      let url = `http://localhost:8090/api/hotels/hotelList?page=${page}&size=${size}`;
      if (column && direction) {
        url += `&sort=${column},${direction.toLowerCase()}`;
      }
      console.log('Fetching URL:', url);
      const response = await fetch(url);
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${response.statusText || 'Could not fetch list'}. Body: ${errorBody}`);
      }
      const data = await response.json();
      console.log('Data received from API:', data);
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

  const handleSort = useCallback((columnKey) => {
    console.log(`handleSort (called by DataTable) for column: ${columnKey}`);
    if (sortColumn === columnKey) {
      setSortDirection(prevDirection => (prevDirection === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortColumn(columnKey);
      setSortDirection('ASC');
    }
    if (currentPage !== 0) {
      setCurrentPage(0);
    }
  }, [sortColumn, currentPage]);

  const getSortIcon = useCallback((columnKey) => {
    if (sortColumn === columnKey) {
      return sortDirection === 'ASC' ? <ArrowUp size={16} /> : <ArrowDown size={16} />;
    }
    return null;
  }, [sortColumn, sortDirection]);

  const dataTableHeaders = [
    { key: 'select', header: '', isSortable: false, style: { width: '60px' } },
    { key: 'hotelCode', header: 'Code', isSortable: true, style: { width: '100px' } },
    { key: 'hotelChain', header: 'Chain', isSortable: true, style: { width: '120px' } },
    { key: 'hotelBrand', header: 'Brand', isSortable: true, style: { width: '120px' } },
    { key: 'hotelName', header: 'Hotel Name', isSortable: true, style: { width: '220px' } },
    { key: 'hotelStreet', header: 'Street', isSortable: true, style: { width: '200px' } },
    { key: 'hotelCity', header: 'City', isSortable: true, style: { width: '120px' } },
    { key: 'hotelState', header: 'State', isSortable: true, style: { width: '100px' } },
    { key: 'hotelCountry', header: 'Country', isSortable: true, style: { width: '100px' } },
    { key: 'contactFirstName', header: 'Contact First', isSortable: true, style: { width: '130px' } },
    { key: 'contactLastName', header: 'Contact Last', isSortable: true, style: { width: '130px' } },
    { key: 'contactTitle', header: 'Title', isSortable: true, style: { width: '150px' } },
    { key: 'hotelWebsiteUrl', header: 'Website', isSortable: false, style: { width: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } },
    { key: 'hotelStatus', header: 'Status', isSortable: true, style: { width: '100px' } },
  ];

  const tableRows = hotels.map(hotel => ({
    ...hotel,
    id: hotel.hotelId.toString(),
  }));

  const handlePaginationChange = ({ page, pageSize: newPageSize }) => {
    const newRequestedPage = page - 1;
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setCurrentPage(0);
    } else if (newRequestedPage !== currentPage) {
      setCurrentPage(newRequestedPage);
    }
  };

  const handleRowCheckboxChange = (rowId) => {
    setSelectedRows(prevSelectedRows => {
      const newSelectedRows = new Set(prevSelectedRows);
      if (newSelectedRows.has(rowId)) {
        newSelectedRows.delete(rowId);
      } else {
        newSelectedRows.add(rowId);
      }
      return newSelectedRows;
    });
  };

  const isRowSelected = (rowId) => {
    return selectedRows.has(rowId);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allRowIds = new Set(tableRows.map(row => row.id));
      setSelectedRows(allRowIds);
    } else {
      setSelectedRows(new Set());
    }
  };

  const areAllRowsSelected = tableRows.length > 0 && selectedRows.size === tableRows.length;
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < tableRows.length;

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

      <div style={headerButtonContainerStyle}>
        <div />
        <Link to="/hotel/new" style={{ textDecoration: 'none' }}>
          <Button kind="primary" renderIcon={AddFilled}>Create New Property</Button>
        </Link>
      </div>

      <div style={tableTitleContainerStyle}>
        <h3>List of Hotels ({totalElements})</h3>
        <div>
          <Button
            kind="secondary"
            style={actionButtonStyle}
            disabled={selectedRows.size === 0}
            // onClick={() => console.log('View Amenities for:', Array.from(selectedRows))}
          >
            View Property Amenities
          </Button>
          <Button
            kind="secondary"
            disabled={selectedRows.size !== 1}
            // onClick={() => {
            //   if (selectedRows.size === 1) {
            //     const selectedHotelId = Array.from(selectedRows)[0];
            //     console.log('View Details for hotel ID:', selectedHotelId);
            //   }
            // }}
          >
            View Property Details
          </Button>
        </div>
      </div>

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

      {!loading && !error && (
        <>
          {hotels.length === 0 ? (
            <p style={{ textAlign: 'center', marginTop: '2rem' }}>No hotels registered yet.</p>
          ) : (
            <DataTable
              rows={tableRows}
              headers={dataTableHeaders}
              isSortable
            >
              {({
                rows: dtRows,
                headers: dtHeaders,
                getHeaderProps,
                getRowProps,
                getTableProps,
              }) => (
                <TableContainer>
                  <Table {...getTableProps()} size="md" useZebraStyles={false}>
                    <TableHead>
                      <TableRow>
                        {dtHeaders.map((header) => {
                          const headerProps = getHeaderProps({ header });
                          if (header.key === 'select') {
                            return (
                              <TableHeader key={header.key} {...headerProps} style={{ ...header.style, ...headerProps.style }}>
                                <Checkbox
                                  id="select-all-checkbox"
                                  labelText=""
                                  onChange={handleSelectAll}
                                  checked={areAllRowsSelected}
                                  indeterminate={isIndeterminate}
                                />
                              </TableHeader>
                            );
                          }
                          return (
                            <TableHeader
                              key={header.key}
                              {...headerProps}
                              onClick={() => {
                                console.log(`TableHeader clicked (via DataTable pattern): ${header.key}, isSortable: ${header.isSortable}`);
                                if (header.isSortable) {
                                  handleSort(header.key);
                                }
                              }}
                              style={{ ...header.style, ...headerProps.style }}
                              isSortable={header.isSortable}
                            >
                              {header.header}
                              {header.isSortable && (
                                <span style={{ marginLeft: '8px' }}>
                                  {getSortIcon(header.key)}
                                </span>
                              )}
                            </TableHeader>
                          );
                        })}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dtRows.map((row) => (
                        <TableRow {...getRowProps({ row })} key={row.id}>
                          {row.cells.map((cell) => {
                            if (cell.info.header === 'select') {
                              return (
                                <TableCell key={cell.id}>
                                  <Checkbox
                                    id={`checkbox-${row.id}`}
                                    labelText=""
                                    onChange={() => handleRowCheckboxChange(row.id)}
                                    checked={isRowSelected(row.id)}
                                  />
                                </TableCell>
                              );
                            }
                            if (cell.info.header === 'hotelWebsiteUrl') {
                              return (
                                <TableCell key={cell.id} style={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {cell.value ? (
                                    <a
                                      href={cell.value.toString().startsWith('http') ? cell.value.toString() : `http://${cell.value}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: '#0f62fe', textDecoration: 'underline' }}
                                    >
                                      {cell.value}
                                    </a>
                                  ) : 'N/A'}
                                </TableCell>
                              );
                            }
                            if (cell.info.header === 'hotelStatus') {
                              return (
                                <TableCell key={cell.id}>
                                  {decodeHotelStatus(cell.value ? cell.value.toString() : '')}
                                </TableCell>
                              );
                            }
                            return (
                              <TableCell key={cell.id}>
                                {cell.value !== null && cell.value !== undefined ? cell.value.toString() : 'N/A'}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </DataTable>
          )}
          {totalElements > 0 && hotels.length > 0 && (
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
  );
}

export default HotelList;