// src/components/RoomUnitsList.jsx
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
import { apiService } from '../services/apiService';
import './RoomUnitsList.css';

// Room unit data structure based on our backend model
// interface RoomUnit {
//   roomId: number;
//   roomNumber: number;
//   roomType: string;
//   roomName: string;
//   roomDescription: string;
//   roomBuildingName: string;
//   roomBuildingCode: string;
//   roomFloor: number;
//   roomXCoordinates: string;
//   roomYCoordinates: string;
//   roomPrice: number;
//   hotel: Hotel;
// }

function RoomUnitsList() {
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();
  
  // Data states
  const [roomUnits, setRoomUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [totalElements, setTotalElements] = useState(0);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [hotels, setHotels] = useState([]);
  
  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [unitToDeleteId, setUnitToDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);
  
  // User role and permissions states
  const [userRoleInfo, setUserRoleInfo] = useState(null);
  const [loadingUserInfo, setLoadingUserInfo] = useState(true);

  // DataTable headers
  const dataTableHeaders = [
    { key: 'select', header: '', isSortable: false, style: { width: '60px' } },
    { key: 'roomId', header: 'ID', isSortable: false, style: { width: '80px' } },
    { key: 'roomNumber', header: 'Room Number', isSortable: true, style: { width: '120px' } },
    { key: 'roomType', header: 'Room Type', isSortable: true, style: { width: '150px' } },
    { key: 'roomName', header: 'Name', isSortable: true, style: { width: '200px' } },
    { key: 'roomBuildingName', header: 'Building', isSortable: true, style: { width: '150px' } },
    { key: 'roomFloor', header: 'Floor', isSortable: true, style: { width: '80px' } },
    { key: 'roomPrice', header: 'Price', isSortable: true, style: { width: '100px' } },
    { key: 'hotelName', header: 'Hotel', isSortable: true, style: { width: '200px' } },
  ];

  const tableRows = roomUnits.map(unit => ({ 
    ...unit, 
    id: unit.roomId.toString(),
    hotelName: unit.hotel?.hotelName || unit.hotelName || 'N/A'
  }));

  // Get user role information
  const getUserRoleInfo = async () => {
    try {
      console.log('🔍 Fetching user role info for room units...');
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

  // Fetch hotels for filter
  const fetchHotels = useCallback(async () => {
    try {
      const data = await apiService.hotels.getAll(0, 1000, getAccessTokenSilently);
      setHotels(data.content || []);
    } catch (err) {
      console.error('Error fetching hotels:', err);
      setHotels([]);
    }
  }, [getAccessTokenSilently]);

  // Fetch room units
  const fetchRoomUnits = useCallback(async (page, size) => {
    setLoading(true);
    setError(null);
    setDeleteError(null);
    setDeleteSuccess(null);

    try {
      let data;
      if (selectedHotelId) {
        // Fetch rooms for specific hotel
        data = await apiService.roomUnits.getByHotel(selectedHotelId, page, size, getAccessTokenSilently);
      } else {
        // Fetch all rooms (this might need to be implemented in backend)
        data = await apiService.roomUnits.getAll(page, size, getAccessTokenSilently);
      }
      
      const mappedUnits = (data.content || []).map(unit => {
        console.log('=== ROOM UNIT DATA ===');
        console.log('Room ID:', unit.roomId);
        console.log('Room Number:', unit.roomNumber);
        console.log('Hotel ID:', unit.hotelId);
        console.log('Hotel name:', unit.hotelName);
        console.log('Hotel code:', unit.hotelCode);
        console.log('=== END ROOM UNIT DATA ===');
        
        return {
          id: unit.roomId.toString(),
          roomId: unit.roomId,
          roomNumber: unit.roomNumber,
          roomType: unit.roomType,
          roomName: unit.roomName,
          roomDescription: unit.roomDescription,
          roomBuildingName: unit.roomBuildingName,
          roomBuildingCode: unit.roomBuildingCode,
          roomFloor: unit.roomFloor,
          roomXCoordinates: unit.roomXCoordinates,
          roomYCoordinates: unit.roomYCoordinates,
          roomPrice: unit.roomPrice,
          hotel: {
            hotelId: unit.hotelId,
            hotelName: unit.hotelName,
            hotelCode: unit.hotelCode
          }
        };
      });
      setRoomUnits(mappedUnits);
      setTotalElements(data.totalElements || 0);
      setCurrentPage(data.number || 0);
      setPageSize(data.size || 25);
    } catch (err) {
      setError(err.message || 'Could not load room units list.');
      console.error('Error fetching room units:', err);
      setRoomUnits([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [getAccessTokenSilently, selectedHotelId]);

  // Filter room units based on search
  const filteredRoomUnits = roomUnits.filter(roomUnit => {
    const matchesSearch = !searchTerm || 
      roomUnit.roomNumber.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      roomUnit.roomType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (roomUnit.roomName && roomUnit.roomName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (roomUnit.roomBuildingName && roomUnit.roomBuildingName.toLowerCase().includes(searchTerm.toLowerCase()));
    
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
      const selectedUnitId = Array.from(selectedRows)[0];
      // Find the room unit to get the numeric roomId
      const selectedUnit = roomUnits.find(unit => unit.id === selectedUnitId);
      if (selectedUnit) {
        setUnitToDeleteId(selectedUnit.roomId);
        setShowDeleteModal(true);
        setDeleteError(null);
        setDeleteSuccess(null);
      }
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setUnitToDeleteId(null);
    setDeleteError(null);
    setDeleteSuccess(null);
  };

  const handleDeleteConfirm = async () => {
    if (!unitToDeleteId) return;
    
    setLoading(true);
    setDeleteError(null);
    setDeleteSuccess(null);
    
    try {
      await apiService.roomUnits.delete(unitToDeleteId, getAccessTokenSilently);
      setDeleteSuccess('Room unit deleted successfully.');
      closeDeleteModal();
      setSelectedRows(new Set());
      fetchRoomUnits(currentPage, pageSize);
    } catch (err) {
      console.error('Error deleting room unit:', err);
      setDeleteError(err.message || 'Could not delete room unit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    getUserRoleInfo();
    fetchHotels();
  }, [getAccessTokenSilently]);

  useEffect(() => {
    fetchRoomUnits(currentPage, pageSize);
  }, [fetchRoomUnits, currentPage, pageSize]);

  // Loading state
  if (loadingUserInfo) {
    return (
      <div className="room-units-list-container">
        <div className="room-units-list-content">
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
      <div className="room-units-list-container">
        <div className="room-units-list-content">
          <div className="error-state">
            <h2 className="error-title">Access Denied</h2>
            <p className="error-message">You don't have permission to access room units management.</p>
            <Button onClick={() => navigate("/")} className="retry-button">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="room-units-list-container">
      <div className="room-units-list-content">
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
        <div className="room-units-list-card">
          {/* Card Header */}
          <div className="card-header">
            <div className="header-content">
              <div className="header-left">
                <h1 className="card-title">Room Units</h1>
                <p className="card-description">Manage individual room unit details and configurations</p>
              </div>
              <div className="header-right">
                {userRoleInfo.canCreate && (
                  <Link to="/room-units/new" style={{ textDecoration: 'none' }}>
                    <Button kind="primary" renderIcon={AddFilled} className="create-button">
                      Create New Room Unit
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
                  placeholder="Search room units..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="filters-container">
                <Select
                  id="hotel-filter"
                  labelText="Filter by Hotel"
                  value={selectedHotelId || ''}
                  onChange={(e) => setSelectedHotelId(e.target.value || null)}
                  className="hotel-filter-select"
                >
                  <SelectItem value="" text="All Hotels" />
                  {hotels.map(hotel => (
                    <SelectItem 
                      key={hotel.hotelId} 
                      value={hotel.hotelId.toString()} 
                      text={hotel.hotelName} 
                    />
                  ))}
                </Select>
                <Button 
                  kind="ghost" 
                  className="refresh-button"
                  onClick={() => fetchRoomUnits(currentPage, pageSize)}
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
                      const selectedUnitId = Array.from(selectedRows)[0];
                      console.log('=== EDIT BUTTON DEBUG ===');
                      console.log('Selected unit ID (string):', selectedUnitId);
                      console.log('Available room units:', roomUnits);
                      
                      // Find the room unit to get the numeric roomId
                      const selectedUnit = roomUnits.find(unit => unit.id === selectedUnitId);
                      console.log('Found selected unit:', selectedUnit);
                      
                      if (selectedUnit) {
                        console.log('Navigating to room ID:', selectedUnit.roomId);
                        navigate(`/room-units/edit/${selectedUnit.roomId}`);
                      } else {
                        console.error('Selected unit not found!');
                      }
                    }
                  }}
                >
                  <Edit className="action-icon" />
                  Edit Room Unit
                </Button>
                <Button
                  kind="danger"
                  renderIcon={TrashCan}
                  className="action-button"
                  disabled={selectedRows.size !== 1 || !userRoleInfo.canDelete}
                  onClick={openDeleteModal}
                >
                  Delete Room Unit
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
                <Loading description="Loading room units..." withOverlay={false} />
              </div>
            )}

            {/* Data Table */}
            {!loading && !error && (
              <>
                {filteredRoomUnits.length === 0 ? (
                  <div className="no-data">
                    <p>No room units found.</p>
                    {userRoleInfo.canCreate && (
                      <Link to="/room-units/new" style={{ textDecoration: 'none' }}>
                        <Button kind="primary" renderIcon={AddFilled} className="create-button">
                          Create New Room Unit
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <DataTable rows={tableRows} headers={dataTableHeaders} isSortable>
                    {({ rows: dtRows, headers: dtHeaders, getHeaderProps, getRowProps, getTableProps }) => (
                      <TableContainer>
                        <Table {...getTableProps()} size="md" useZebraStyles={false} className="room-units-table">
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
                {totalElements > 0 && filteredRoomUnits.length > 0 && (
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
                  <p>• Total Room Units: {totalElements}</p>
                  <p>• Current Page: {currentPage + 1}</p>
                  <p>• Page Size: {pageSize}</p>
                  <p>• Loading: {loading ? 'Yes' : 'No'}</p>
                  <p>• Error: {error ? 'Yes' : 'No'}</p>
                  <p>• Selected Rows: {selectedRows.size}</p>
                  <p>• User Role: {userRoleInfo?.highestRole || 'None'}</p>
                  <p>• Can Edit: {userRoleInfo?.canEdit ? 'Yes' : 'No'}</p>
                  <p>• Can Delete: {userRoleInfo?.canDelete ? 'Yes' : 'No'}</p>
                  <p>• Can Create: {userRoleInfo?.canCreate ? 'Yes' : 'No'}</p>
                  <p>• Selected Hotel: {selectedHotelId || 'All'}</p>
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
        <p>You are about to delete this room unit. This action is irreversible. Are you sure?</p>
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

export default RoomUnitsList; 