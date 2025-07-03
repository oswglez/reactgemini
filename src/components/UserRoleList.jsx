import React, { useEffect, useState } from "react";
import {
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Button,
  Dropdown,
  InlineNotification,
  Loading
} from '@carbon/react';
import { useAuthenticatedFetch } from '../services/apiService';

const UserRoleList = ({ userId, onClose }) => {
  const authenticatedFetch = useAuthenticatedFetch();
  const [user, setUser] = useState(null);
  const [userHotelRoles, setUserHotelRoles] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [roles, setRoles] = useState([]);
  const [newHotel, setNewHotel] = useState(null);
  const [newRole, setNewRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addError, setAddError] = useState(null);

  // Cargar datos del usuario (igual que UserEditForm)
  useEffect(() => {
    setLoading(true);
    authenticatedFetch(`/users/${userId}`)
      .then(async res => {
        if (!res.ok) throw new Error('Could not fetch user');
        const data = await res.json();
        setUser(data);
      })
      .catch(() => setUser(null));
  }, [userId, authenticatedFetch]);

  // Cargar roles actuales del usuario y extraer roles únicos
  useEffect(() => {
    setLoading(true);
    authenticatedFetch(`/user-hotel-roles/user/${userId}`)
      .then(async res => {
        if (!res.ok) throw new Error('Could not fetch user hotel roles');
        const data = await res.json();
        setUserHotelRoles(Array.isArray(data) ? data : []);
        // Extraer roles únicos para el dropdown
        const uniqueRoles = [];
        const seen = new Set();
        (Array.isArray(data) ? data : []).forEach(rel => {
          if (rel.roleId && rel.roleName && !seen.has(rel.roleId)) {
            uniqueRoles.push({ roleId: rel.roleId, roleName: rel.roleName });
            seen.add(rel.roleId);
          }
        });
        setRoles(uniqueRoles);
      })
      .catch(() => {
        setUserHotelRoles([]);
        setRoles([]);
      })
      .finally(() => setLoading(false));
  }, [userId, authenticatedFetch]);

  // Cargar hoteles (igual que HotelList)
  useEffect(() => {
    authenticatedFetch(`/hotels/hotelList?page=0&size=1000`)
      .then(async res => {
        if (!res.ok) throw new Error('Could not fetch hotels');
        const data = await res.json();
        setHotels(Array.isArray(data.content) ? data.content : []);
      })
      .catch(() => setHotels([]));
  }, [authenticatedFetch]);

  // Agregar nueva relación
  const handleAddRole = () => {
    setAddError(null);
    if (!newHotel || !newRole) return;
    authenticatedFetch(`/user-hotel-roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        hotelId: newHotel.hotelId,
        roleId: newRole.roleId,
        isActive: true
      })
    })
      .then(async res => {
        if (!res.ok) throw new Error('Could not add role');
        // Refresca la lista de roles
        const refreshed = await authenticatedFetch(`/user-hotel-roles/user/${userId}`);
        const refreshedData = await refreshed.json();
        setUserHotelRoles(Array.isArray(refreshedData) ? refreshedData : []);
        // Refresca roles únicos
        const uniqueRoles = [];
        const seen = new Set();
        (Array.isArray(refreshedData) ? refreshedData : []).forEach(rel => {
          if (rel.roleId && rel.roleName && !seen.has(rel.roleId)) {
            uniqueRoles.push({ roleId: rel.roleId, roleName: rel.roleName });
            seen.add(rel.roleId);
          }
        });
        setRoles(uniqueRoles);
        setNewHotel(null);
        setNewRole(null);
      })
      .catch(() => setAddError("Could not add role. Please try again."));
  };

  const dataTableHeaders = [
    { key: 'hotel', header: 'Hotel', style: { width: '40%' } },
    { key: 'role', header: 'Role', style: { width: '40%' } },
    { key: 'active', header: 'Active', style: { width: '20%' } }
  ];

  const tableRows = userHotelRoles.map((rel, idx) => ({
    id: idx.toString(),
    hotel: rel.hotelName,
    role: rel.roleName,
    active: rel.isActive ? 'Yes' : 'No',
  }));

  console.log("userHotelRoles:", userHotelRoles);

  return (
    <div style={{
      maxWidth: 900,
      margin: "2rem auto",
      background: "#fff",
      padding: 32,
      borderRadius: 12,
      boxShadow: "0 2px 12px #0002"
    }}>
      {/* Mostrar datos del usuario */}
      {user ? (
        <div style={{ marginBottom: 24, borderBottom: "1px solid #eee", paddingBottom: 16 }}>
          <h2 style={{ margin: 0 }}>{user.firstName} {user.lastName}</h2>
          <div style={{ color: "#555" }}>{user.email}</div>
          <div style={{ color: "#888", fontSize: 14 }}>Username: {user.username}</div>
        </div>
      ) : (
        <InlineNotification kind="error" title="User not found" subtitle="No user data available." style={{ marginBottom: 24 }} />
      )}

      <h2 style={{ textAlign: "center", marginBottom: 32, fontSize: 28 }}>User Hotel Roles</h2>
      {loading ? (
        <Loading active description="Loading roles..." />
      ) : userHotelRoles.length === 0 ? (
        <div style={{ textAlign: "center", fontSize: 18, margin: "2rem 0" }}>
          No roles assigned yet.
        </div>
      ) : (
        <DataTable
          rows={tableRows}
          headers={dataTableHeaders}
          render={({ rows, headers, getHeaderProps }) => (
            <TableContainer>
              <Table style={{ fontSize: 18 }}>
                <TableHead>
                  <TableRow>
                    {headers.map(header => (
                      <TableHeader
                        {...getHeaderProps({ header })}
                        style={
                          header.key === 'hotel' || header.key === 'role'
                            ? { width: '40%' }
                            : { width: '20%' }
                        }
                      >
                        {header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map(row => (
                    <TableRow key={row.id}>
                      {row.cells.map(cell => (
                        <TableCell key={cell.id} style={{ fontSize: 18 }}>
                          {cell.value}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        />
      )}

      <div style={{
        display: "flex",
        gap: 24,
        alignItems: "center",
        marginBottom: 24,
        marginTop: 32
      }}>
        <Dropdown
          id="hotel-dropdown"
          titleText="Hotel"
          label="Select hotel..."
          items={hotels}
          itemToString={item => item ? item.hotelName || item.name : ''}
          selectedItem={newHotel}
          onChange={({ selectedItem }) => setNewHotel(selectedItem)}
          style={{ minWidth: 220, fontSize: 18 }}
        />
        <Dropdown
          id="role-dropdown"
          titleText="Role"
          label="Select role..."
          items={roles}
          itemToString={item => item ? item.roleName : ''}
          selectedItem={newRole}
          onChange={({ selectedItem }) => setNewRole(selectedItem)}
          style={{ minWidth: 180, fontSize: 18 }}
        />
        <Button kind="primary" onClick={handleAddRole} disabled={!newHotel || !newRole} style={{ height: 48, fontSize: 18 }}>
          Add
        </Button>
      </div>
      {addError && <InlineNotification kind="error" title="Error" subtitle={addError} style={{ marginBottom: 16 }} />}
      <div style={{ textAlign: "right" }}>
        <Button kind="secondary" onClick={onClose} style={{ fontSize: 18, padding: "12px 32px" }}>Close</Button>
      </div>
    </div>
  );
};

export default UserRoleList; 