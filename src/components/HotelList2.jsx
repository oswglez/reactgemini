// src/components/HotelList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loading, InlineNotification, Button, Checkbox, Pagination, DataTable,
  TableContainer, Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
  Modal, // Import Modal
} from '@carbon/react';
import { AddFilled, ArrowUp, ArrowDown, TrashCan } from '@carbon/icons-react'; // Import TrashCan
import { useAuthenticatedFetch, apiService } from '../services/apiService';
import { useAuth0 } from '@auth0/auth0-react';

// ... (styles and decodeHotelStatus without changes)
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
  const { getAccessTokenSilently } = useAuth0();
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
  
  // State for user role information
  const [userRoleInfo, setUserRoleInfo] = useState(null);

  const authenticatedFetch = useAuthenticatedFetch();

  // Memoize the fetch function to avoid unnecessary recreations
  const fetchHotels = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDeleteError(null);
    setDeleteSuccess(null);
    try {
      let url = `/hotels/hotelList?page=${currentPage}&size=${pageSize}`;
      if (sortColumn && sortDirection) {
        // Map contactName to contactLastName for API sorting
        const apiSortColumn = sortColumn === 'contactName' ? 'contactLastName' : sortColumn;
        url += `&sort=${apiSortColumn},${sortDirection.toLowerCase()}`;
      }
      console.log('Fetching URL:', url);
      const response = await authenticatedFetch(url);
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
  }, [currentPage, pageSize, sortColumn, sortDirection, authenticatedFetch]); // Include authenticatedFetch as dependency

  // Use useEffect without fetchHotels as dependency
  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]); // fetchHotels already includes the necessary dependencies

  // Function to get user role information
  const getUserRoleInfo = async () => {
    try {
      const response = await apiService.get('/auth/user-context', getAccessTokenSilently);
      if (response && response.currentRoles) {
        // Find the highest role level
        const roleHierarchy = ['SUPER_USER', 'CHAIN_ADMIN', 'BRAND_ADMIN', 'HOTEL_ADMIN', 'HOTEL_MANAGER', 'HOTEL_STAFF', 'HOTEL_VIEWER'];
        let highestRole = null;
        
        for (const role of response.currentRoles) {
          const roleIndex = roleHierarchy.indexOf(role.roleName);
          if (roleIndex !== -1 && (highestRole === null || roleIndex < roleHierarchy.indexOf(highestRole))) {
            highestRole = role.roleName;
          }
        }
        
        setUserRoleInfo({
          roles: response.currentRoles,
          highestRole: highestRole,
          canEdit: highestRole && ['SUPER_USER', 'CHAIN_ADMIN', 'BRAND_ADMIN', 'HOTEL_ADMIN'].includes(highestRole),
          canDelete: highestRole && ['SUPER_USER', 'CHAIN_ADMIN', 'BRAND_ADMIN'].includes(highestRole)
        });
      }
    } catch (error) {
      console.error('Error fetching user role info:', error);
      // Default to most restrictive permissions
      setUserRoleInfo({
        roles: [],
        highestRole: null,
        canEdit: false,
        canDelete: false
      });
    }
  };

  // Fetch user role information on component mount
  useEffect(() => {
    getUserRoleInfo();
  }, []);

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
    { key: 'contactName', header: 'Contact Name', isSortable: true, style: { width: '200px' } },
    { key: 'contactTitle', header: 'Title', isSortable: true, style: { width: '150px' } },
    { key: 'hotelWebsiteUrl', header: 'Website', isSortable: false, style: { width: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } },
    { key: 'hotelStatus', header: 'Status', isSortable: true, style: { width: '100px' } },
  ];
  const tableRows = hotels.map(hotel => ({ 
    ...hotel, 
    id: hotel.hotelId.toString(),
    contactName: `${hotel.contactLastName || ''}, ${hotel.contactFirstName || ''}`.trim() || 'N/A'
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
      // If the clicked row is already selected, deselect it
      if (prevSelectedRows.has(rowId)) {
        return new Set();
      }
      // Otherwise, select only the clicked row
      return new Set([rowId]);
    });
  };

  const isRowSelected = (rowId) => selectedRows.has(rowId);

  // --- Functions for deletion ---
  const openDeleteModal = () => {
    if (selectedRows.size === 1) {
      const selectedId = Array.from(selectedRows)[0];
      setHotelToDeleteId(selectedId);
      setShowDeleteModal(true);
      setDeleteError(null); // Clear previous error
      setDeleteSuccess(null); // Clear previous success
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
      const response = await authenticatedFetch(`/hotels/${hotelToDeleteId}`, {
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
  // --- End of deletion functions ---

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
            disabled={selectedRows.size === 0} // Enabled if at least one row is selected
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
            disabled={selectedRows.size !== 1} // Only disable if no selection - anyone can view details
            onClick={() => {
              if (selectedRows.size === 1) {
                const selectedHotelId = Array.from(selectedRows)[0];
                // Pass user role info as state to the edit form
                navigate(`/hotel/edit/${selectedHotelId}`, { 
                  state: { userRoleInfo } 
                });
              }
            }}
          >
            {userRoleInfo && !userRoleInfo.canEdit ? 'View Property Details (Read Only)' : 'View Property Details'}
          </Button>
          {/* Delete Button */}
          <Button
            kind="danger" // 'danger' for destructive actions
            renderIcon={TrashCan}
            style={actionButtonStyle}
            disabled={selectedRows.size !== 1 || (userRoleInfo && !userRoleInfo.canDelete)} // Disable if no selection or no delete permission
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
      {/* Deletion error notification */}
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
      {/* Deletion success notification */}
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

      {/* Deletion Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onRequestClose={closeDeleteModal}
        onRequestSubmit={handleDeleteConfirm}
        modalHeading="Confirm Deletion"
        primaryButtonText="YES"
        secondaryButtonText="NO"
        danger // Indicates that the primary action is destructive
      >
        <p>You are about to delete this property. This action is irreversible. Are you sure?</p>
         {/* Show specific deletion error within the modal if necessary */}
        {deleteError && (
            <InlineNotification
            kind="error"
            title="Deletion Failed"
            subtitle={deleteError}
            hideCloseButton // Optional: don't allow closing this specific notification
            lowContrast
            style={{ marginTop: '1rem', marginBottom: '0' }}
            />
        )}
      </Modal>
    </div>
  );
}

export default HotelList;