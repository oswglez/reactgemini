// src/components/RoomUnitsList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Loading, InlineNotification, Button, Checkbox, Pagination, DataTable,
  TableContainer, Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
  Modal
} from '@carbon/react';
import { AddFilled, ArrowUp, ArrowDown, TrashCan, ArrowLeft } from '@carbon/icons-react';
import { apiService } from '../services/apiService';
import { useAuth0 } from '@auth0/auth0-react';

// Styles
const containerStyle = { marginTop: '1rem', width: '100%', padding: '20px', backgroundColor: '#f9f9f9' };
const actionButtonStyle = { marginRight: '0.5rem' };
const headerButtonContainerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const tableTitleContainerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' };
const backButtonStyle = { marginBottom: '16px' };

function RoomUnitsList() {
  const navigate = useNavigate();
  const { hotelId } = useParams();
  const { getAccessTokenSilently } = useAuth0();
  const [hotelData, setHotelData] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [totalElements, setTotalElements] = useState(0);
  const [sortColumn, setSortColumn] = useState('roomNumber');
  const [sortDirection, setSortDirection] = useState('ASC');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roomToDeleteId, setRoomToDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);
  const [userRoleInfo, setUserRoleInfo] = useState(null);



  // Fetch hotel data and rooms
  const fetchHotelAndRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDeleteError(null);
    setDeleteSuccess(null);
    try {
      console.log('[FE] Fetching hotel and rooms:', { hotelId });
      // Obtener el token manualmente para loguear headers
      let token = null;
      if (typeof getAccessTokenSilently === 'function') {
        try {
          token = await getAccessTokenSilently();
        } catch (e) {
          console.warn('[FE] No se pudo obtener el token:', e);
        }
      }
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      console.log('[FE] Headers enviados a roomsDTO:', headers);
      const data = await apiService.roomUnits.getByHotelId(hotelId, getAccessTokenSilently);
      console.log('[FE] Data received from API:', data);
      setHotelData(data);
      setRooms(data.rooms || []);
      setTotalElements(data.rooms ? data.rooms.length : 0);
    } catch (err) {
      console.error('[FE] Error fetching hotel and rooms:', err);
      setError(err.message || 'Could not load room list.');
      setHotelData(null);
      setRooms([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [hotelId, getAccessTokenSilently]);

  useEffect(() => { fetchHotelAndRooms(); }, [fetchHotelAndRooms]);

  // User role info
  const getUserRoleInfo = async () => {
    try {
      const response = await apiService.get('/auth/user-context', getAccessTokenSilently);
      if (response && response.currentRoles) {
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
          canEdit: highestRole && ['SUPER_USER', 'CHAIN_ADMIN', 'BRAND_ADMIN', 'HOTEL_ADMIN', 'HOTEL_MANAGER'].includes(highestRole),
          canDelete: highestRole && ['SUPER_USER', 'CHAIN_ADMIN', 'BRAND_ADMIN', 'HOTEL_ADMIN'].includes(highestRole)
        });
      }
    } catch (error) {
      console.error('Error fetching user role info:', error);
      setUserRoleInfo({ roles: [], highestRole: null, canEdit: false, canDelete: false });
    }
  };
  useEffect(() => { getUserRoleInfo(); }, []);

  // Sorting functionality
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

  // DataTable headers
  const dataTableHeaders = [
    { key: 'select', header: '', isSortable: false, style: { width: '60px' } },
    { key: 'roomNumber', header: 'Room Number', isSortable: true, style: { width: '120px' } },
    { key: 'roomType', header: 'Type', isSortable: true, style: { width: '120px' } },
    { key: 'roomName', header: 'Room Name', isSortable: true, style: { width: '200px' } },
    { key: 'roomBuildingName', header: 'Building', isSortable: true, style: { width: '150px' } },
    { key: 'roomFloor', header: 'Floor', isSortable: true, style: { width: '80px' } },
    { key: 'roomPrice', header: 'Price', isSortable: true, style: { width: '100px' } },
    { key: 'roomDescription', header: 'Description', isSortable: false, style: { width: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } },
    { key: 'roomBuildingCode', header: 'Building Code', isSortable: true, style: { width: '120px' } },
  ];

  // Prepare table rows
  const tableRows = rooms.map(room => ({ 
    ...room, 
    id: room.roomId.toString(),
    roomNumber: room.roomNumber || 'N/A',
    roomType: room.roomType || 'N/A',
    roomName: room.roomName || `Room ${room.roomNumber}`,
    roomBuildingName: room.roomBuildingName || 'N/A',
    roomFloor: room.roomFloor || 'N/A',
    roomPrice: room.roomPrice ? `$${room.roomPrice.toFixed(2)}` : 'N/A',
    roomDescription: room.roomDescription || 'N/A',
    roomBuildingCode: room.roomBuildingCode || 'N/A'
  }));

  // Pagination
  const handlePaginationChange = ({ page, pageSize: newPageSize }) => {
    const newRequestedPage = page - 1;
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setCurrentPage(0);
    } else if (newRequestedPage !== currentPage) {
      setCurrentPage(newRequestedPage);
    }
  };

  // Row selection
  const handleRowCheckboxChange = (rowId) => {
    setSelectedRows(prevSelectedRows => {
      if (prevSelectedRows.has(rowId)) {
        return new Set();
      }
      return new Set([rowId]);
    });
  };

  const isRowSelected = (rowId) => selectedRows.has(rowId);

  // Delete functionality
  const openDeleteModal = () => {
    if (selectedRows.size === 1) {
      const selectedId = Array.from(selectedRows)[0];
      setRoomToDeleteId(selectedId);
      setShowDeleteModal(true);
      setDeleteError(null);
      setDeleteSuccess(null);
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setRoomToDeleteId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!roomToDeleteId) return;

    setLoading(true);
    setDeleteError(null);
    setDeleteSuccess(null);

    try {
      await apiService.roomUnits.delete(roomToDeleteId, getAccessTokenSilently);
      setDeleteSuccess('Room deleted successfully.');
      closeDeleteModal();
      setSelectedRows(prev => {
        const newSelected = new Set(prev);
        newSelected.delete(roomToDeleteId);
        return newSelected;
      });
      fetchHotelAndRooms();
    } catch (err) {
      console.error('Error deleting room:', err);
      setDeleteError(err.message || 'Could not delete room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      {/* Back Button */}
      <div style={backButtonStyle}>
        <Button
          kind="ghost"
          renderIcon={ArrowLeft}
          onClick={() => navigate('/hotels')}
        >
          Back to Hotels
        </Button>
      </div>

      <h2 style={{ textAlign: 'center', color: '#3751ff', marginBottom: '10px' }}>
        Room Units - {hotelData?.hotelName || 'Hotel'}
      </h2>
      <p style={{ fontSize: '0.875rem', color: '#555', marginBottom: '20px', textAlign: 'center' }}>
        Below you will find the list of room units for {hotelData?.hotelName || 'this hotel'} ({hotelData?.hotelCode || 'N/A'}).
        To create a new room unit select "Create New Room".
        To view or edit the details of a room unit, select the corresponding row and click on "View Room Details".
        To delete a room unit, select a row and click "Delete Room".
      </p>

      <div style={headerButtonContainerStyle}>
        <div />
        <Link to={`/hotels/${hotelId}/roomsDTO/new`} style={{ textDecoration: 'none' }}>
          <Button kind="primary" renderIcon={AddFilled}>Create New Room</Button>
        </Link>
      </div>

      <div style={tableTitleContainerStyle}>
        <h3>List of Room Units ({totalElements})</h3>
        <div>
          <Button
            kind="secondary"
            style={actionButtonStyle}
            disabled={selectedRows.size !== 1}
            onClick={() => {
              if (selectedRows.size === 1) {
                const selectedRoomId = Array.from(selectedRows)[0];
                navigate(`/hotels/${hotelId}/roomsDTO/${selectedRoomId}/amenities`);
              }
            }}
          >
            View Room Amenities
          </Button>
          <Button
            kind="secondary"
            style={actionButtonStyle}
            disabled={selectedRows.size !== 1}
            onClick={() => {
              if (selectedRows.size === 1) {
                const selectedRoomId = Array.from(selectedRows)[0];
                navigate(`/hotels/${hotelId}/roomsDTO/${selectedRoomId}/media`);
              }
            }}
          >
            View Room Media
          </Button>
          <Button
            kind="secondary"
            style={actionButtonStyle}
            disabled={selectedRows.size !== 1}
            onClick={() => {
              if (selectedRows.size === 1) {
                const selectedRoomId = Array.from(selectedRows)[0];
                navigate(`/hotels/${hotelId}/roomsDTO/edit/${selectedRoomId}`, { 
                  state: { userRoleInfo } 
                });
              }
            }}
          >
            {userRoleInfo && !userRoleInfo.canEdit ? 'View Room Details (Read Only)' : 'View Room Details'}
          </Button>
          <Button
            kind="danger"
            renderIcon={TrashCan}
            style={actionButtonStyle}
            disabled={selectedRows.size !== 1 || (userRoleInfo && !userRoleInfo.canDelete)}
            onClick={openDeleteModal}
          >
            Delete Room
          </Button>
        </div>
      </div>

      {loading && <Loading description="Loading room units..." withOverlay={false} style={{ marginTop: '2rem' }} />}
      
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
          {rooms.length === 0 ? (
            <p style={{ textAlign: 'center', marginTop: '2rem' }}>No room units registered for this hotel yet.</p>
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
                            if (cell.info.header === 'roomDescription') {
                              return (
                                <TableCell key={cell.id} style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {cell.value}
                                </TableCell>
                              );
                            }
                            if (cell.info.header === 'roomPrice') {
                              return (
                                <TableCell key={cell.id} style={{ fontWeight: 'bold', color: '#0f62fe' }}>
                                  {cell.value}
                                </TableCell>
                              );
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
          {totalElements > 0 && rooms.length > 0 && (
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

      {/* Deletion Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onRequestClose={closeDeleteModal}
        onRequestSubmit={handleDeleteConfirm}
        modalHeading="Confirm Deletion"
        primaryButtonText="YES"
        secondaryButtonText="NO"
        danger
      >
        <p>You are about to delete this room unit. This action is irreversible. Are you sure?</p>
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

export default RoomUnitsList; 