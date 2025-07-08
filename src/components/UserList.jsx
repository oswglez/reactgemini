import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loading, InlineNotification, Button, Pagination, DataTable,
  TableContainer, Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
  Modal, Checkbox, Dropdown
} from '@carbon/react';
import { AddFilled, TrashCan, Edit, View } from '@carbon/icons-react';
import { useAuthenticatedFetch } from '../services/apiService';
import UserRoleList from "./UserRoleList";
import UserNewForm from "./UserNewForm";

const containerStyle = {
  marginTop: '1rem',
  width: '100%',
  padding: '20px',
  backgroundColor: '#fff',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  maxWidth: '1200px',
  marginLeft: 'auto',
  marginRight: 'auto',
};
const tableTitleContainerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
};

const actionBarStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: '1rem',
  marginBottom: '20px',
};

function UserList() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDeleteId, setUserToDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);
  const [showRolesScreen, setShowRolesScreen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const authenticatedFetch = useAuthenticatedFetch();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDeleteError(null);
    setDeleteSuccess(null);
    try {
      const url = `/users?page=${currentPage}&size=${pageSize}`;
      const response = await authenticatedFetch(url);
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${response.statusText || 'Could not fetch list'}. Body: ${errorBody}`);
      }
      const data = await response.json();
      setUsers(data.content || []);
      setTotalElements(data.totalElements || 0);
      setCurrentPage(data.number || 0);
      setPageSize(data.size || 10);
    } catch (err) {
      setError(err.message || 'Could not load user list.');
      setUsers([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, authenticatedFetch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handlePaginationChange = ({ page, pageSize: newPageSize }) => {
    const newRequestedPage = page - 1;
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setCurrentPage(0);
    } else if (newRequestedPage !== currentPage) {
      setCurrentPage(newRequestedPage);
    }
  };

  const handleRowCheckboxChange = (rowId) => {
    setSelectedRows(prevSelectedRows => {
      if (prevSelectedRows.has(rowId)) {
        return new Set();
      }
      return new Set([rowId]);
    });
  };

  const isRowSelected = (rowId) => selectedRows.has(rowId);

  // --- Functions for deletion ---
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setUserToDeleteId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDeleteId) return;
    setLoading(true);
    setDeleteError(null);
    setDeleteSuccess(null);
    try {
      const response = await authenticatedFetch(`/users/${userToDeleteId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${response.statusText || 'Could not delete user'}. Body: ${errorBody}`);
      }
      setDeleteSuccess('User deleted successfully.');
      closeDeleteModal();
      setSelectedRows(prev => {
        const newSelected = new Set(prev);
        newSelected.delete(userToDeleteId);
        return newSelected;
      });
      fetchUsers();
    } catch (err) {
      setDeleteError(err.message || 'Could not delete user. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  // --- End of deletion functions ---

  const handleUserCreated = () => {
    setShowCreateForm(false);
    fetchUsers(); // Refresh the list
  };

  const dataTableHeaders = [
    { key: 'select', header: '', isSortable: false, style: { width: '60px' } },
    { key: 'userId', header: 'ID', isSortable: true },
    { key: 'username', header: 'Username', isSortable: true },
    { key: 'email', header: 'Email', isSortable: true },
    { key: 'firstName', header: 'First Name', isSortable: true },
    { key: 'lastName', header: 'Last Name', isSortable: true },
    { key: 'isActive', header: 'Active', isSortable: true },
    { key: 'actions', header: 'Actions', isSortable: false, style: { width: '120px' } },
  ];

  const tableRows = users.map(user => ({
    ...user,
    id: user.userId.toString(),
    isActive: user.isActive ? 'Yes' : 'No',
  }));

  // Si está activa la pantalla de roles, solo muestra UserRoleList
  if (showRolesScreen && selectedUserId) {
    return (
      <UserRoleList
        userId={selectedUserId}
        onClose={() => {
          setShowRolesScreen(false);
          setSelectedUserId(null);
        }}
      />
    );
  }

  // Si está activo el formulario de creación, muestra UserNewForm
  if (showCreateForm) {
    return (
      <UserNewForm
        onUserCreated={handleUserCreated}
        onCancel={() => setShowCreateForm(false)}
      />
    );
  }

  // Si no, muestra la tabla de usuarios
  return (
    <div style={containerStyle}>
      <div style={tableTitleContainerStyle}>
        <h2 style={{ textAlign: 'left', color: '#3751ff', fontSize: '2rem', fontWeight: 700, margin: 0 }}>
          SelectVista AI Users
        </h2>
        <Button kind="primary" renderIcon={AddFilled} onClick={() => setShowCreateForm(true)}>
          New User
        </Button>
      </div>
      <p style={{ fontSize: '0.95rem', color: '#555', marginBottom: '20px', textAlign: 'left' }}>
        Below you will find the list of users in the SelectVista AI platform. To create a new user select "New User". To edit or delete a user, select a row and use the actions above.
      </p>
      <div style={actionBarStyle}>
        <Button
          kind="tertiary"
          renderIcon={Edit}
          disabled={selectedRows.size !== 1}
          onClick={() => selectedRows.size === 1 && navigate(`/users/edit/${Array.from(selectedRows)[0]}`)}
        >
          View User Details
        </Button>
        <Button
          kind="secondary"
          renderIcon={View}
          disabled={selectedRows.size !== 1}
          onClick={() => {
            if (selectedRows.size === 1) {
              setSelectedUserId(Array.from(selectedRows)[0]);
              setShowRolesScreen(true);
            }
          }}
        >
          View User Roles
        </Button>
        <Button
          kind="danger"
          renderIcon={TrashCan}
          disabled={selectedRows.size !== 1}
          onClick={() => {
            if (selectedRows.size === 1) {
              setUserToDeleteId(Array.from(selectedRows)[0]);
              setShowDeleteModal(true);
            }
          }}
        >
          Delete User
        </Button>
      </div>
      {error && <InlineNotification kind="error" title="Error" subtitle={error} />}
      {deleteError && <InlineNotification kind="error" title="Delete Error" subtitle={deleteError} />}
      {deleteSuccess && <InlineNotification kind="success" title="Success" subtitle={deleteSuccess} />}
      {loading ? (
        <Loading active description="Loading users..." />
      ) : (
        <DataTable
          rows={tableRows}
          headers={dataTableHeaders.filter(h => h.key !== 'actions')}
          render={({ rows, headers, getHeaderProps }) => (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {headers.map(header => {
                      const headerProps = getHeaderProps({ header });
                      // eslint-disable-next-line no-unused-vars
                      const { key, ...rest } = headerProps;
                      return (
                        <TableHeader key={header.key} {...rest}>
                          {header.header}
                        </TableHeader>
                      );
                    })}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map(row => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Checkbox
                          id={`select-user-${row.id}`}
                          checked={isRowSelected(row.id)}
                          onChange={() => handleRowCheckboxChange(row.id)}
                          labelText=""
                          hideLabel
                        />
                      </TableCell>
                      <TableCell>{row.cells.find(cell => cell.info.header === 'userId')?.value}</TableCell>
                      <TableCell>{row.cells.find(cell => cell.info.header === 'username')?.value}</TableCell>
                      <TableCell>{row.cells.find(cell => cell.info.header === 'email')?.value}</TableCell>
                      <TableCell>{row.cells.find(cell => cell.info.header === 'firstName')?.value}</TableCell>
                      <TableCell>{row.cells.find(cell => cell.info.header === 'lastName')?.value}</TableCell>
                      <TableCell>{row.cells.find(cell => cell.info.header === 'isActive')?.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                page={currentPage + 1}
                pageSize={pageSize}
                pageSizes={[5, 10, 25, 50]}
                totalItems={totalElements}
                onChange={handlePaginationChange}
              />
            </TableContainer>
          )}
        />
      )}
      <Modal
        open={showDeleteModal}
        modalHeading="Confirm Delete"
        primaryButtonText="Delete"
        secondaryButtonText="Cancel"
        onRequestClose={closeDeleteModal}
        onRequestSubmit={handleDeleteConfirm}
        danger
      >
        Are you sure you want to delete this user?
      </Modal>
    </div>
  );
}

export default UserList; 