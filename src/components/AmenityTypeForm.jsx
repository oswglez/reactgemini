// src/components/AmenityTypeForm.jsx
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
    IconButton
} from '@carbon/react';
import { Add, TrashCan } from '@carbon/icons-react';

// Definición de las cabeceras para la DataTable
// Mantenemos 'name' como key porque nuestro estado interno usará 'name'
const headers = [
    { key: 'name', header: 'Name' },
    { key: 'actions', header: 'Actions' },
];

function AmenityTypeForm() {
    const [amenityTypes, setAmenityTypes] = useState([]);
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [listError, setListError] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newTypeName, setNewTypeName] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [typeToDelete, setTypeToDelete] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState(null);

    // --- Carga Inicial de Datos ---
    const fetchTypes = useCallback(async () => {
        setIsLoadingList(true);
        setListError(null);
        try {
            const response = await fetch('http://localhost:8090/api/amenityType'); // GET endpoint
            if (!response.ok) {
                throw new Error(`Error ${response.status}: Could not load amenity types`);
            }
            const data = await response.json();
            // *** CORRECCIÓN AQUÍ: Usar amenityTypeName de la API ***
            setAmenityTypes((data || []).map(type => ({
                id: type.amenityTypeId.toString(), // ID para key React (string)
                amenityTypeId: type.amenityTypeId, // ID numérico real para API DELETE
                name: type.amenityTypeName // <-- Usar el campo correcto de la API
            })));
            // ****************************************************
        } catch (err) {
            console.error("Error fetching amenity types:", err);
            setListError(err.message || 'Failed to load types');
            setAmenityTypes([]);
        } finally {
            setIsLoadingList(false);
        }
    }, []);

    useEffect(() => {
        fetchTypes();
    }, [fetchTypes]);

    // --- Handlers para Modales (sin cambios en lógica interna) ---
    const handleOpenAddModal = () => { setNewTypeName(''); setModalError(null); setIsAddModalOpen(true); };
    const handleOpenDeleteModal = (type) => { setTypeToDelete(type); setModalError(null); setIsDeleteModalOpen(true); };
    const handleCloseModals = () => { setIsAddModalOpen(false); setIsDeleteModalOpen(false); setTypeToDelete(null); setNewTypeName(''); setModalLoading(false); setModalError(null); };
    const handleNewTypeNameChange = (e) => { setNewTypeName(e.target.value); if (modalError) setModalError(null); };

    // --- Handlers para Acciones CRUD ---
    const handleSaveNewType = async () => {
        if (!newTypeName.trim()) { setModalError('Type name cannot be empty.'); return; }
        setModalLoading(true); setModalError(null);

        // *** CORRECCIÓN AQUÍ: Usar amenityTypeName en el payload ***
        const payload = { amenityTypeName: newTypeName }; // <-- Usar la clave que espera el backend
        // ****************************************************
        const apiUrl = 'http://localhost:8090/api/amenityType'; // POST endpoint

        console.log(`Sending Payload to ${apiUrl}:`, JSON.stringify(payload, null, 2)); // Log para depurar

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) { /* ... manejo de error ... */
                let errorMsg = `Error ${response.status}`;
                try { const errorData = await response.json(); errorMsg = errorData.message || JSON.stringify(errorData); }
                catch(err) { errorMsg += `: ${response.statusText || 'Failed to create type'}`; }
                throw new Error(errorMsg);
            }
            handleCloseModals(); fetchTypes(); // Recargar lista al éxito
        } catch (err) { console.error("Error saving new amenity type:", err); setModalError(err.message || "Could not save amenity type."); setModalLoading(false); }
    };

    const handleConfirmDelete = async () => {
        if (!typeToDelete || !typeToDelete.amenityTypeId) return;
        setModalLoading(true); setModalError(null);
        // Usa amenityTypeId para la URL DELETE
        const apiUrl = `http://localhost:8090/api/amenityType/${typeToDelete.amenityTypeId}`;

        try {
            const response = await fetch(apiUrl, { method: 'DELETE' });
            if (!response.ok && response.status !== 404) { /* ... manejo de error ... */
                 let errorMsg = `Error ${response.status}`;
                 try { const errorData = await response.json(); errorMsg = errorData.message || JSON.stringify(errorData); }
                 catch(err) { errorMsg += `: ${response.statusText || 'Failed to delete type'}`; }
                 throw new Error(errorMsg);
            }
            handleCloseModals(); fetchTypes(); // Recargar lista al éxito
        } catch(err) { console.error("Error deleting amenity type:", err); setModalError(err.message || "Could not delete amenity type."); setModalLoading(false); }
    };


    return (
        <div>
            <h3>Manage Amenity Types</h3>
            <TableToolbar> <TableToolbarContent> <Button onClick={handleOpenAddModal} renderIcon={Add} iconDescription="Add Type" kind="primary" size="sm"> Add Amenity Type </Button> </TableToolbarContent> </TableToolbar>
            {isLoadingList && <Loading description="Loading amenity types..." withOverlay={false} />}
            {!isLoadingList && listError && <InlineNotification kind="error" title="Error Loading List" subtitle={listError} onClose={() => setListError(null)} lowContrast style={{ marginBottom: '1rem'}} />}
            {!isLoadingList && !listError && (
                <DataTable rows={amenityTypes} headers={headers}>
                    {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
                        <TableContainer>
                            <Table {...getTableProps()}>
                                <TableHead> <TableRow> {headers.map((header) => ( <TableHeader {...getHeaderProps({ header })}> {header.header} </TableHeader> ))} </TableRow> </TableHead>
                                <TableBody>
                                    {rows.map((row) => (
                                        <TableRow {...getRowProps({ row })}>
                                            {row.cells.map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {cell.info.header === 'actions' ? (
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            {/* Edit Button Disabled */}
                                                            {/* <Button kind="ghost" size="sm" disabled title="Edit (disabled)"> Edit </Button> */}
                                                            <IconButton
                                                                kind="danger--ghost" label="Delete" iconDescription="Delete Amenity Type"
                                                                renderIcon={TrashCan} size="sm"
                                                                onClick={() => { const typeData = amenityTypes.find(t => t.id === row.id); if (typeData) handleOpenDeleteModal(typeData); }}
                                                            />
                                                        </div>
                                                    ) : ( cell.value /* Muestra la propiedad 'name' de nuestro estado */ )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DataTable>
            )}

             {/* Add Modal */}
             <Modal
                open={isAddModalOpen} onRequestClose={handleCloseModals} onRequestSubmit={handleSaveNewType}
                modalHeading="Add New Amenity Type" primaryButtonText="Add" secondaryButtonText="Cancel"
                primaryButtonDisabled={modalLoading || !newTypeName.trim()} preventCloseOnClickOutside >
                {modalError && <InlineNotification lowContrast kind="error" title="Error" subtitle={modalError} style={{marginBottom:'1rem'}} onClose={()=>setModalError(null)} /> }
                <TextInput
                    id="new-amenity-type-name" name="newTypeName" labelText="Type Name (Required)"
                    value={newTypeName} onChange={handleNewTypeNameChange} placeholder="e.g., POOL"
                    disabled={modalLoading} invalid={!!modalError && !newTypeName.trim()}
                    invalidText={modalError && !newTypeName.trim() ? modalError : "Name cannot be empty."}
                    light />
                {modalLoading && <Loading small description="Saving..." withOverlay={false} />}
             </Modal>

             {/* Delete Modal */}
            <Modal
                danger open={isDeleteModalOpen} onRequestClose={handleCloseModals} onRequestSubmit={handleConfirmDelete}
                modalHeading="Confirm Deletion" primaryButtonText="Delete" secondaryButtonText="Cancel"
                primaryButtonDisabled={modalLoading} preventCloseOnClickOutside >
                {modalError && <InlineNotification lowContrast kind="error" title="Error" subtitle={modalError} style={{marginBottom:'1rem'}} onClose={()=>setModalError(null)} /> }
                {/* Usamos typeToDelete.name que viene de nuestro objeto de estado mapeado */}
                <p>Are you sure you want to delete the amenity type: <strong>{typeToDelete?.name}</strong> (ID: {typeToDelete?.amenityTypeId})?</p>
                <p style={{color:'#da1e28', marginTop:'0.5rem'}}>This action cannot be undone.</p>
                {modalLoading && <Loading small description="Deleting..." withOverlay={false} />}
            </Modal>
        </div>
    );
}

export default AmenityTypeForm;