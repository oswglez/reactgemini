// src/components/AmenityList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loading,
  InlineNotification,
  Button,
  RadioButton,
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
  Search,
  Grid,
  Column,
  Dropdown
} from '@carbon/react';
import { AddFilled, Edit, TrashCan, Search as SearchIcon, Filter, Home, View, ArrowLeft, Close } from '@carbon/icons-react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiService } from '../services/apiService';
import './AmenityList.css';

function AmenityList() {
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();
  
  // Data states
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAmenity, setSelectedAmenity] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [totalElements, setTotalElements] = useState(0);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAmenityType, setSelectedAmenityType] = useState(null);
  const [amenityTypes, setAmenityTypes] = useState([]);
  
  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [amenityToDeleteId, setAmenityToDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);
  
  // User role and permissions states
  const [userRoleInfo, setUserRoleInfo] = useState(null);
  const [loadingUserInfo, setLoadingUserInfo] = useState(true);

  // DataTable headers for Lovable design
  const dataTableHeaders = [
    { key: 'select', header: '', isSortable: false, style: { width: '60px' } },
    { key: 'amenityName', header: 'Amenity Name', isSortable: true, style: { width: '200px' } },
    { key: 'category', header: 'Category', isSortable: true, style: { width: '150px' } },
    { key: 'status', header: 'Status', isSortable: true, style: { width: '120px' } },
    { key: 'actions', header: 'Actions', isSortable: false, style: { width: '120px' } },
  ];

  // Transform amenities data for Lovable design
  const transformAmenityData = (amenity) => {
    // Generate a random status for demo purposes (in real app, this would come from backend)
    const statuses = ['Available', 'Not Available'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Map amenity types to categories
    const categoryMap = {
      'HOTEL_SERVICES': 'Service',
      'GENERAL_FACILITIES': 'General',
      'ROOM_SERVICES': 'Room',
      'DINING': 'Dining',
      'RECREATION': 'Recreation',
      'WELLNESS': 'Wellness',
      'BUSINESS': 'Business',
      'ACCESSIBILITY': 'Accessibility'
    };
    
    return {
      id: amenity.amenityId.toString(),
      amenityId: amenity.amenityId,
      amenityName: amenity.amenityDescription || amenity.amenityCode,
      category: categoryMap[amenity.amenityType] || amenity.amenityType,
      status: status,
      amenityCode: amenity.amenityCode,
      amenityDescription: amenity.amenityDescription,
      amenityType: amenity.amenityType,
    };
  };

  // Use amenities directly since filtering is now handled in fetchAmenities
  const filteredAmenities = amenities;
  
  const tableRows = filteredAmenities.map(transformAmenityData);

  // Get user role information
  const getUserRoleInfo = async () => {
    try {
      console.log('🔍 Fetching user role info for amenities...');
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

  // Fetch amenity types for filter
  const fetchAmenityTypes = useCallback(async () => {
    try {
      const data = await apiService.amenityTypes.getAll(0, 100, getAccessTokenSilently);
      const items = (data.content || data || []).map(type => ({
        id: type.amenityTypeName || type.amenity_types_name,
        text: type.amenityTypeName || type.amenity_types_name
      }));
      setAmenityTypes(items);
    } catch (err) {
      console.error('Error fetching amenity types:', err);
      setAmenityTypes([]);
    }
  }, [getAccessTokenSilently]);

  // Fetch amenities
  const fetchAmenities = useCallback(async (page, size) => {
    setLoading(true);
    setError(null);
    setDeleteError(null);
    setDeleteSuccess(null);

    try {
      let allAmenities = [];
      
      // Siempre obtener todos los amenities cuando hay búsqueda o filtro de tipo
      if (selectedAmenityType || searchTerm) {
        const allData = await apiService.amenities.getAll(0, 1000, getAccessTokenSilently);
        allAmenities = allData.content || [];
        
        // Filtrar por tipo si está seleccionado
        if (selectedAmenityType) {
          allAmenities = allAmenities.filter(amenity => 
            amenity.amenityType === selectedAmenityType
          );
        }
        
        // Filtrar por búsqueda si hay término de búsqueda
        if (searchTerm) {
          allAmenities = allAmenities.filter(amenity => 
            amenity.amenityCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            amenity.amenityDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
            amenity.amenityType.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
      } else {
        // Sin filtros: Usar paginación normal del backend
        const data = await apiService.amenities.getAll(page, size, getAccessTokenSilently);
        allAmenities = (data.content || []).map(amenity => {
          console.log('=== AMENITY DATA ===');
          console.log('Amenity ID:', amenity.amenityId);
          console.log('Amenity Code:', amenity.amenityCode);
          console.log('Amenity Description:', amenity.amenityDescription);
          console.log('Amenity Type:', amenity.amenityType);
          console.log('=== END AMENITY DATA ===');
          return amenity;
        });
      }

      // Aplicar paginación a los datos filtrados/completos
      const startIndex = page * size;
      const endIndex = startIndex + size;
      const paginatedAmenities = allAmenities.slice(startIndex, endIndex);
      
      setAmenities(paginatedAmenities);
      setTotalElements(allAmenities.length);
      setCurrentPage(page);
      setPageSize(size);
    } catch (err) {
      const errorMessage = err.message || 'Could not load amenities list.';
      setError(errorMessage);
      console.error('Error fetching amenities:', err);
      setAmenities([]);
      setTotalElements(0);
      
      // Clear any existing selection when there's an error
      setSelectedAmenity(null);
    } finally {
      setLoading(false);
    }
  }, [getAccessTokenSilently, selectedAmenityType, searchTerm]);

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

  // Row selection handlers (single selection for Lovable design)
  const handleRowSelection = (rowId) => {
    const amenity = amenities.find(a => a.amenityId.toString() === rowId);
    setSelectedAmenity(amenity);
  };

  // Delete handlers
  const openDeleteModal = (amenityId) => {
    setAmenityToDeleteId(amenityId);
    setShowDeleteModal(true);
    setDeleteError(null);
    setDeleteSuccess(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setAmenityToDeleteId(null);
    setDeleteError(null);
    setDeleteSuccess(null);
  };

  const handleDeleteConfirm = async () => {
    if (!amenityToDeleteId) return;
    
    setLoading(true);
    setDeleteError(null);
    setDeleteSuccess(null);
    
    try {
      await apiService.amenities.delete(amenityToDeleteId, getAccessTokenSilently);
      setDeleteSuccess('Amenity deleted successfully!');
      setSelectedAmenity(null);
      
      // Refresh the list
      setTimeout(() => {
        fetchAmenities(currentPage, pageSize);
        closeDeleteModal();
      }, 1000);
    } catch (err) {
      setDeleteError(err.message || 'Error deleting amenity');
      console.error('Error deleting amenity:', err);
    } finally {
      setLoading(false);
    }
  };

  // Search handler
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(0); // Reset to first page when searching
  };

  // Filter handler
  const handleFilterChange = ({ selectedItem }) => {
    setSelectedAmenityType(selectedItem ? selectedItem.id : null);
    setCurrentPage(0); // Reset to first page when filtering
  };

  // Clear all filters handler
  const handleClearFilters = () => {
    setSelectedAmenityType(null);
    setSearchTerm('');
    setCurrentPage(0);
  };

  // Initialize data
  useEffect(() => {
    getUserRoleInfo();
    fetchAmenityTypes();
  }, [getAccessTokenSilently]);

  useEffect(() => {
    if (!loadingUserInfo) {
      fetchAmenities(currentPage, pageSize);
    }
  }, [fetchAmenities, currentPage, pageSize, loadingUserInfo]);

  if (loadingUserInfo) {
    return (
      <div className="loading-container">
        <Loading description="Loading user permissions..." withOverlay={false} />
      </div>
    );
  }

  return (
    <div className="amenity-list-container">
      {/* Header Section */}
      <div className="header-section">
        <div className="header-content">
          <div className="header-text">
            <Link to="/" className="back-button">
              <Home size={14} className="back-icon" />
              Back to Home
            </Link>
            <h1 className="header-title">Hotel Amenities</h1>
            <p className="header-subtitle">View and manage your hotel amenities and their availability status</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-layout">
          {/* Detail View Area */}
          <div className="detail-view-area">
            <div className="detail-card">
              {selectedAmenity ? (
                <div className="amenity-details">
                  <div className="detail-header">
                    <h3 className="detail-title">Amenity Details</h3>
                    <div className="detail-header-actions">
                      {userRoleInfo.canEdit && (
                        <Button
                          kind="primary"
                          onClick={() => navigate(`/amenities/edit/${selectedAmenity.amenityId}`)}
                          className="header-action-button edit-button"
                        >
                          Edit
                        </Button>
                      )}
                      {userRoleInfo.canDelete && (
                        <Button
                          kind="danger"
                          onClick={() => openDeleteModal(selectedAmenity.amenityId)}
                          className="header-action-button mark-inactive-button"
                        >
                          Mark Inactive
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="detail-info">
                    <div className="detail-grid">
                      <div className="detail-field">
                        <span className="detail-label">Code:</span>
                        <span className="detail-value">{selectedAmenity.amenityCode}</span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">Category:</span>
                        <span className="detail-value">{selectedAmenity.amenityType}</span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">Amenity Name:</span>
                        <span className="detail-value">{selectedAmenity.amenityDescription || selectedAmenity.amenityCode}</span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">Status:</span>
                        <span className="detail-value">
                          <span className={`status-pill ${selectedAmenity.amenityStatus === 'ACTIVE' ? 'available' : 'not-available'}`}>
                            {selectedAmenity.amenityStatus === 'ACTIVE' ? 'Available' : 'Not Available'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-selection">
                  <p>Select an amenity to view its details</p>
                </div>
              )}
            </div>
          </div>

          {/* Amenities List Area */}
          <div className="amenities-list-area">
            {/* Available Amenities Header */}
            <div className="amenities-header">
              <h2 className="amenities-title">Available Amenities</h2>
              {userRoleInfo.canCreate && (
                <Link to="/amenities/new" style={{ textDecoration: 'none' }}>
                  <Button kind="primary" renderIcon={AddFilled} className="add-amenity-button">
                    + Add Amenity
                  </Button>
                </Link>
              )}
            </div>

            {/* Controls Section */}
            <div className="controls-section">
              <div className="search-filter-row">
                <div className="search-container">
                  <Search
                    size="md"
                    placeholder="Search amenities..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="search-input"
                  />
                </div>
                <div className="filter-container">
                  <Dropdown
                    id="amenityTypeFilter"
                    titleText="Filter by Type"
                    label="All Types"
                    items={amenityTypes}
                    itemToString={item => (item ? item.text : '')}
                    selectedItem={amenityTypes.find(opt => opt.id === selectedAmenityType) || null}
                    onChange={handleFilterChange}
                    className="filter-dropdown"
                  />
                </div>
                {(selectedAmenityType || searchTerm) && (
                  <div className="clear-filters-container">
                    <Button
                      kind="ghost"
                      size="sm"
                      renderIcon={Close}
                      onClick={handleClearFilters}
                      className="clear-filters-button"
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
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
                  <Loading description="Loading amenities..." withOverlay={false} />
                </div>
              )}

              {/* Data Table */}
              {!loading && !error && (
                <>
                  {filteredAmenities.length === 0 ? (
                    <div className="no-data">
                      <p>No amenities found.</p>
                      {userRoleInfo.canCreate && (
                        <Link to="/amenities/new" style={{ textDecoration: 'none' }}>
                          <Button kind="primary" renderIcon={AddFilled} className="create-button">
                            + Add Amenity
                          </Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <DataTable rows={tableRows} headers={dataTableHeaders} isSortable>
                      {({ rows: dtRows, headers: dtHeaders, getHeaderProps, getRowProps, getTableProps }) => (
                        <TableContainer>
                          <Table {...getTableProps()} size="md" useZebraStyles={false} className="amenity-table">
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
                                      {header.header}
                                    </TableHeader>
                                  );
                                })}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {dtRows.map((row) => (
                                <TableRow
                                  key={row.id}
                                  {...getRowProps({ row })}
                                  className={selectedAmenity?.amenityId.toString() === row.id ? 'selected-row' : ''}
                                  onClick={() => handleRowSelection(row.id)}
                                >
                                  {row.cells.map((cell) => {
                                    if (cell.id.includes('select')) {
                                      return (
                                        <TableCell key={cell.id}>
                                          <RadioButton
                                            id={`radio-${row.id}`}
                                            name="amenity-selection"
                                            checked={selectedAmenity?.amenityId.toString() === row.id}
                                            onChange={() => handleRowSelection(row.id)}
                                            className="row-radio"
                                          />
                                        </TableCell>
                                      );
                                    }
                                    if (cell.id.includes('status')) {
                                      const isAvailable = cell.value === 'Available';
                                      return (
                                        <TableCell key={cell.id} className="table-cell">
                                          <span className={`status-pill ${isAvailable ? 'available' : 'not-available'}`}>
                                            {cell.value}
                                          </span>
                                        </TableCell>
                                      );
                                    }
                                    if (cell.id.includes('actions')) {
                                      return (
                                        <TableCell key={cell.id} className="table-cell">
                                          <button
                                            className="view-details-link"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRowSelection(row.id);
                                            }}
                                          >
                                            View Details
                                          </button>
                                        </TableCell>
                                      );
                                    }
                                    return (
                                      <TableCell key={cell.id} className="table-cell">
                                        {cell.value}
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
                  {filteredAmenities.length > 0 && (
                    <div className="pagination-container">
                      <Pagination
                        page={currentPage + 1}
                        pageSize={pageSize}
                        pageSizes={[10, 25, 50, 100]}
                        totalItems={totalElements}
                        onChange={handlePaginationChange}
                        className="pagination"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        modalHeading="Delete Amenity"
        primaryButtonText="Delete"
        secondaryButtonText="Cancel"
        onRequestClose={closeDeleteModal}
        onRequestSubmit={handleDeleteConfirm}
        danger
        className="delete-modal"
      >
        <p>Are you sure you want to delete this amenity? This action cannot be undone.</p>
        {deleteError && (
          <InlineNotification
            kind="error"
            title="Error"
            subtitle={deleteError}
            lowContrast
            style={{ marginTop: '1rem' }}
          />
        )}
      </Modal>
    </div>
  );
}

export default AmenityList;