// src/components/HotelList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loading, InlineNotification, Button, Checkbox, Pagination, DataTable,
  TableContainer, Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
  Modal, // Importa Modal
} from '@carbon/react';
import { AddFilled, ArrowUp, ArrowDown, TrashCan } from '@carbon/icons-react'; // Importa TrashCan
import { getApiBaseUrl } from '../services/config';

// ... (estilos y decodeHotelStatus sin cambios)
const containerStyle = { marginTop: '1rem', width: '100%', padding: '20px', backgroundColor: '#f9f9f9' };
const actionButtonStyle = { marginRight: '0.5rem' };
const headerButtonContainerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const tableTitleContainerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' };

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [hotelToDeleteId, setHotelToDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);

  // Memoizar la función de fetch para evitar recreaciones innecesarias
  const fetchHotels = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDeleteError(null);
    setDeleteSuccess(null);
    try {
      const baseUrl = getApiBaseUrl();
      let url = `${baseUrl}/api/hotels/hotelList?page=${currentPage}&size=${pageSize}`;
      if (sortColumn && sortDirection) {
        url += `&sort=${sortColumn},${sortDirection.toLowerCase()}`;
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
  }, [currentPage, pageSize, sortColumn, sortDirection]); // Incluir todas las dependencias necesarias

  // Usar useEffect sin fetchHotels como dependencia
  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]); // fetchHotels ya incluye las dependencias necesarias

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
  const tableRows = hotels.map(hotel => ({ ...hotel, id: hotel.hotelId.toString() }));

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
      // If the clicked row is already selected, deselect it
      if (prevSelectedRows.has(rowId)) {
        return new Set();
      }
      // Otherwise, select only the clicked row
      return new Set([rowId]);
    });
  };

  const isRowSelected = (rowId) => selectedRows.has(rowId);

  // --- Funciones para el borrado ---
  const openDeleteModal = () => {
    if (selectedRows.size === 1) {
      const selectedId = Array.from(selectedRows)[0];
      setHotelToDeleteId(selectedId);
      setShowDeleteModal(true);
      setDeleteError(null); // Limpiar error previo
      setDeleteSuccess(null); // Limpiar éxito previo
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setHotelToDeleteId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!hotelToDeleteId) return;

    setLoading(true);
    setDeleteError(null);
    setDeleteSuccess(null);

    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/hotels/${hotelToDeleteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${response.statusText || 'Could not delete property'}. Body: ${errorBody}`);
      }

      setDeleteSuccess('Property deleted successfully.');
      closeDeleteModal();
      setSelectedRows(prev => {
        const newSelected = new Set(prev);
        newSelected.delete(hotelToDeleteId);
        return newSelected;
      });
      fetchHotels();

    } catch (err) {
      console.error('Error deleting hotel:', err);
      setDeleteError(err.message || 'Could not delete property. Please try again.');
    }
  };
  // --- Fin de funciones para el borrado ---

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: 'center', color: '#3751ff', marginBottom: '10px' }}>SelectVista AI Properties</h2>
      <p style={{ fontSize: '0.875rem', color: '#555', marginBottom: '20px', textAlign: 'center' }}>
        Below you will find the list of properties in the SelectVista AI platform.
        To create a new property select "Create New Property".
        To view or edit the details of a property, select the corresponding row and click on "View Property Details".
        To delete a property, select a row and click "Delete Property".
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
            disabled={selectedRows.size === 0} // Habilitado si al menos una fila está seleccionada
          >
            View Property Amenities
          </Button>
          <Button
            kind="secondary"
            style={actionButtonStyle}
            disabled={selectedRows.size !== 1}
            onClick={() => {
              if (selectedRows.size === 1) {
                const selectedHotelId = Array.from(selectedRows)[0];
                navigate(`/hotels/${selectedHotelId}/rooms`);
              }
            }}
          >
            View Rooms
          </Button>
          <Button
            kind="secondary"
            style={actionButtonStyle}
            disabled={selectedRows.size !== 1} // Habilitado solo si una fila está seleccionada
            onClick={() => {
              if (selectedRows.size === 1) {
                const selectedHotelId = Array.from(selectedRows)[0];
                navigate(`/hotel/edit/${selectedHotelId}`);
              }
            }}
          >
            View Property Details
          </Button>
          {/* Botón de Eliminar */}
          <Button
            kind="danger" // 'danger' para acciones destructivas
            renderIcon={TrashCan}
            style={actionButtonStyle}
            disabled={selectedRows.size !== 1} // Habilitado solo si UNA fila está seleccionada
            onClick={openDeleteModal}
          >
            Delete Property
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
          style={{ marginBottom: '1rem' }}
        />
      )}
      {/* Notificación de error en eliminación */}
      {deleteError && (
        <InlineNotification
          kind="error"
          title="Deletion Failed"
          subtitle={deleteError}
          onCloseButtonClick={() => setDeleteError(null)}
          lowContrast
          style={{ marginBottom: '1rem' }}
        />
      )}
      {/* Notificación de éxito en eliminación */}
      {deleteSuccess && (
        <InlineNotification
          kind="success"
          title="Success"
          subtitle={deleteSuccess}
          onCloseButtonClick={() => setDeleteSuccess(null)}
          lowContrast
          style={{ marginBottom: '1rem' }}
        />
      )}


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
                          const { ...restOfHeaderProps } = getHeaderProps({ header });
                          return (
                            <TableHeader
                              key={header.key}
                              {...restOfHeaderProps}
                              onClick={() => {
                                if (header.isSortable) {
                                  handleSort(header.key);
                                }
                              }}
                              style={{ ...header.style, ...(restOfHeaderProps.style || {}) }}
                              isSortable={header.isSortable}
                            >
                              {header.header === 'select' ? '' : header.header}
                              {header.isSortable && header.header !== 'select' && (
                                <span style={{ marginLeft: '8px' }}>{getSortIcon(header.key)}</span>
                              )}
                            </TableHeader>
                          );
                        })}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dtRows.map((row) => (
                        <TableRow {...getRowProps({ row })} key={row.id} className={isRowSelected(row.id) ? 'cds--data-table--selected' : ''}>
                          {row.cells.map((cell) => {
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

      {/* Modal de Confirmación de Eliminación */}
      <Modal
        open={showDeleteModal}
        onRequestClose={closeDeleteModal}
        onRequestSubmit={handleDeleteConfirm}
        modalHeading="Confirm Deletion"
        primaryButtonText="YES"
        secondaryButtonText="NO"
        danger // Indica que la acción primaria es destructiva
      >
        <p>You are about to delete this property. This action is irreversible. Are you sure?</p>
         {/* Mostrar error específico de la eliminación dentro del modal si es necesario */}
        {deleteError && (
            <InlineNotification
            kind="error"
            title="Deletion Failed"
            subtitle={deleteError}
            hideCloseButton // Opcional: no permitir cerrar esta notificación específica
            lowContrast
            style={{ marginTop: '1rem', marginBottom: '0' }}
            />
        )}
      </Modal>
    </div>
  );
}

export default HotelList;