// src/components/HotelList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loading, InlineNotification, Button, Checkbox, Pagination, Modal, Search, Tag, Tile
} from '@carbon/react';
import { 
  AddFilled, TrashCan, Edit, View, Location, Building, User, Globe, StarFilled 
} from '@carbon/icons-react';
import { useAuthenticatedFetch, apiService } from '../services/apiService';
import { useAuth0 } from '@auth0/auth0-react';

// Estilos modernos inline
const modernContainerStyle = { padding: '24px', backgroundColor: '#f8f9fa', minHeight: '100vh' };
const headerStyle = { textAlign: 'center', marginBottom: '32px', color: '#161616' };
const titleStyle = { fontSize: '2.5rem', fontWeight: '300', marginBottom: '8px', color: '#161616' };
const subtitleStyle = { fontSize: '1rem', color: '#525252', maxWidth: '600px', margin: '0 auto' };
const controlsContainerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' };
const searchContainerStyle = { flex: '1', maxWidth: '400px' };
const actionButtonsStyle = { display: 'flex', gap: '12px', flexWrap: 'wrap' };
const statsContainerStyle = { display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' };
const statCardStyle = { backgroundColor: 'white', padding: '16px 20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', flex: '1', minWidth: '120px', textAlign: 'center' };
const statNumberStyle = { fontSize: '2rem', fontWeight: '600', color: '#0f62fe', marginBottom: '4px' };
const statLabelStyle = { fontSize: '0.875rem', color: '#525252', textTransform: 'uppercase', letterSpacing: '0.5px' };
const cardsGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px', marginBottom: '32px' };
const hotelCardStyle = { backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #e0e0e0', transition: 'all 0.2s ease', cursor: 'pointer', position: 'relative' };
const selectedCardStyle = { ...hotelCardStyle, border: '2px solid #0f62fe', boxShadow: '0 4px 12px rgba(15, 98, 254, 0.2)' };
const cardHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' };
const hotelNameStyle = { fontSize: '1.25rem', fontWeight: '600', color: '#161616', marginBottom: '4px' };
const hotelCodeStyle = { fontSize: '0.875rem', color: '#525252', fontWeight: '500' };
const statusTagStyle = { marginLeft: 'auto' };
const cardContentStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' };
const infoItemStyle = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' };
const infoLabelStyle = { color: '#525252', fontWeight: '500', minWidth: '80px' };
const infoValueStyle = { color: '#161616', fontWeight: '400' };
const cardActionsStyle = { display: 'flex', gap: '8px', flexWrap: 'wrap' };

const decodeHotelStatus = (statusKey) => {
  const statusMap = { A: 'Active', P: 'Pending', I: 'Inactive' };
  return statusMap[statusKey] || statusKey;
};
const getStatusKind = (status) => {
  const statusMap = { A: 'green', P: 'orange', I: 'red' };
  return statusMap[status] || 'gray';
};

function HotelList() {
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [hotelToDeleteId, setHotelToDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);
  const [userRoleInfo, setUserRoleInfo] = useState(null);

  const authenticatedFetch = useAuthenticatedFetch();

  // Fetch hotels
  const fetchHotels = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/hotels/hotelList?page=${currentPage}&size=${pageSize}`;
      url += `&sort=hotelName,asc`;
      const response = await authenticatedFetch(url);
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${response.statusText || 'Could not fetch list'}. Body: ${errorBody}`);
      }
      const data = await response.json();
      setHotels(data.content || []);
      setTotalElements(data.totalElements || 0);
      setCurrentPage(data.number || 0);
      setPageSize(data.size || 12);
    } catch (err) {
      setHotels([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, authenticatedFetch]);

  useEffect(() => { fetchHotels(); }, [fetchHotels]);

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
          canEdit: highestRole && ['SUPER_USER', 'CHAIN_ADMIN', 'BRAND_ADMIN', 'HOTEL_ADMIN'].includes(highestRole),
          canDelete: highestRole && ['SUPER_USER', 'CHAIN_ADMIN', 'BRAND_ADMIN'].includes(highestRole)
        });
      }
    } catch (error) {
      setUserRoleInfo({ roles: [], highestRole: null, canEdit: false, canDelete: false });
    }
  };
  useEffect(() => { getUserRoleInfo(); }, []);

  // Search
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(0);
  };
  const filteredHotels = hotels.filter(hotel =>
    hotel.hotelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotel.hotelCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotel.hotelCity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotel.hotelCountry?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  // Card selection
  const handleCardClick = (hotelId) => {
    setSelectedRows(new Set([hotelId.toString()]));
  };
  const handleCardCheckboxChange = (hotelId, event) => {
    event.stopPropagation();
    setSelectedRows(prevSelectedRows => {
      const newSelectedRows = new Set(prevSelectedRows);
      if (newSelectedRows.has(hotelId.toString())) {
        newSelectedRows.delete(hotelId.toString());
      } else {
        newSelectedRows.add(hotelId.toString());
      }
      return newSelectedRows;
    });
  };
  const isCardSelected = (hotelId) => selectedRows.has(hotelId.toString());

  // Delete logic
  const openDeleteModal = () => {
    if (selectedRows.size === 1) {
      const selectedId = Array.from(selectedRows)[0];
      setHotelToDeleteId(selectedId);
      setShowDeleteModal(true);
      setDeleteError(null);
      setDeleteSuccess(null);
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
      const response = await authenticatedFetch(`/hotels/${hotelToDeleteId}`, { method: 'DELETE' });
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
      setDeleteError(err.message || 'Could not delete property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const activeHotels = hotels.filter(h => h.hotelStatus === 'A').length;
  const pendingHotels = hotels.filter(h => h.hotelStatus === 'P').length;
  const inactiveHotels = hotels.filter(h => h.hotelStatus === 'I').length;

  return (
    <div style={modernContainerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>SelectVista AI Properties</h1>
        <p style={subtitleStyle}>
          Manage and view all properties in the SelectVista AI platform. 
          Create new properties, view details, and manage amenities.
        </p>
      </div>
      {/* Stats Cards */}
      <div style={statsContainerStyle}>
        <div style={statCardStyle}>
          <div style={statNumberStyle}>{totalElements}</div>
          <div style={statLabelStyle}>Total Properties</div>
        </div>
        <div style={statCardStyle}>
          <div style={statNumberStyle}>{activeHotels}</div>
          <div style={statLabelStyle}>Active</div>
        </div>
        <div style={statCardStyle}>
          <div style={statNumberStyle}>{pendingHotels}</div>
          <div style={statLabelStyle}>Pending</div>
        </div>
        <div style={statCardStyle}>
          <div style={statNumberStyle}>{inactiveHotels}</div>
          <div style={statLabelStyle}>Inactive</div>
        </div>
      </div>
      {/* Controls */}
      <div style={controlsContainerStyle}>
        <div style={searchContainerStyle}>
          <Search
            size="md"
            labelText="Search properties"
            placeholder="Search by name, code, city, or country..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <div style={actionButtonsStyle}>
          <Link to="/hotel/new" style={{ textDecoration: 'none' }}>
            <Button kind="primary" renderIcon={AddFilled}>
              Create New Property
            </Button>
          </Link>
          <Button
            kind="secondary"
            renderIcon={Edit}
            disabled={selectedRows.size !== 1}
            onClick={() => {
              if (selectedRows.size === 1) {
                const selectedHotelId = Array.from(selectedRows)[0];
                navigate(`/hotel/edit/${selectedHotelId}`, { state: { userRoleInfo } });
              }
            }}
          >
            {userRoleInfo && !userRoleInfo.canEdit ? 'View Details' : 'Edit Property'}
          </Button>
          <Button
            kind="secondary"
            renderIcon={View}
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
            kind="danger"
            renderIcon={TrashCan}
            disabled={selectedRows.size !== 1 || (userRoleInfo && !userRoleInfo.canDelete)}
            onClick={openDeleteModal}
          >
            Delete Property
          </Button>
        </div>
      </div>
      {/* Loading and Error States */}
      {loading && <Loading description="Loading properties..." withOverlay={false} style={{ marginTop: '2rem' }} />}
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
      {/* Hotels Grid */}
      {!loading && (
        <>
          {filteredHotels.length === 0 ? (
            <Tile style={{ textAlign: 'center', padding: '48px', color: '#525252' }}>
              <Building size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <h3>No properties found</h3>
              <p>Try adjusting your search criteria or create a new property.</p>
            </Tile>
          ) : (
            <div style={cardsGridStyle}>
              {filteredHotels.map((hotel) => (
                <div
                  key={hotel.hotelId}
                  style={isCardSelected(hotel.hotelId) ? selectedCardStyle : hotelCardStyle}
                  onClick={() => handleCardClick(hotel.hotelId)}
                >
                  {/* Card Header */}
                  <div style={cardHeaderStyle}>
                    <div>
                      <div style={hotelNameStyle}>{hotel.hotelName || 'Unnamed Property'}</div>
                      <div style={hotelCodeStyle}>Code: {hotel.hotelCode || 'N/A'}</div>
                    </div>
                    <div style={statusTagStyle}>
                      <Tag 
                        type={getStatusKind(hotel.hotelStatus)} 
                        size="sm"
                      >
                        {decodeHotelStatus(hotel.hotelStatus)}
                      </Tag>
                    </div>
                    <Checkbox
                      id={`checkbox-${hotel.hotelId}`}
                      labelText=""
                      onChange={(event) => handleCardCheckboxChange(hotel.hotelId, event)}
                      checked={isCardSelected(hotel.hotelId)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  {/* Card Content */}
                  <div style={cardContentStyle}>
                    <div style={infoItemStyle}>
                      <Building size={16} />
                      <span style={infoLabelStyle}>Chain:</span>
                      <span style={infoValueStyle}>{hotel.hotelChain || 'N/A'}</span>
                    </div>
                    <div style={infoItemStyle}>
                      <StarFilled size={16} />
                      <span style={infoLabelStyle}>Brand:</span>
                      <span style={infoValueStyle}>{hotel.hotelBrand || 'N/A'}</span>
                    </div>
                    <div style={infoItemStyle}>
                      <Location size={16} />
                      <span style={infoLabelStyle}>City:</span>
                      <span style={infoValueStyle}>{hotel.hotelCity || 'N/A'}</span>
                    </div>
                    <div style={infoItemStyle}>
                      <Globe size={16} />
                      <span style={infoLabelStyle}>Country:</span>
                      <span style={infoValueStyle}>{hotel.hotelCountry || 'N/A'}</span>
                    </div>
                    <div style={infoItemStyle}>
                      <User size={16} />
                      <span style={infoLabelStyle}>Contact:</span>
                      <span style={infoValueStyle}>
                        {`${hotel.contactFirstName || ''} ${hotel.contactLastName || ''}`.trim() || 'N/A'}
                      </span>
                    </div>
                    {hotel.hotelWebsiteUrl && (
                      <div style={infoItemStyle}>
                        <Globe size={16} />
                        <span style={infoLabelStyle}>Website:</span>
                        <a 
                          href={hotel.hotelWebsiteUrl.toString().startsWith('http') ? hotel.hotelWebsiteUrl : `http://${hotel.hotelWebsiteUrl}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ color: '#0f62fe', textDecoration: 'underline' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Visit
                        </a>
                      </div>
                    )}
                  </div>
                  {/* Card Actions */}
                  <div style={cardActionsStyle}>
                    <Button
                      kind="ghost"
                      size="sm"
                      renderIcon={Edit}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/hotel/edit/${hotel.hotelId}`, { state: { userRoleInfo } });
                      }}
                    >
                      {userRoleInfo && !userRoleInfo.canEdit ? 'View' : 'Edit'}
                    </Button>
                    <Button
                      kind="ghost"
                      size="sm"
                      renderIcon={View}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/hotels/${hotel.hotelId}/roomsDTO`);
                      }}
                    >
                      Rooms
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Pagination */}
          {totalElements > 0 && filteredHotels.length > 0 && (
            <Pagination
              totalItems={totalElements}
              pageSize={pageSize}
              pageSizes={[6, 12, 24, 48]}
              page={currentPage + 1}
              onChange={handlePaginationChange}
              style={{ display: 'flex', justifyContent: 'center' }}
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
        <p>You are about to delete this property. This action is irreversible. Are you sure?</p>
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

export default HotelList;