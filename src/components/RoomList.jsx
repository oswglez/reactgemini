import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Loading, InlineNotification, Button, Checkbox, Pagination, DataTable,
  TableContainer, Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
  Modal
} from '@carbon/react';
import { AddFilled, ArrowUp, ArrowDown, TrashCan } from '@carbon/icons-react';
import { getApiBaseUrl } from '../services/config';

const containerStyle = { marginTop: '1rem', width: '100%', padding: '20px', backgroundColor: '#f9f9f9' };
const actionButtonStyle = { marginRight: '0.5rem' };
const headerButtonContainerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const tableTitleContainerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' };

function RoomList() {
  const navigate = useNavigate();
  const { hotelId } = useParams();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [totalElements, setTotalElements] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roomToDeleteId, setRoomToDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);

  // DataTable headers y rows
  const dataTableHeaders = [
    { key: 'select', header: '', isSortable: false, style: { width: '60px' } },
    { key: 'roomNumber', header: 'Number', isSortable: false },
    { key: 'roomType', header: 'Type', isSortable: false },
    { key: 'roomFloor', header: 'Floor', isSortable: false },
    { key: 'roomPrice', header: 'Price', isSortable: false },
    { key: 'roomName', header: 'Name', isSortable: false },
    { key: 'roomDescription', header: 'Description', isSortable: false },
    { key: 'roomBuildingName', header: 'Building Name', isSortable: false },
    { key: 'roomBuildingCode', header: 'Building Code', isSortable: false },
    { key: 'roomXCoordinates', header: 'X Coord.', isSortable: false },
    { key: 'roomYCoordinates', header: 'Y Coord.', isSortable: false },
  ];
  const tableRows = rooms.map(room => ({ ...room, id: room.roomId.toString() }));

  // Fetch rooms for hotel (paginado)
  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDeleteError(null);
    setDeleteSuccess(null);
    try {
      const baseUrl = getApiBaseUrl();
      let url = `${baseUrl}/api/hotels/${hotelId}/rooms?page=${currentPage}&size=${pageSize}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${response.statusText || 'Could not fetch rooms'}. Body: ${errorBody}`);
      }
      const data = await response.json();
      // Soporta respuesta paginada y array directo
      if (Array.isArray(data)) {
        setRooms(data);
        setTotalElements(data.length);
        setCurrentPage(0);
        setPageSize(data.length);
      } else {
        setRooms(data.content || []);
        setTotalElements(data.totalElements || 0);
        setCurrentPage(data.number || 0);
        setPageSize(data.size || 25);
      }
    } catch (err) {
      setError(err.message || 'Could not load room list.');
      setRooms([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [hotelId, currentPage, pageSize]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handlePaginationChange = ({ page, pageSize: newPageSize }) => {
    const newRequestedPage = page - 1;
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setCurrentPage(0);
    } else if (newRequestedPage !== currentPage) {
      setCurrentPage(newRequestedPage);
    }
  };

  // Selección exclusiva tipo radio
  const handleRowCheckboxChange = (rowId) => {
    setSelectedRows(prevSelectedRows => {
      if (prevSelectedRows.has(rowId)) {
        return new Set();
      }
      return new Set([rowId]);
    });
  };
  const isRowSelected = (rowId) => selectedRows.has(rowId);

  // --- Funciones para el borrado ---
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
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/rooms/${roomToDeleteId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${response.statusText || 'Could not delete room'}. Body: ${errorBody}`);
      }
      setDeleteSuccess('Room deleted successfully.');
      closeDeleteModal();
      setSelectedRows(prev => {
        const newSelected = new Set(prev);
        newSelected.delete(roomToDeleteId);
        return newSelected;
      });
      fetchRooms();
    } catch (err) {
      setDeleteError(err.message || 'Could not delete room. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  // --- Fin de funciones para el borrado ---

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: 'center', color: '#3751ff', marginBottom: '10px' }}>Rooms for Hotel {hotelId}</h2>
      <p style={{ fontSize: '0.875rem', color: '#555', marginBottom: '20px', textAlign: 'center' }}>
        Below you will find the list of rooms for this hotel. To create a new room select "Create New Room". To view or edit the details of a room, select the corresponding row and click on "View/Edit Room". To delete a room, select a row and click "Delete Room".
      </p>
      <div style={headerButtonContainerStyle}>
        <div />
        <Link to={`/hotels/${hotelId}/rooms/new`} style={{ textDecoration: 'none' }}>
          <Button kind="primary" renderIcon={AddFilled}>Create New Room</Button>
        </Link>
      </div>
      <div style={tableTitleContainerStyle}>
        <h3>List of Rooms ({totalElements})</h3>
        <div>
          <Button
            kind="secondary"
            style={actionButtonStyle}
            disabled={selectedRows.size !== 1}
            onClick={() => {
              if (selectedRows.size === 1) {
                const selectedRoomId = Array.from(selectedRows)[0];
                navigate(`/rooms/edit/${selectedRoomId}`);
              }
            }}
          >
            View/Edit Room
          </Button>
          <Button
            kind="danger"
            renderIcon={TrashCan}
            style={actionButtonStyle}
            disabled={selectedRows.size !== 1}
            onClick={openDeleteModal}
          >
            Delete Room
          </Button>
        </div>
      </div>
      {loading && <Loading description="Loading rooms..." withOverlay={false} style={{ marginTop: '2rem' }} />}
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
        <DataTable rows={tableRows} headers={dataTableHeaders}>
          {({ rows: dtRows, headers: dtHeaders, getHeaderProps, getRowProps, getTableProps }) => (
            <TableContainer style={{ background: '#fff' }}>
              <Table {...getTableProps()} size="md" useZebraStyles={false}>
                <TableHead>
                  <TableRow>
                    {dtHeaders.map((header) => {
                      const { key, ...restOfHeaderProps } = getHeaderProps({ header });
                      return (
                        <TableHeader
                          key={key}
                          {...restOfHeaderProps}
                          style={header.style}
                        >
                          {header.header === 'select' ? '' : header.header}
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
                          <TableCell key={cell.id}>{cell.value !== null && cell.value !== undefined ? cell.value.toString() : 'N/A'}</TableCell>
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
      <Modal
        open={showDeleteModal}
        onRequestClose={closeDeleteModal}
        onRequestSubmit={handleDeleteConfirm}
        modalHeading="Confirm Deletion"
        primaryButtonText="YES"
        secondaryButtonText="NO"
        danger
      >
        <p>You are about to delete this room. This action is irreversible. Are you sure?</p>
      </Modal>
    </div>
  );
}

export default RoomList; 