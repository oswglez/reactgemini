// src/components/HotelList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loading, InlineNotification, Button, Checkbox, Pagination, DataTable,
  TableContainer, Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
} from '@carbon/react';
import { AddFilled, ArrowUp, ArrowDown } from '@carbon/icons-react';

const containerStyle = { /* ... */ };
const actionButtonStyle = { /* ... */ };
const headerButtonContainerStyle = { /* ... */ };
const tableTitleContainerStyle = { /* ... */ };
containerStyle.marginTop = '1rem';
containerStyle.width = '100%';
containerStyle.padding = '20px';
// containerStyle.border = '2px solid blue'; // Comentado para no mostrar el borde azul
containerStyle.backgroundColor = '#f9f9f9';

actionButtonStyle.marginRight = '0.5rem';

headerButtonContainerStyle.display = 'flex';
headerButtonContainerStyle.justifyContent = 'space-between';
headerButtonContainerStyle.alignItems = 'center';
headerButtonContainerStyle.marginBottom = '20px';

tableTitleContainerStyle.display = 'flex';
tableTitleContainerStyle.justifyContent = 'space-between';
tableTitleContainerStyle.alignItems = 'center';
tableTitleContainerStyle.marginBottom = '1rem';


const decodeHotelStatus = (statusKey) => {
  const statusMap = { A: 'Active', P: 'Pending', I: 'Inactive' };
  return statusMap[statusKey] || statusKey;
};

function HotelList() {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [totalElements, setTotalElements] = useState(0);
  const [sortColumn, setSortColumn] = useState('hotelName');
  const [sortDirection, setSortDirection] = useState('ASC');

  const fetchHotels = useCallback(async (page, size, column, direction) => { /* ... (sin cambios) ... */ 
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

  useEffect(() => { /* ... (sin cambios) ... */ 
    console.log('useEffect triggered with:', { currentPage, pageSize, sortColumn, sortDirection });
    fetchHotels(currentPage, pageSize, sortColumn, sortDirection);
  }, [fetchHotels, currentPage, pageSize, sortColumn, sortDirection]);

  const handleSort = useCallback((columnKey) => { /* ... (sin cambios) ... */ 
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

  const getSortIcon = useCallback((columnKey) => { /* ... (sin cambios) ... */ 
    if (sortColumn === columnKey) {
      return sortDirection === 'ASC' ? <ArrowUp size={16} /> : <ArrowDown size={16} />;
    }
    return null;
  }, [sortColumn, sortDirection]);

  const dataTableHeaders = [ /* ... (sin cambios) ... */ 
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
  const tableRows = hotels.map(hotel => ({ ...hotel, id: hotel.hotelId.toString() }));
  const handlePaginationChange = ({ page, pageSize: newPageSize }) => { /* ... (sin cambios) ... */ 
    const newRequestedPage = page - 1;
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setCurrentPage(0);
    } else if (newRequestedPage !== currentPage) {
      setCurrentPage(newRequestedPage);
    }
  };
  const handleRowCheckboxChange = (rowId) => { /* ... (sin cambios) ... */ 
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
  const isRowSelected = (rowId) => selectedRows.has(rowId);
  const handleSelectAll = (event) => { /* ... (sin cambios) ... */ 
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
      {/* ... (Título y botón "Create New Property" sin cambios) ... */}
      <h2 style={{ textAlign: 'center', color: '#3751ff', marginBottom: '10px' }}>SelectVista AI Properties</h2>
      <p style={{ fontSize: '0.875rem', color: '#555', marginBottom: '20px', textAlign: 'center' }}>
        Below you will find the list of properties in the SelectVista AI platform.
        To create a new property select "Create New Property".
        To view or edit the details of a property, select the corresponding row and click on "View Details".
      </p>
      <div style={headerButtonContainerStyle}><div /><Link to="/hotel/new" style={{ textDecoration: 'none' }}><Button kind="primary" renderIcon={AddFilled}>Create New Property</Button></Link></div>
      <div style={tableTitleContainerStyle}>
        <h3>List of Hotels ({totalElements})</h3>
        <div>
          <Button kind="secondary" style={actionButtonStyle} disabled={selectedRows.size === 0}>View Property Amenities</Button>
          <Button kind="secondary" disabled={selectedRows.size !== 1} onClick={() => {
            if (selectedRows.size === 1) {
              const selectedHotelId = Array.from(selectedRows)[0];
              navigate(`/hotel/edit/${selectedHotelId}`);
            }
          }}>View Property Details</Button>
        </div>
      </div>

      {loading && <Loading description="Loading hotels..." withOverlay={false} style={{ marginTop: '2rem' }} />}
      {!loading && error && <InlineNotification kind="error" title="Error Loading List" subtitle={error} onCloseButtonClick={() => setError(null)} lowContrast />}

      {!loading && !error && (
        <>
          {hotels.length === 0 ? (
            <p style={{ textAlign: 'center', marginTop: '2rem' }}>No hotels registered yet.</p>
          ) : (
            <DataTable rows={tableRows} headers={dataTableHeaders} isSortable>
              {({ rows: dtRows, headers: dtHeaders, getHeaderProps, getRowProps, getTableProps }) => (
                <TableContainer>
                  <Table {...getTableProps()} size="md" useZebraStyles={false}>
                    <TableHead>
                      <TableRow>
                        {dtHeaders.map((header) => {
                          // ****** CORRECCIÓN PARA LA KEY ******
                          const { key: carbonGeneratedKey, ...restOfHeaderProps } = getHeaderProps({ header });
                          return (
                            <TableHeader
                              key={header.key} // Usar tu key explícita para React
                              {...restOfHeaderProps} // Propagar el resto de las props de Carbon
                              onClick={() => {
                                if (header.isSortable) {
                                  handleSort(header.key);
                                }
                              }}
                              style={{ ...header.style, ...(restOfHeaderProps.style || {}) }} // Fusionar estilos
                              isSortable={header.isSortable}
                            >
                              {header.header}
                              {header.isSortable && (
                                <span style={{ marginLeft: '8px' }}>{getSortIcon(header.key)}</span>
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
                            if (cell.info.header === 'select') { /* ... */ }
                            if (cell.info.header === 'hotelWebsiteUrl') { /* ... */ }
                            if (cell.info.header === 'hotelStatus') { /* ... */ }
                            // El resto del renderizado de celdas sin cambios
                            if (cell.info.header === 'select') {
                              return (
                                <TableCell key={cell.id}>
                                  <Checkbox id={`checkbox-${row.id}`} labelText="" onChange={() => handleRowCheckboxChange(row.id)} checked={isRowSelected(row.id)} />
                                </TableCell>
                              );
                            }
                            if (cell.info.header === 'hotelWebsiteUrl') {
                              return (
                                <TableCell key={cell.id} style={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {cell.value ? (<a href={cell.value.toString().startsWith('http') ? cell.value.toString() : `http://${cell.value}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0f62fe', textDecoration: 'underline' }}>{cell.value}</a>) : 'N/A'}
                                </TableCell>
                              );
                            }
                            if (cell.info.header === 'hotelStatus') {
                              return (<TableCell key={cell.id}>{decodeHotelStatus(cell.value ? cell.value.toString() : '')}</TableCell>);
                            }
                            return (<TableCell key={cell.id}>{cell.value !== null && cell.value !== undefined ? cell.value.toString() : 'N/A'}</TableCell>);
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </DataTable>
          )}
          {totalElements > 0 && hotels.length > 0 && <Pagination totalItems={totalElements} pageSize={pageSize} pageSizes={[10, 25, 50, 100]} page={currentPage + 1} onChange={handlePaginationChange} style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }} />}
        </>
      )}
    </div>
  );
}

export default HotelList;