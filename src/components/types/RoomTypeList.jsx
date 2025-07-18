import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Modal,
  TextInput,
  Select,
  SelectItem
} from '@carbon/react';
import { AddFilled, Edit, TrashCan, Search, Filter, Home } from '@carbon/icons-react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiService } from '../../services/apiService';
import './RoomTypeList.css';

// Room type data structure
// interface RoomType {
//   id: string;
//   roomTypeId: number;
//   roomTypeName: string;
//   roomTypeDescription: string;
// }

function RoomTypeList() {
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();
  
  // Data states
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [totalElements, setTotalElements] = useState(0);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  
  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [typeToDeleteId, setTypeToDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);
  
  // User role and permissions states
  const [userRoleInfo, setUserRoleInfo] = useState(null);
  const [loadingUserInfo, setLoadingUserInfo] = useState(true);

  // DataTable headers
  const dataTableHeaders = [
    { key: 'select', header: '', isSortable: false, style: { width: '60px' } },
    { key: 'roomTypeId', header: 'ID', isSortable: false, style: { width: '100px' } },
    { key: 'roomTypeName', header: 'Name', isSortable: true, style: { width: '200px' } },
    { key: 'roomTypeDescription', header: 'Description', isSortable: false, style: { width: 'auto' } },
  ];

  const tableRows = roomTypes.map(type => ({ ...type, id: type.roomTypeId.toString() }));

  // Get user role information
  const getUserRoleInfo = async () => {
    try {
      console.log('🔍 Fetching user role info for room types...');
      const response = await apiService.userContext.getCurrent(getAccessTokenSilently);
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
        const canCreate = highestRole && ['SUPER_USER', 'CHAIN_ADMIN', 'BRAND_ADMIN', 'HOTEL_ADMIN'].includes(highestRole);
        
        console.log('🔍 Permissions - canEdit:', canEdit, 'canDelete:', canDelete, 'canCreate:', canCreate);
        
        setUserRoleInfo({
          roles: response.currentRoles,
          highestRole: highestRole,
          canEdit: canEdit,
          canDelete: canDelete,
          canCreate: canCreate
        });
      } else {
        console.warn('⚠️ No currentRoles found in response');
        setUserRoleInfo({
          roles: [],
          highestRole: null,
          canEdit: false,
          canDelete: false,
          canCreate: false
        });
      }
    } catch (error) {
      console.error('❌ Error fetching user role info:', error);
      setUserRoleInfo({
        roles: [],
        highestRole: null,
        canEdit: false,
        canDelete: false,
        canCreate: false
      });
    } finally {
      setLoadingUserInfo(false);
    }
  };

  // Fetch room types
  const fetchRoomTypes = useCallback(async (page, size) => {
    setLoading(true);
    setError(null);
    setDeleteError(null);
    setDeleteSuccess(null);

    try {
      const data = await apiService.roomTypes.getAll(page, size, getAccessTokenSilently);
      const mappedTypes = (data.content || []).map(type => ({
        id: type.roomTypeId.toString(),
        roomTypeId: type.roomTypeId,
        roomTypeName: type.roomTypeName,
        roomTypeDescription: type.roomTypeDescription
      }));
      setRoomTypes(mappedTypes);
      setTotalElements(data.totalElements || 0);
      setCurrentPage(data.number || 0);
      setPageSize(data.size || 25);
    } catch (err) {
      setError(err.message || 'Could not load room type list.');
      console.error('Error fetching room types:', err);
      setRoomTypes([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [getAccessTokenSilently]);

  // Filter room types based on search
  const filteredRoomTypes = roomTypes.filter(roomType => {
    const matchesSearch = !searchTerm || 
      roomType.roomTypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      roomType.roomTypeDescription.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Pagination handlers
  const handlePaginationChange = ({ page, pageSize: newPageSize }) => {
    const newRequestedPage = page - 1;
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setCurrentPage(0);
    } else if (newRequestedPage !== currentPage) {
      setCurrentPage(newRequestedPage);
    }
  };

  // Row selection handlers
  const handleRowCheckboxChange = (rowId) => {
    setSelectedRows(prevSelectedRows => {
      if (prevSelectedRows.has(rowId)) {
        return new Set();
      }
      return new Set([rowId]);
    });
  };

  const isRowSelected = (rowId) => selectedRows.has(rowId);

  // Delete handlers
  const openDeleteModal = () => {
    if (selectedRows.size === 1) {
      const selectedTypeId = Array.from(selectedRows)[0];
      setTypeToDeleteId(selectedTypeId);
      setShowDeleteModal(true);
      setDeleteError(null);
      setDeleteSuccess(null);
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setTypeToDeleteId(null);
    setDeleteError(null);
    setDeleteSuccess(null);
  };

  const handleDeleteConfirm = async () => {
    if (!typeToDeleteId) return;
    
    setLoading(true);
    setDeleteError(null);
    setDeleteSuccess(null);
    
    try {
      await apiService.roomTypes.delete(typeToDeleteId, getAccessTokenSilently);
      setDeleteSuccess('Room type deleted successfully.');
      closeDeleteModal();
      setSelectedRows(new Set());
      fetchRoomTypes(currentPage, pageSize);
    } catch (err) {
      console.error('Error deleting room type:', err);
      setDeleteError(err.message || 'Could not delete room type. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  // Effects
  useEffect(() => {
    getUserRoleInfo();
  }, [getAccessTokenSilently]);

  useEffect(() => {
    fetchRoomTypes(currentPage, pageSize);
  }, [fetchRoomTypes, currentPage, pageSize]);

  // Loading state
  if (loadingUserInfo) {
    return (
      <div className="room-type-list-container">
        <div className="room-type-list-content">
          <div className="loading-container">
            <Loading description="Loading user permissions..." withOverlay={false} />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!userRoleInfo) {
    return (
      <div className="room-type-list-container">
        <div className="room-type-list-content">
          <div className="error-state">
            <h2 className="error-title">Access Denied</h2>
            <p className="error-message">You don't have permission to access room types management.</p>
            <Button onClick={() => navigate("/")} className="retry-button">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="room-type-list-container">
      <div className="room-type-list-content">
        {/* Header */}
        <div className="back-button-container">
          <Button 
            kind="tertiary" 
            onClick={() => navigate("/")}
            className="back-button"
          >
            <Home className="back-icon" />
            Back to Home
          </Button>
        </div>

        {/* Main Card */}
        <div className="room-type-list-card">
          {/* Card Header */}
          <div className="card-header">
            <div className="header-content">
              <div className="header-left">
                <h1 className="card-title">Room Types</h1>
                <p className="card-description">Manage room type configurations and pricing</p>
              </div>
              <div className="header-right">
                {userRoleInfo.canCreate && (
                  <Link to="/types/room/new" style={{ textDecoration: 'none' }}>
                    <Button kind="primary" renderIcon={AddFilled} className="create-button">
                      Create New Room Type
                    </Button>
                  </Link>
                )}
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
                  placeholder="Search room types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="filters-container">
                <Button 
                  kind="ghost" 
                  className="refresh-button"
                  onClick={() => fetchRoomTypes(currentPage, pageSize)}
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
                  disabled={selectedRows.size !== 1 || !userRoleInfo.canEdit}
                  onClick={() => {
                    if (selectedRows.size === 1) {
                      const selectedTypeId = Array.from(selectedRows)[0];
                      navigate(`/types/room/edit/${selectedTypeId}`);
                    }
                  }}
                >
                  <Edit className="action-icon" />
                  Edit Room Type
                </Button>
                <Button
                  kind="danger"
                  renderIcon={TrashCan}
                  className="action-button"
                  disabled={selectedRows.size !== 1 || !userRoleInfo.canDelete}
                  onClick={openDeleteModal}
                >
                  Delete Room Type
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
                <Loading description="Loading room types..." withOverlay={false} />
              </div>
            )}

            {/* Data Table */}
            {!loading && !error && (
              <>
                {filteredRoomTypes.length === 0 ? (
                  <div className="no-data">
                    <p>No room types found.</p>
                    {userRoleInfo.canCreate && (
                      <Link to="/types/room/new" style={{ textDecoration: 'none' }}>
                        <Button kind="primary" renderIcon={AddFilled} className="create-button">
                          Create New Room Type
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <DataTable rows={tableRows} headers={dataTableHeaders} isSortable>
                    {({ rows: dtRows, headers: dtHeaders, getHeaderProps, getRowProps, getTableProps }) => (
                      <TableContainer>
                        <Table {...getTableProps()} size="md" useZebraStyles={false} className="room-type-table">
                          <TableHead>
                            <TableRow>
                              {dtHeaders.map((header) => {
                                const { key, ...restOfHeaderProps } = getHeaderProps({ header });
                                return (
                                  <TableHeader
                                    key={key}
                                    {...restOfHeaderProps}
                                    style={{ ...header.style, ...(restOfHeaderProps.style || {}) }}
                                    isSortable={header.isSortable}
                                    className="table-header"
                                  >
                                    {header.header === 'select' ? '' : header.header}
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
                {totalElements > 0 && filteredRoomTypes.length > 0 && (
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

                {/* Debug Info */}
                <div className="debug-info">
                  <p><strong>Debug Info:</strong></p>
                  <p>• Total Room Types: {totalElements}</p>
                  <p>• Current Page: {currentPage + 1}</p>
                  <p>• Page Size: {pageSize}</p>
                  <p>• Loading: {loading ? 'Yes' : 'No'}</p>
                  <p>• Error: {error ? 'Yes' : 'No'}</p>
                  <p>• Selected Rows: {selectedRows.size}</p>
                  <p>• User Role: {userRoleInfo?.highestRole || 'None'}</p>
                  <p>• Can Edit: {userRoleInfo?.canEdit ? 'Yes' : 'No'}</p>
                  <p>• Can Delete: {userRoleInfo?.canDelete ? 'Yes' : 'No'}</p>
                  <p>• Can Create: {userRoleInfo?.canCreate ? 'Yes' : 'No'}</p>
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
        <p>You are about to delete this room type. This action is irreversible. Are you sure?</p>
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

export default RoomTypeList; 