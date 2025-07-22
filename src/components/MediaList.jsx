import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Button,
  InlineNotification,
  Loading,
  Tag,
  Search,
  Pagination,
  ComposedModal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@carbon/react';
import { Add, Edit, TrashCan, View } from '@carbon/icons-react';
import { useAuthenticatedFetch } from '../services/apiService';
import './MediaList.css';

const headers = [
  { key: 'mediaCode', header: 'Code' },
  { key: 'mediaType', header: 'Type' },
  { key: 'mediaDescription', header: 'Description' },
  { key: 'mediaUrl', header: 'URL' },
  { key: 'actions', header: 'Actions' },
];

function MediaList() {
  const navigate = useNavigate();
  const authenticatedFetch = useAuthenticatedFetch();
  
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadMedia();
  }, [currentPage, pageSize]);

  const loadMedia = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch('/medias');
      if (response.ok) {
        const data = await response.json();
        setMediaList(data);
      } else {
        throw new Error('Failed to load media');
      }
    } catch (err) {
      setError('Error loading media: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (!mediaToDelete) return;
    
    setDeleting(true);
    try {
      const response = await authenticatedFetch(`/medias/${mediaToDelete.mediaId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setMediaList(prev => prev.filter(media => media.mediaId !== mediaToDelete.mediaId));
        setDeleteModalOpen(false);
        setMediaToDelete(null);
      } else {
        throw new Error('Failed to delete media');
      }
    } catch (err) {
      setError('Error deleting media: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteModal = (media) => {
    setMediaToDelete(media);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setMediaToDelete(null);
  };

  const filteredMedia = mediaList.filter(media =>
    media.mediaDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    media.mediaType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    media.mediaCode?.toString().includes(searchTerm)
  );

  const paginatedMedia = filteredMedia.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const rows = paginatedMedia.map(media => ({
    id: media.mediaId,
    mediaCode: media.mediaCode,
    mediaType: (
      <Tag type={media.mediaType === 'IMAGE' ? 'blue' : 'green'} size="sm">
        {media.mediaType}
      </Tag>
    ),
    mediaDescription: media.mediaDescription,
    mediaUrl: (
      <a 
        href={media.mediaUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="media-url-link"
      >
        {media.mediaUrl}
      </a>
    ),
    actions: (
      <div className="action-buttons">
        <Button
          kind="ghost"
          size="sm"
          iconDescription="View media"
          onClick={() => window.open(media.mediaUrl, '_blank')}
          hasIconOnly
        >
          <View size={16} />
        </Button>
        <Button
          kind="ghost"
          size="sm"
          iconDescription="Edit media"
          onClick={() => navigate(`/media/edit/${media.mediaId}`)}
          hasIconOnly
        >
          <Edit size={16} />
        </Button>
        <Button
          kind="ghost"
          size="sm"
          iconDescription="Delete media"
          onClick={() => openDeleteModal(media)}
          hasIconOnly
        >
          <TrashCan size={16} />
        </Button>
      </div>
    ),
  }));

  if (loading) {
    return (
      <div className="media-list-container">
        <Loading active description="Loading media..." />
      </div>
    );
  }

  return (
    <div className="media-list-container">
      <div className="media-list-content">
        {/* Header */}
        <div className="header-navigation">
          <Button 
            kind="tertiary" 
            onClick={() => navigate("/")}
            className="nav-button"
          >
            <span className="nav-icon">🏠</span>
            Home
          </Button>
          <h1 className="page-title">Media Management</h1>
          <Button
            kind="primary"
            renderIcon={Add}
            onClick={() => navigate('/media/new')}
            className="add-button"
          >
            Add Media
          </Button>
        </div>

        {/* Error Notification */}
        {error && (
          <InlineNotification
            kind="error"
            title="Error"
            subtitle={error}
            onClose={() => setError(null)}
            style={{ marginBottom: '1rem' }}
          />
        )}

        {/* Search and Filters */}
        <div className="search-section">
          <Search
            placeholder="Search media by description, type, or code..."
            value={searchTerm}
            onChange={handleSearch}
            size="lg"
          />
        </div>

        {/* Data Table */}
        <div className="table-section">
          <DataTable rows={rows} headers={headers}>
            {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {headers.map(header => (
                      <TableHeader {...getHeaderProps({ header })}>
                        {header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map(row => (
                    <TableRow {...getRowProps({ row })}>
                      {row.cells.map(cell => (
                        <TableCell key={cell.id}>{cell.value}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DataTable>
        </div>

        {/* Pagination */}
        {filteredMedia.length > pageSize && (
          <div className="pagination-section">
            <Pagination
              page={currentPage}
              pageSize={pageSize}
              pageSizes={[10, 20, 50]}
              totalItems={filteredMedia.length}
              onChange={({ page, pageSize }) => {
                setCurrentPage(page);
                setPageSize(pageSize);
              }}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ComposedModal
        open={deleteModalOpen}
        onClose={closeDeleteModal}
        preventCloseOnClickOutside={false}
        size="sm"
      >
        <ModalHeader title="Delete Media" closeModal={closeDeleteModal} />
        <ModalBody>
          <p>Are you sure you want to delete this media?</p>
          {mediaToDelete && (
            <div className="delete-preview">
              <p><strong>Code:</strong> {mediaToDelete.mediaCode}</p>
              <p><strong>Type:</strong> {mediaToDelete.mediaType}</p>
              <p><strong>Description:</strong> {mediaToDelete.mediaDescription}</p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" onClick={closeDeleteModal}>
            Cancel
          </Button>
          <Button 
            kind="danger" 
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </ModalFooter>
      </ComposedModal>
    </div>
  );
}

export default MediaList; 