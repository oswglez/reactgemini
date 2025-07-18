// src/components/HotelList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loading, InlineNotification, Button, Checkbox, Pagination, DataTable,
  TableContainer, Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
  Modal,
} from '@carbon/react';
import { AddFilled, ArrowUp, ArrowDown, TrashCan } from '@carbon/icons-react';
import { useAuthenticatedFetch, apiService } from '../services/apiService';
import { useAuth0 } from '@auth0/auth0-react';
import './HotelList.css';

const decodeHotelStatus = (statusKey) => {
  const statusMap = { A: 'Active', P: 'Pending', I: 'Inactive' };
  return statusMap[statusKey] || statusKey;
};

// Helper function to extract domain name from URL
const extractDomainName = (url) => {
  if (!url) return '';
  
  try {
    // Remove protocol and www
    let domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
    // Remove path and query parameters
    domain = domain.split('/')[0].split('?')[0];
    // Remove port if present
    domain = domain.split(':')[0];
    
    return domain;
  } catch {
    return url;
  }
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
  const [searchTerm, setSearchTerm] = useState('');
  
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
      console.log('🔍 Fetching hotels from URL:', url);
      console.log('🔍 Current environment config:', import.meta.env);
      
      const response = await authenticatedFetch(url);
      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response headers:', response.headers);
      
      if (!response.ok) {
        const errorBody = await response.text();
        console.error('🔍 Error response body:', errorBody);
        throw new Error(`HTTP Error ${response.status}: ${response.statusText || 'Could not fetch list'}. Body: ${errorBody}`);
      }
      
      const data = await response.json();
      console.log('✅ Data received from API:', data);
      console.log('✅ Hotels count:', data.content?.length || 0);
      console.log('✅ Total elements:', data.totalElements || 0);
      
      setHotels(data.content || []);
      setTotalElements(data.totalElements || 0);
      setCurrentPage(data.number || 0);
      setPageSize(data.size || 25);
    } catch (err) {
      console.error('❌ Error fetching hotels:', err);
      setError(err.message || 'Could not load hotel list.');
      setHotels([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sortColumn, sortDirection, authenticatedFetch]);

  // Use useEffect without fetchHotels as dependency
  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  // Function to get user role information
  const getUserRoleInfo = async () => {
    try {
      console.log('🔍 Fetching user role info...');
      const response = await apiService.get('/auth/user-context', getAccessTokenSilently);
      console.log('🔍 User context response:', response);
      
      if (response && response.currentRoles) {
        console.log('🔍 Current roles:', response.currentRoles);
        
        // Find the highest role level
        const roleHierarchy = ['SUPER_USER', 'CHAIN_ADMIN', 'BRAND_ADMIN', 'HOTEL_ADMIN', 'HOTEL_MANAGER', 'HOTEL_STAFF', 'HOTEL_VIEWER'];
        let highestRole = null;
        
        for (const role of response.currentRoles) {
          const roleIndex = roleHierarchy.indexOf(role.roleName);
          if (roleIndex !== -1 && (highestRole === null || roleIndex < roleHierarchy.indexOf(highestRole))) {
            highestRole = role.roleName;
          }
        }
        
        console.log('🔍 Highest role found:', highestRole);
        
        const canEdit = highestRole && ['SUPER_USER', 'CHAIN_ADMIN', 'BRAND_ADMIN', 'HOTEL_ADMIN'].includes(highestRole);
        const canDelete = highestRole && ['SUPER_USER', 'CHAIN_ADMIN', 'BRAND_ADMIN'].includes(highestRole);
        
        console.log('🔍 Permissions - canEdit:', canEdit, 'canDelete:', canDelete);
        
        setUserRoleInfo({
          roles: response.currentRoles,
          highestRole: highestRole,
          canEdit: canEdit,
          canDelete: canDelete
        });
      } else {
        console.warn('⚠️ No currentRoles found in response');
        // Try to get roles from debug endpoint
        try {
          const debugResponse = await apiService.get('/auth/debug-user-roles', getAccessTokenSilently);
          console.log('🔍 Debug user roles response:', debugResponse);
          
          if (debugResponse && debugResponse.userRoles) {
            const superUserRole = debugResponse.userRoles.find(role => role.roleName === 'SUPER_USER');
            if (superUserRole) {
              console.log('🔍 Found SUPER_USER role in debug response');
              setUserRoleInfo({
                roles: debugResponse.userRoles,
                highestRole: 'SUPER_USER',
                canEdit: true,
                canDelete: true
              });
              return;
            }
          }
        } catch (debugError) {
          console.error('❌ Error fetching debug user roles:', debugError);
        }
        
        // Default to most restrictive permissions
        setUserRoleInfo({
          roles: [],
          highestRole: null,
          canEdit: false,
          canDelete: false
        });
      }
    } catch (error) {
      console.error('❌ Error fetching user role info:', error);
      // Default to most restrictive permissions
      setUserRoleInfo({
        roles: [],
        highestRole: null,
        canEdit: false,
        canDelete: false
      });
    }
  };

  // Function to assign SUPER_USER role (temporary for testing)
  const assignSuperUserRole = async () => {
    try {
      console.log('🔍 Assigning SUPER_USER role...');
      const response = await apiService.post('/auth/assign-super-user', {}, getAccessTokenSilently);
      console.log('🔍 Assign SUPER_USER response:', response);
      
      if (response && response.message) {
        console.log('✅ SUPER_USER role assigned successfully');
        // Refresh user role info
        await getUserRoleInfo();
      }
    } catch (error) {
      console.error('❌ Error assigning SUPER_USER role:', error);
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
    { key: 'hotelWebsiteUrl', header: 'Website', isSortable: false, style: { width: '200px' } },
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

  const getStatusBadge = (status) => {
    const statusClass = status === 'Active' ? 'status-active' : 
                       status === 'Pending' ? 'status-pending' : 'status-inactive';
    return <span className={`status-badge ${statusClass}`}>{status}</span>;
  };

  // Error state
  if (error) {
    return (
      <div className="hotel-list-container">
        <div className="hotel-list-content">
          <div className="back-button-container">
            <Button 
              kind="tertiary" 
              onClick={() => navigate("/")}
              className="back-button"
            >
              ← Back to Home
            </Button>
          </div>
          <div className="error-state">
            <h2 className="error-title">Properties</h2>
            <p className="error-message">{error}</p>
            <Button onClick={fetchHotels} className="retry-button">
              ↻ Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!loading && hotels.length === 0) {
    return (
      <div className="hotel-list-container">
        <div className="hotel-list-content">
          <div className="back-button-container">
            <Button 
              kind="tertiary" 
              onClick={() => navigate("/")}
              className="back-button"
            >
              ← Back to Home
            </Button>
          </div>
          <div className="empty-state">
            <h2 className="empty-title">Properties</h2>
            <p className="empty-message">
              No properties have been added yet. Click 'Create New Property' to get started.
            </p>
            <Link to="/hotel/new" style={{ textDecoration: 'none' }}>
              <Button kind="primary" renderIcon={AddFilled} className="create-button">
                Create New Property
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hotel-list-container">
      <div className="hotel-list-content">
        {/* Header */}
        <div className="back-button-container">
          <Button 
            kind="tertiary" 
            onClick={() => navigate("/")}
            className="back-button"
          >
            ← Back to Home
          </Button>
        </div>

        {/* Main Card */}
        <div className="hotel-list-card">
          {/* Card Header */}
          <div className="card-header">
            <div className="header-content">
              <div className="header-left">
                <h1 className="card-title">Properties</h1>
                <p className="card-description">Manage your hotel properties and their details</p>
              </div>
              <div className="header-right">
                <Link to="/hotel/new" style={{ textDecoration: 'none' }}>
                  <Button kind="primary" renderIcon={AddFilled} className="create-button">
                    Create New Property
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Card Content */}
          <div className="card-content">
            {/* Search and Filters */}
            <div className="search-filters-section">
              <div className="search-container">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="filters-container">
                <Button 
                  kind="ghost" 
                  className="refresh-button"
                  onClick={fetchHotels}
                  disabled={loading}
                >
                  🔄 Refresh
                </Button>
                <Button kind="ghost" className="filter-button">
                  🔧 Filters
                </Button>
                <Button kind="ghost" className="export-button">
                  📥 Export
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons-section">
              <div className="action-buttons-left">
                <span className="selected-count">
                  {selectedRows.size} selected
                </span>
              </div>
              <div className="action-buttons-right">
                <Button
                  kind="secondary"
                  className="action-button"
                  disabled={selectedRows.size === 0}
                >
                  View Property Amenities
                </Button>
                <Button
                  kind="secondary"
                  className="action-button"
                  disabled={selectedRows.size !== 1}
                  onClick={() => {
                    if (selectedRows.size === 1) {
                      const selectedHotelId = Array.from(selectedRows)[0];
                      navigate(`/hotels/${selectedHotelId}/roomsDTO`);
                    }
                  }}
                >
                  View Rooms
                </Button>
                <Button
                  kind="secondary"
                  className="action-button"
                  disabled={selectedRows.size !== 1}
                  onClick={() => {
                    if (selectedRows.size === 1) {
                      const selectedHotelId = Array.from(selectedRows)[0];
                      navigate(`/hotel/edit/${selectedHotelId}`, { 
                        state: { userRoleInfo } 
                      });
                    }
                  }}
                >
                  {userRoleInfo && !userRoleInfo.canEdit ? 'View Property Details (Read Only)' : 'View Property Details'}
                </Button>
                <Button
                  kind="danger"
                  renderIcon={TrashCan}
                  className="action-button"
                  disabled={selectedRows.size !== 1 || (userRoleInfo && !userRoleInfo.canDelete)}
                  onClick={openDeleteModal}
                >
                  Delete Property
                </Button>
              </div>
            </div>

            {/* Notifications */}
            {!loading && error && (
              <InlineNotification
                kind="error"
                title="Error Loading List"
                subtitle={error}
                onCloseButtonClick={() => setError(null)}
                lowContrast
                className="notification"
              />
            )}
            {deleteError && (
              <InlineNotification
                kind="error"
                title="Deletion Failed"
                subtitle={deleteError}
                onCloseButtonClick={() => setDeleteError(null)}
                lowContrast
                className="notification"
              />
            )}
            {deleteSuccess && (
              <InlineNotification
                kind="success"
                title="Success"
                subtitle={deleteSuccess}
                onCloseButtonClick={() => setDeleteSuccess(null)}
                lowContrast
                className="notification"
              />
            )}

            {/* Loading State */}
            {loading && (
              <div className="loading-container">
                <Loading description="Loading hotels..." withOverlay={false} />
              </div>
            )}

            {/* Data Table */}
            {!loading && !error && (
              <>
                {hotels.length === 0 ? (
                  <div className="no-data">
                    <p>No hotels registered yet.</p>
                  </div>
                ) : (
                  <DataTable rows={tableRows} headers={dataTableHeaders} isSortable>
                    {({ rows: dtRows, headers: dtHeaders, getHeaderProps, getRowProps, getTableProps }) => (
                      <TableContainer>
                        <Table {...getTableProps()} size="md" useZebraStyles={false} className="hotel-table">
                          <TableHead>
                            <TableRow>
                              {dtHeaders.map((header) => {
                                const { key, ...restOfHeaderProps } = getHeaderProps({ header });
                                return (
                                  <TableHeader
                                    key={key}
                                    {...restOfHeaderProps}
                                    onClick={() => {
                                      if (header.isSortable) {
                                        handleSort(header.key);
                                      }
                                    }}
                                    style={{ ...header.style, ...(restOfHeaderProps.style || {}) }}
                                    isSortable={header.isSortable}
                                    className="table-header"
                                  >
                                    {header.header === 'select' ? '' : header.header}
                                    {header.isSortable && header.header !== 'select' && (
                                      <span className="sort-icon">{getSortIcon(header.key)}</span>
                                    )}
                                  </TableHeader>
                                );
                              })}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {dtRows.map((row) => (
                              <TableRow 
                                {...getRowProps({ row })} 
                                key={row.id} 
                                className={`table-row ${isRowSelected(row.id) ? 'selected' : ''}`}
                              >
                                {row.cells.map((cell) => {
                                  if (cell.info.header === 'select') {
                                    return (
                                      <TableCell key={cell.id} className="checkbox-cell">
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
                                      <TableCell key={cell.id} className="website-cell">
                                        {cell.value ? (
                                          <a 
                                            href={cell.value.toString().startsWith('http') ? cell.value.toString() : `http://${cell.value}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="website-link"
                                            title={cell.value.toString()}
                                          >
                                            {(() => {
                                              const domainName = extractDomainName(cell.value.toString());
                                              return domainName.length > 20 ? domainName.substring(0, 20) + '...' : domainName;
                                            })()} ↗
                                          </a>
                                        ) : 'N/A'}
                                      </TableCell>
                                    );
                                  }
                                  if (cell.info.header === 'hotelStatus') {
                                    return (
                                      <TableCell key={cell.id} className="status-cell">
                                        {getStatusBadge(decodeHotelStatus(cell.value ? cell.value.toString() : ''))}
                                      </TableCell>
                                    );
                                  }
                                  return (
                                    <TableCell key={cell.id} className="data-cell">
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
                
                {/* Pagination */}
                {totalElements > 0 && hotels.length > 0 && (
                  <div className="pagination-container">
                    <Pagination 
                      totalItems={totalElements} 
                      pageSize={pageSize} 
                      pageSizes={[10, 25, 50, 100]} 
                      page={currentPage + 1} 
                      onChange={handlePaginationChange} 
                    />
                  </div>
                )}

                {/* Debug Info - Moved below the table */}
                <div className="debug-info">
                  <p><strong>Debug Info:</strong></p>
                  <p>• Total Hotels: {totalElements}</p>
                  <p>• Current Page: {currentPage + 1}</p>
                  <p>• Page Size: {pageSize}</p>
                  <p>• Loading: {loading ? 'Yes' : 'No'}</p>
                  <p>• Error: {error ? 'Yes' : 'No'}</p>
                  <p>• Selected Rows: {selectedRows.size}</p>
                  <p>• User Role: {userRoleInfo?.highestRole || 'None'}</p>
                  <p>• Can Edit: {userRoleInfo?.canEdit ? 'Yes' : 'No'}</p>
                  <p>• Can Delete: {userRoleInfo?.canDelete ? 'Yes' : 'No'}</p>
                  <div style={{ marginTop: '1rem' }}>
                    <Button 
                      kind="tertiary" 
                      size="sm"
                      onClick={assignSuperUserRole}
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                    >
                      🔧 Assign SUPER_USER Role (Debug)
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Deletion Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onRequestClose={closeDeleteModal}
        onRequestSubmit={handleDeleteConfirm}
        modalHeading="Confirm Deletion"
        primaryButtonText="YES"
        secondaryButtonText="NO"
        danger
        className="delete-modal"
      >
        <p>You are about to delete this property. This action is irreversible. Are you sure?</p>
        {deleteError && (
          <InlineNotification
            kind="error"
            title="Deletion Failed"
            subtitle={deleteError}
            hideCloseButton
            lowContrast
            className="modal-notification"
          />
        )}
      </Modal>
    </div>
  );
}

export default HotelList;