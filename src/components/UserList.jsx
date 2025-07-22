// src/components/UserList.jsx
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
import './UserList.css';

function UserList() {
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();
  
  // Data states
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [totalElements, setTotalElements] = useState(0);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [roles, setRoles] = useState([]);
  
  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDeleteId, setUserToDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);
  
  // User role and permissions states
  const [userRoleInfo, setUserRoleInfo] = useState(null);
  const [loadingUserInfo, setLoadingUserInfo] = useState(true);

  // DataTable headers for Lovable design
  const dataTableHeaders = [
    { key: 'select', header: '', isSortable: false, style: { width: '60px' } },
    { key: 'fullName', header: 'Full Name', isSortable: true, style: { width: '200px' } },
    { key: 'email', header: 'Email', isSortable: true, style: { width: '250px' } },
    { key: 'role', header: 'Role', isSortable: true, style: { width: '150px' } },
    { key: 'status', header: 'Status', isSortable: true, style: { width: '120px' } },
    { key: 'actions', header: 'Actions', isSortable: false, style: { width: '120px' } },
  ];

  // Transform users data for Lovable design
  const transformUserData = (user) => {
    // Map user status
    const status = user.isActive ? 'Active' : 'Inactive';
    
    // Get the highest role for display
    const highestRole = user.roles && user.roles.length > 0 
      ? user.roles[0].roleName 
      : 'No Role';
    
    return {
      id: user.userId.toString(),
      userId: user.userId,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A',
      email: user.email || 'N/A',
      role: highestRole,
      status: status,
      firstName: user.firstName,
      lastName: user.lastName,
      active: user.isActive,
      roles: user.roles || []
    };
  };

  // Use users directly since filtering is now handled in fetchUsers
  const filteredUsers = users;
  
  const tableRows = filteredUsers.map(transformUserData);

  // Get user role information
  const getUserRoleInfo = async () => {
    try {
      console.log('🔍 Fetching user role info for users...');
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

  // Fetch roles for filter
  const fetchRoles = useCallback(async () => {
    try {
      const data = await apiService.roles.getAll(0, 100, getAccessTokenSilently);
      const items = (data.content || data || []).map(role => ({
        id: role.roleName || role.role_name,
        text: role.roleName || role.role_name
      }));
      setRoles(items);
    } catch (err) {
      console.error('Error fetching roles:', err);
      setRoles([]);
    }
  }, [getAccessTokenSilently]);

  // Fetch users
  const fetchUsers = useCallback(async (page, size) => {
    setLoading(true);
    setError(null);
    setDeleteError(null);
    setDeleteSuccess(null);

    try {
      let allUsers = [];
      
      // Siempre obtener todos los usuarios cuando hay búsqueda o filtro de rol
      if (selectedRole || searchTerm) {
        const allData = await apiService.users.getAll(0, 1000, getAccessTokenSilently);
        allUsers = allData.content || [];
        
        // Filtrar por rol si está seleccionado
        if (selectedRole) {
          allUsers = allUsers.filter(user => 
            user.roles && user.roles.some(role => role.roleName === selectedRole)
          );
        }
        
        // Filtrar por búsqueda si hay término de búsqueda
        if (searchTerm) {
          allUsers = allUsers.filter(user => 
            (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        }
      } else {
        // Sin filtros: Usar paginación normal del backend
        const data = await apiService.users.getAll(page, size, getAccessTokenSilently);
        allUsers = data.content || [];
      }

      // Aplicar paginación a los datos filtrados/completos
      const startIndex = page * size;
      const endIndex = startIndex + size;
      const paginatedUsers = allUsers.slice(startIndex, endIndex);
      
      setUsers(paginatedUsers);
      setTotalElements(allUsers.length);
      setCurrentPage(page);
      setPageSize(size);
    } catch (err) {
      const errorMessage = err.message || 'Could not load users list.';
      setError(errorMessage);
      console.error('Error fetching users:', err);
      setUsers([]);
      setTotalElements(0);
      
      // Clear any existing selection when there's an error
      setSelectedUser(null);
    } finally {
      setLoading(false);
    }
  }, [getAccessTokenSilently, selectedRole, searchTerm]);

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
    const user = users.find(u => u.userId.toString() === rowId);
    setSelectedUser(user);
  };

  // Delete handlers
  const openDeleteModal = (userId) => {
    setUserToDeleteId(userId);
    setShowDeleteModal(true);
    setDeleteError(null);
    setDeleteSuccess(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setUserToDeleteId(null);
    setDeleteError(null);
    setDeleteSuccess(null);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDeleteId) return;
    
    setLoading(true);
    setDeleteError(null);
    setDeleteSuccess(null);
    
    try {
      await apiService.users.delete(userToDeleteId, getAccessTokenSilently);
      setDeleteSuccess('User deleted successfully!');
      setSelectedUser(null);
      
      // Refresh the list
      setTimeout(() => {
        fetchUsers(currentPage, pageSize);
        closeDeleteModal();
      }, 1000);
    } catch (err) {
      setDeleteError(err.message || 'Error deleting user');
      console.error('Error deleting user:', err);
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
    setSelectedRole(selectedItem ? selectedItem.id : null);
    setCurrentPage(0); // Reset to first page when filtering
  };

  // Clear all filters handler
  const handleClearFilters = () => {
    setSelectedRole(null);
    setSearchTerm('');
    setCurrentPage(0);
  };

  // Initialize data
  useEffect(() => {
    getUserRoleInfo();
    fetchRoles();
  }, [getAccessTokenSilently]);

  useEffect(() => {
    if (!loadingUserInfo) {
      fetchUsers(currentPage, pageSize);
    }
  }, [fetchUsers, currentPage, pageSize, loadingUserInfo]);

  if (loadingUserInfo) {
    return (
      <div className="loading-container">
        <Loading description="Loading user permissions..." withOverlay={false} />
      </div>
    );
  }

  return (
    <div className="user-list-container">
      {/* Header Section */}
      <div className="header-section">
        <div className="header-content">
          <div className="header-text">
            <Link to="/" className="back-button">
              <Home size={14} className="back-icon" />
              Back to Home
            </Link>
            <h1 className="header-title">User Management</h1>
            <p className="header-subtitle">View and manage your hotel users and their roles</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-layout">
          {/* Detail View Area */}
          <div className="detail-view-area">
            <div className="detail-card">
              {selectedUser ? (
                <div className="user-details">
                  <div className="detail-header">
                    <h3 className="detail-title">User Details</h3>
                    <div className="detail-header-actions">
                      {userRoleInfo.canEdit && (
                        <Button
                          kind="primary"
                          onClick={() => navigate(`/users/edit/${selectedUser.userId}`)}
                          className="header-action-button edit-button"
                        >
                          Edit
                        </Button>
                      )}
                      {userRoleInfo.canDelete && (
                        <Button
                          kind="danger"
                          onClick={() => openDeleteModal(selectedUser.userId)}
                          className="header-action-button delete-button"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="detail-info">
                    <div className="detail-grid">
                      <div className="detail-field">
                        <span className="detail-label">First Name:</span>
                        <span className="detail-value">{selectedUser.firstName || 'N/A'}</span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">Last Name:</span>
                        <span className="detail-value">{selectedUser.lastName || 'N/A'}</span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{selectedUser.email || 'N/A'}</span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">Status:</span>
                        <span className="detail-value">
                          <span className={`status-pill ${selectedUser.isActive ? 'active' : 'inactive'}`}>
                            {selectedUser.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">Roles:</span>
                        <span className="detail-value">
                          {selectedUser.roles && selectedUser.roles.length > 0 
                            ? selectedUser.roles.map(role => role.roleName).join(', ')
                            : 'No roles assigned'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-selection">
                  <p>Select a user to view their details</p>
                </div>
              )}
            </div>
          </div>

          {/* Users List Area */}
          <div className="users-list-area">
            <div className="users-header">
              <h2 className="users-title">Available Users</h2>
              {userRoleInfo.canCreate && (
                <Link to="/users/new" style={{ textDecoration: 'none' }}>
                  <Button kind="primary" renderIcon={AddFilled} className="add-user-button">
                    + Add User
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
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="search-input"
                  />
                </div>
                <div className="filter-container">
                  <Dropdown
                    id="roleFilter"
                    titleText="Filter by Role"
                    label="All Roles"
                    items={roles}
                    itemToString={item => (item ? item.text : '')}
                    selectedItem={roles.find(opt => opt.id === selectedRole) || null}
                    onChange={handleFilterChange}
                    className="filter-dropdown"
                  />
                </div>
                {(selectedRole || searchTerm) && (
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
                  <Loading description="Loading users..." withOverlay={false} />
                </div>
              )}

              {/* Data Table */}
              {!loading && !error && (
                <>
                  {filteredUsers.length === 0 ? (
                    <div className="no-data">
                      <p>No users found.</p>
                      {userRoleInfo.canCreate && (
                        <Link to="/users/new" style={{ textDecoration: 'none' }}>
                          <Button kind="primary" renderIcon={AddFilled} className="create-button">
                            + Add User
                          </Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <DataTable rows={tableRows} headers={dataTableHeaders} isSortable>
                      {({ rows: dtRows, headers: dtHeaders, getHeaderProps, getRowProps, getTableProps }) => (
                        <TableContainer>
                          <Table {...getTableProps()} size="md" useZebraStyles={false} className="user-table">
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
                              {dtRows.map((row) => {
                                const rowProps = getRowProps({ row });
                                const { key, ...restRowProps } = rowProps;
                                
                                return (
                                  <TableRow
                                    key={key}
                                    {...restRowProps}
                                    className={selectedUser?.userId.toString() === row.id ? 'selected-row' : ''}
                                    onClick={() => handleRowSelection(row.id)}
                                  >
                                    {row.cells.map((cell) => {
                                      if (cell.id.includes('select')) {
                                        return (
                                          <TableCell key={cell.id}>
                                            <RadioButton
                                              id={`radio-${row.id}`}
                                              name="user-selection"
                                              checked={selectedUser?.userId.toString() === row.id}
                                              onChange={() => handleRowSelection(row.id)}
                                              className="row-radio"
                                            />
                                          </TableCell>
                                        );
                                      }
                                      if (cell.id.includes('status')) {
                                        const isActive = cell.value === 'Active';
                                        return (
                                          <TableCell key={cell.id} className="table-cell">
                                            <span className={`status-pill ${isActive ? 'active' : 'inactive'}`}>
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
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </DataTable>
                  )}

                  {/* Pagination */}
                  {filteredUsers.length > 0 && (
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
        onRequestClose={closeDeleteModal}
        modalHeading="Delete User"
        primaryButtonText="Delete"
        secondaryButtonText="Cancel"
        primaryButtonDisabled={loading}
        onRequestSubmit={handleDeleteConfirm}
        className="delete-modal"
      >
        <p>Are you sure you want to delete this user? This action cannot be undone.</p>
      </Modal>
    </div>
  );
}

export default UserList; 