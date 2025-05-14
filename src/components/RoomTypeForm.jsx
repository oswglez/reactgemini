// src/components/RoomTypeForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableToolbar,
  TableToolbarContent,
  Modal,
  TextInput,
  Loading,
  InlineNotification,
  IconButton,
} from '@carbon/react';
import { Add, TrashCan } from '@carbon/icons-react';

// Table Headers
const headers = [
  { key: 'name', header: 'Name' }, // We'll map roomTypeName to 'name' in state
  { key: 'actions', header: 'Actions' },
];

// Initial state for the Add/Edit modal input
const initialNewTypeName = '';

function RoomTypeForm() {
  const [roomTypes, setRoomTypes] = useState([]); // Holds the list from API
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState(initialNewTypeName);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null); // Stores { id, roomTypeId, name }
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  // --- Fetch Initial Data ---
  const fetchTypes = useCallback(async () => {
    setIsLoadingList(true);
    setListError(null);
    try {
      const response = await fetch('http://localhost:8090/api/roomType'); // GET endpoint
      if (!response.ok)
        throw new Error(`Error ${response.status}: Could not load room types`);
      const data = await response.json();
      // Map API response to state structure needed by DataTable and delete action
      // *** VERIFY 'roomTypeId' and 'roomTypeName' are correct API field names ***
      setRoomTypes(
        (data || []).map((type) => ({
          id: type.roomTypeId.toString(), // Unique string ID for DataTable row key
          roomTypeId: type.roomTypeId, // Actual numeric ID for API calls
          name: type.roomTypeName, // Name for display and potentially POST/PUT
        }))
      );
    } catch (err) {
      console.error('Error fetching room types:', err);
      setListError(err.message || 'Failed to load types');
      setRoomTypes([]);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  // --- Modal Handlers ---
  const handleOpenAddModal = () => {
    setNewTypeName(initialNewTypeName);
    setModalError(null);
    setIsAddModalOpen(true);
  };
  const handleOpenDeleteModal = (type) => {
    setTypeToDelete(type);
    setModalError(null);
    setIsDeleteModalOpen(true);
  };
  const handleCloseModals = () => {
    setIsAddModalOpen(false);
    setIsDeleteModalOpen(false);
    setTypeToDelete(null);
    setNewTypeName(initialNewTypeName);
    setModalLoading(false);
    setModalError(null);
  };
  const handleNewTypeNameChange = (e) => {
    setNewTypeName(e.target.value);
    if (modalError) setModalError(null);
  };

  // --- CRUD Handlers ---
  const handleSaveNewType = async () => {
    if (!newTypeName.trim()) {
      setModalError('Type name cannot be empty.');
      return;
    }
    setModalLoading(true);
    setModalError(null);
    // *** VERIFY backend expects 'roomTypeName' in payload ***
    const payload = { roomTypeName: newTypeName };
    const apiUrl = 'http://localhost:8090/api/roomType'; // POST endpoint

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        /* ... error handling ... */
        let errorMsg = `Error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || JSON.stringify(errorData);
        } catch (err) {
          errorMsg += `: ${response.statusText || 'Failed to create type'}`;
        }
        throw new Error(errorMsg);
      }
      handleCloseModals();
      fetchTypes(); // Close modal and refresh list on success
    } catch (err) {
      console.error('Error saving new room type:', err);
      setModalError(err.message || 'Could not save room type.');
      setModalLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!typeToDelete || !typeToDelete.roomTypeId) return; // Use correct ID field
    setModalLoading(true);
    setModalError(null);
    // *** VERIFY 'roomTypeId' is correct for DELETE URL ***
    const apiUrl = `http://localhost:8090/api/roomType/${typeToDelete.roomTypeId}`;

    try {
      const response = await fetch(apiUrl, { method: 'DELETE' });
      if (!response.ok && response.status !== 404) {
        /* ... error handling ... */
        let errorMsg = `Error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || JSON.stringify(errorData);
        } catch (err) {
          errorMsg += `: ${response.statusText || 'Failed to delete type'}`;
        }
        throw new Error(errorMsg);
      }
      handleCloseModals();
      fetchTypes(); // Close modal and refresh list on success
    } catch (err) {
      console.error('Error deleting room type:', err);
      setModalError(err.message || 'Could not delete room type.');
      setModalLoading(false);
    }
  };

  return (
    <div>
      <h3>Manage Room Types</h3>
      {/* Toolbar */}
      <TableToolbar>
        {' '}
        <TableToolbarContent>
          {' '}
          <Button
            onClick={handleOpenAddModal}
            renderIcon={Add}
            kind="primary"
            size="sm"
          >
            {' '}
            Add Room Type{' '}
          </Button>{' '}
        </TableToolbarContent>{' '}
      </TableToolbar>
      {/* Loading / Error for list */}
      {isLoadingList && (
        <Loading description="Loading room types..." withOverlay={false} />
      )}
      {!isLoadingList && listError && (
        <InlineNotification
          kind="error"
          title="Error Loading List"
          subtitle={listError}
          onClose={() => setListError(null)}
          lowContrast
          style={{ marginBottom: '1rem' }}
        />
      )}
      {/* Data Table */}
      {!isLoadingList && !listError && (
        <DataTable
          rows={roomTypes}
          headers={headers} /* ...other DataTable props... */
        >
          {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
            <TableContainer>
              {' '}
              <Table {...getTableProps()}>
                <TableHead>
                  {' '}
                  <TableRow>
                    {' '}
                    {headers.map((header) => (
                      <TableHeader {...getHeaderProps({ header })}>
                        {' '}
                        {header.header}{' '}
                      </TableHeader>
                    ))}{' '}
                  </TableRow>{' '}
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow {...getRowProps({ row })}>
                      {row.cells.map((cell) => (
                        <TableCell key={cell.id}>
                          {cell.info.header === 'actions' ? (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              {/* Edit button disabled */}
                              {/* <Button kind="ghost" size="sm" disabled title="Edit (disabled)"> Edit </Button> */}
                              <IconButton
                                kind="danger--ghost"
                                label="Delete"
                                iconDescription="Delete Room Type"
                                renderIcon={TrashCan}
                                size="sm"
                                onClick={() => {
                                  const typeData = roomTypes.find(
                                    (t) => t.id === row.id
                                  );
                                  if (typeData) handleOpenDeleteModal(typeData);
                                }}
                              />
                            </div>
                          ) : (
                            cell.value /* Shows 'name' property */
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>{' '}
            </TableContainer>
          )}
        </DataTable>
      )}
      {/* Add Modal */}
      <Modal
        open={isAddModalOpen}
        onRequestClose={handleCloseModals}
        onRequestSubmit={handleSaveNewType}
        modalHeading="Add New Room Type"
        primaryButtonText="Add"
        secondaryButtonText="Cancel"
        primaryButtonDisabled={modalLoading || !newTypeName.trim()}
        preventCloseOnClickOutside
      >
        {modalError && (
          <InlineNotification
            lowContrast
            kind="error"
            title="Error"
            subtitle={modalError}
            style={{ marginBottom: '1rem' }}
            onClose={() => setModalError(null)}
          />
        )}
        <TextInput
          id="new-room-type-name"
          name="newTypeName"
          labelText="Type Name (Required)"
          value={newTypeName}
          onChange={handleNewTypeNameChange}
          placeholder="e.g., PENTHOUSE"
          disabled={modalLoading}
          invalid={!!modalError && !newTypeName.trim()}
          invalidText={
            modalError && !newTypeName.trim() ? 'Name cannot be empty.' : null
          }
          light
        />
        {modalLoading && (
          <Loading small description="Saving..." withOverlay={false} />
        )}
      </Modal>
      {/* Delete Modal */}
      <Modal
        danger
        open={isDeleteModalOpen}
        onRequestClose={handleCloseModals}
        onRequestSubmit={handleConfirmDelete}
        modalHeading="Confirm Deletion"
        primaryButtonText="Delete"
        secondaryButtonText="Cancel"
        primaryButtonDisabled={modalLoading}
        preventCloseOnClickOutside
      >
        {modalError && (
          <InlineNotification
            lowContrast
            kind="error"
            title="Error"
            subtitle={modalError}
            style={{ marginBottom: '1rem' }}
            onClose={() => setModalError(null)}
          />
        )}
        <p>
          Are you sure you want to delete the room type:{' '}
          <strong>{typeToDelete?.name}</strong> (ID: {typeToDelete?.roomTypeId}
          )?
        </p>
        <p style={{ color: '#da1e28', marginTop: '0.5rem' }}>
          This action cannot be undone.
        </p>
        {modalLoading && (
          <Loading small description="Deleting..." withOverlay={false} />
        )}
      </Modal>
    </div>
  );
}
export default RoomTypeForm;
