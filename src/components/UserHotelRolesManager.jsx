import React, { useEffect, useState } from 'react';
import { DataTable, Dropdown, Button, InlineNotification, Loading } from '@carbon/react';
import { AddFilled, TrashCan } from '@carbon/icons-react';
import { useAuthenticatedFetch } from '../services/apiService';
import TableContainer from '@mui/material/TableContainer';
import UserEditForm from "./UserEditForm";
import UserRoleList from "./UserRoleList";

const UserHotelRolesManager = ({ userId, onClose }) => (
  <div>
    <h2>User Hotel Roles</h2>
    {/* ...tabla de roles para el userId... */}
    <button onClick={onClose}>Close</button>
  </div>
);

export default UserHotelRolesManager; 