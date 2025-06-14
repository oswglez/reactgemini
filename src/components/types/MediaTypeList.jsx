import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loading,
  InlineNotification,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Modal,
  Pagination
} from '@carbon/react';
import { AddFilled, Edit, TrashCan } from '@carbon/icons-react';
import { getApiBaseUrl } from '../../services/config';

// Styles
const containerStyle = {
  marginTop: '1rem',
  width: '100%',
  padding: '20px',
  backgroundColor: '#f9f9f9'
};

const actionButtonStyle = { marginRight: '0.5rem' };
const headerButtonContainerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px'
};
const tableTitleContainerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem'
};

function MediaTypeList() {
  const navigate = useNavigate();
  const [mediaTypes, setMediaTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [totalElements, setTotalElements] = useState(0);

  // Delete Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [typeToDeleteId, setTypeToDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);

  // Fetch Media Types
  const fetchMediaTypes = useCallback(async (page, size) => {
    setLoading(true);
    setError(null);
    setDeleteError(null);
    setDeleteSuccess(null);

    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/mediaType?page=${page}&size=${size}`);
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText || 'Could not fetch media types'}`);
      }
      const data = await response.json();
      
      const mappedTypes = (data.content || []).map(type => ({
        id: type.mediaTypeId.toString(),
        mediaTypeId: type.mediaTypeId,
        mediaTypeName: type.mediaTypeName,
        mediaTypeDescription: type.mediaTypeDescription
      }));

      setMediaTypes(mappedTypes);
      setTotalElements(data.totalElements || 0);
      setCurrentPage(data.number || 0);
      setPageSize(data.size || 25);
    } catch (err) {
      setError(err.message || 'Could not load media type list.');
      console.error('Error fetching media types:', err);
      setMediaTypes([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMediaTypes(currentPage, pageSize);
  }, [fetchMediaTypes, currentPage, pageSize]);

  // Pagination Handlers
  const handlePaginationChange = ({ page, pageSize: newPageSize }) => {
    const newRequestedPage = page - 1;
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setCurrentPage(0);
    } else if (newRequestedPage !== currentPage) {
      setCurrentPage(newRequestedPage);
    }
  };

  // Delete Handlers
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
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/mediaType/${typeToDeleteId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${errorBody || 'Could not delete media type'}`);
      }

      setDeleteSuccess('Media type deleted successfully.');
      closeDeleteModal();
      setSelectedRows(new Set());
      fetchMediaTypes(currentPage, pageSize);

    } catch (err) {
      console.error('Error deleting media type:', err);
      setDeleteError(err.message || 'Could not delete media type. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: 'center', color: '#3751ff', marginBottom: '10px' }}>Manage Media Types</h2>
      <p style={{ fontSize: '0.875rem', color: '#555', marginBottom: '20px', textAlign: 'center' }}>
        View and manage all media types available in the system.
        You can create new types, view/edit existing ones, or delete them.
      </p>

      <div style={headerButtonContainerStyle}>
        <div />
        <Link to="/types/media/new" style={{ textDecoration: 'none' }}>
          <Button kind="primary" renderIcon={AddFilled}>Create New Media Type</Button>
        </Link>
      </div>

      <div style={tableTitleContainerStyle}>
        <h3>List of Media Types ({totalElements})</h3>
        <div>
          <Button
            kind="secondary"
            renderIcon={Edit}
            style={actionButtonStyle}
            disabled={selectedRows.size !== 1}
            onClick={() => {
              if (selectedRows.size === 1) {
                const selectedType = mediaTypes.find(t => t.id === Array.from(selectedRows)[0]);
                navigate(`/types/media/edit/${selectedType.mediaTypeId}`);
              }
            }}
          >
            Edit Type
          </Button>
          <Button
            kind="danger"
            renderIcon={TrashCan}
            style={actionButtonStyle}
            disabled={selectedRows.size !== 1}
            onClick={openDeleteModal}
          >
            Delete Type
          </Button>
        </div>
      </div>

      {loading && <Loading description="Loading media types..." withOverlay={false} style={{ marginTop: '2rem' }} />}
      
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
        <TableContainer>
          <Table size="lg" useZebraStyles={false}>
            <TableHead>
              <TableRow>
                <TableHeader />
                <TableHeader>ID</TableHeader>
                <TableHeader>Name</TableHeader>
                <TableHeader>Description</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {mediaTypes.map((type) => (
                <TableRow key={type.id} selected={selectedRows.has(type.id)}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(type.id)}
                      onChange={() => {
                        setSelectedRows(prevSelectedRows => {
                          // If the clicked row is already selected, deselect it
                          if (prevSelectedRows.has(type.id)) {
                            return new Set();
                          }
                          // Otherwise, select only the clicked row
                          return new Set([type.id]);
                        });
                      }}
                    />
                  </TableCell>
                  <TableCell>{type.mediaTypeId}</TableCell>
                  <TableCell>{type.mediaTypeName}</TableCell>
                  <TableCell>{type.mediaTypeDescription}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {totalElements > 0 && mediaTypes.length > 0 && (
        <Pagination
          totalItems={totalElements}
          pageSize={pageSize}
          pageSizes={[10, 25, 50, 100]}
          page={currentPage + 1}
          onChange={handlePaginationChange}
          style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onRequestClose={closeDeleteModal}
        onRequestSubmit={handleDeleteConfirm}
        modalHeading="Confirm Deletion"
        primaryButtonText="Delete"
        secondaryButtonText="Cancel"
        danger
      >
        <p>Are you sure you want to delete this media type? This action cannot be undone.</p>
      </Modal>
    </div>
  );
}

export default MediaTypeList; 