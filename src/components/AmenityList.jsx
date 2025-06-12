// src/components/AmenityList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loading, InlineNotification, Button, Checkbox, Pagination, DataTable,
  TableContainer, Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
  Modal,
} from '@carbon/react';
import { AddFilled, ArrowUp, ArrowDown, TrashCan, Edit } from '@carbon/icons-react';
import { getApiBaseUrl } from '../services/config';

// Estilos (similares a HotelList, ajusta si es necesario)
const containerStyle = { marginTop: '1rem', width: '100%', padding: '20px', backgroundColor: '#f9f9f9' };
const actionButtonStyle = { marginRight: '0.5rem' };
const headerButtonContainerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const tableTitleContainerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' };

function AmenityList() {
  const navigate = useNavigate();
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [totalElements, setTotalElements] = useState(0);
  const [sortColumn, setSortColumn] = useState('amenityCode');
  const [sortDirection, setSortDirection] = useState('ASC');

  // Estados para el modal de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [amenityToDeleteId, setAmenityToDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);

  const fetchAmenities = useCallback(async (page, size, column, direction) => {
    setLoading(true);
    setError(null);
    setDeleteError(null);
    setDeleteSuccess(null);

    try {
      const baseUrl = getApiBaseUrl();
      let url = `${baseUrl}/api/amenities?page=${page}&size=${size}`;
      if (column && direction) {
        url += `&sort=${column},${direction.toLowerCase()}`;
      }
      console.log('Fetching URL:', url);
      const response = await fetch(url);
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${response.statusText || 'Could not fetch amenities'}. Body: ${errorBody}`);
      }
      const data = await response.json();
      console.log('Data received from API:', data);

      const mappedAmenities = (data.content || []).map(amenity => ({
        id: amenity.amenityId.toString(),
        amenityId: amenity.amenityId,
        amenityCode: amenity.amenityCode,
        amenityDescription: amenity.amenityDescription,
        amenityType: amenity.amenityType,
      }));

      setAmenities(mappedAmenities);
      setTotalElements(data.totalElements || 0);
      setCurrentPage(data.number || 0);
      setPageSize(data.size || 25);
    } catch (err) {
      setError(err.message || 'Could not load amenity list.');
      console.error('Error fetching amenities:', err);
      setAmenities([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('useEffect triggered with:', { currentPage, pageSize, sortColumn, sortDirection });
    fetchAmenities(currentPage, pageSize, sortColumn, sortDirection);
  }, [fetchAmenities, currentPage, pageSize, sortColumn, sortDirection]);

  // --- Sort Handlers ---
  const handleSort = useCallback((columnKey) => {
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

  // --- DataTable Headers ---
  const dataTableHeaders = [
    { key: 'select', header: '', isSortable: false, style: { width: '60px' } },
    { key: 'amenityCode', header: 'Code', isSortable: true, style: { width: '100px' } },
    { key: 'amenityDescription', header: 'Description', isSortable: true, style: { width: 'auto' } },
    { key: 'amenityType', header: 'Type', isSortable: true, style: { width: '150px' } },
  ];

  const tableRows = amenities;

  // --- Pagination Handlers ---
  const handlePaginationChange = ({ page, pageSize: newPageSize }) => {
    const newRequestedPage = page - 1;
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setCurrentPage(0);
    } else if (newRequestedPage !== currentPage) {
      setCurrentPage(newRequestedPage);
    }
  };

  // --- Row Selection Handlers ---
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

  const isRowSelected = (rowId) => selectedRows.has(rowId);

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

  // --- Delete Modal Handlers ---
  const openDeleteModal = () => {
    if (selectedRows.size === 1) {
      const selectedAmenityId = Array.from(selectedRows)[0];
      setAmenityToDeleteId(selectedAmenityId);
      setShowDeleteModal(true);
      setDeleteError(null);
      setDeleteSuccess(null);
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setAmenityToDeleteId(null);
    setDeleteError(null);
    setDeleteSuccess(null);
  };

  const handleDeleteConfirm = async () => {
    if (!amenityToDeleteId) return;

    setLoading(true);
    setDeleteError(null);
    setDeleteSuccess(null);

    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/amenities/${amenityToDeleteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${response.statusText || 'Could not delete amenity'}. Body: ${errorBody}`);
      }

      setDeleteSuccess('Amenity deleted successfully.');
      closeDeleteModal();
      setSelectedRows(new Set());
      fetchAmenities(currentPage, pageSize, sortColumn, sortDirection);

    } catch (err) {
      console.error('Error deleting amenity:', err);
      setDeleteError(err.message || 'Could not delete amenity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: 'center', color: '#3751ff', marginBottom: '10px' }}>
        Manage Amenities
      </h2>
      <p style={{ fontSize: '0.875rem', color: '#555', marginBottom: '20px', textAlign: 'center' }}>
        View and manage all amenities available in the system.
        You can create new amenities, view/edit existing ones, or delete them.
      </p>

      <div style={headerButtonContainerStyle}>
        <div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
            API URL: {getApiBaseUrl()}/api/amenities
          </p>
        </div>
        <Link to="/amenities/new" style={{ textDecoration: 'none' }}>
          <Button kind="primary" renderIcon={AddFilled}>Create New Amenity</Button>
        </Link>
      </div>

      <div style={tableTitleContainerStyle}>
        <h3>List of Amenities ({totalElements})</h3>
        <div>
          <Button
            kind="secondary"
            renderIcon={Edit}
            style={actionButtonStyle}
            disabled={selectedRows.size !== 1}
            onClick={() => {
              if (selectedRows.size === 1) {
                const selectedAmenity = amenities.find(a => a.id === Array.from(selectedRows)[0]);
                navigate(`/amenities/edit/${selectedAmenity.amenityId}`);
              }
            }}
          >
            View/Edit Details
          </Button>
          <Button
            kind="danger"
            renderIcon={TrashCan}
            style={actionButtonStyle}
            disabled={selectedRows.size !== 1}
            onClick={openDeleteModal}
          >
            Delete Amenity
          </Button>
        </div>
      </div>

      {loading && <Loading description="Loading amenities..." withOverlay={false} style={{ marginTop: '2rem' }} />}
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
          {amenities.length === 0 ? (
            <p style={{ textAlign: 'center', marginTop: '2rem' }}>No amenities registered yet.</p>
          ) : (
            <DataTable rows={tableRows} headers={dataTableHeaders} isSortable>
              {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
                <TableContainer>
                  <Table {...getTableProps()} size="md" useZebraStyles={false}>
                    <TableHead>
                      <TableRow>
                        {headers.map((header) => {
                          const { key, ...restOfHeaderProps } = getHeaderProps({ header });
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
                              {header.header === '' && amenities.length > 0 ? (
                                <Checkbox
                                  id="select-all-checkbox"
                                  labelText=""
                                  onChange={handleSelectAll}
                                  checked={areAllRowsSelected}
                                  indeterminate={isIndeterminate}
                                />
                              ) : header.header}
                              {header.isSortable && header.header !== '' && (
                                <span style={{ marginLeft: '8px' }}>{getSortIcon(header.key)}</span>
                              )}
                            </TableHeader>
                          );
                        })}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow {...getRowProps({ row })} key={row.id} className={isRowSelected(row.id) ? 'cds--data-table--selected' : ''}>
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
          {totalElements > 0 && amenities.length > 0 && (
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

      <Modal
        open={showDeleteModal}
        onRequestClose={closeDeleteModal}
        onRequestSubmit={handleDeleteConfirm}
        modalHeading="Confirm Deletion"
        primaryButtonText="YES"
        secondaryButtonText="NO"
        danger
      >
        <p>You are about to delete this amenity. This action is irreversible. Are you sure?</p>
        {deleteError && (
          <InlineNotification
            kind="error"
            title="Deletion Failed"
            subtitle={deleteError}
            hideCloseButton
            lowContrast
            style={{ marginTop: '1rem', marginBottom: '0' }}
          />
        )}
      </Modal>
    </div>
  );
}

export default AmenityList;