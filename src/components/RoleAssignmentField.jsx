import React, { useState, useEffect } from 'react';
import {
  Dropdown,
  Button,
  InlineNotification,
  Loading,
  Tag,
  SkeletonText,
  Tile,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@carbon/react';
import { Add, TrashCan } from '@carbon/icons-react';
import { useAuthenticatedFetch } from '../services/apiService';

const RoleAssignmentField = ({ currentUser, targetUser, onRolesChange }) => {
  const authenticatedFetch = useAuthenticatedFetch();
  
  // State for available options
  const [chains, setChains] = useState([]);
  const [brands, setBrands] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [roles, setRoles] = useState([]);
  
  // State for current assignments
  const [currentAssignments, setCurrentAssignments] = useState([]);
  
  // State for current user's highest role
  const [currentUserHighestRole, setCurrentUserHighestRole] = useState(null);
  
  // State for new assignment
  const [newAssignment, setNewAssignment] = useState({
    roleId: null,
    chainId: null,
    brandId: null,
    hotelId: null
  });

  // State for selected items in dropdowns (to avoid downshift errors)
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedChain, setSelectedChain] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [currentUser, targetUser]);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load current user's roles and available roles
      const [currentUserData, currentAssignmentsData, availableRoles] = await Promise.all([
        authenticatedFetch('/users/me').then(res => res.json()),
        authenticatedFetch(`/user-hotel-roles/user/${targetUser.userId}`).then(res => res.json()),
        authenticatedFetch('/users/available-roles').then(res => res.json())
      ]);

      // Get current user's roles to determine their highest role
      const currentUserRoles = await authenticatedFetch(`/user-hotel-roles/user/${currentUserData.userId}`).then(res => res.json());
      const highestRole = getHighestRole(currentUserRoles);
      setCurrentUserHighestRole(highestRole);
      
      // Filter roles based on current user's highest role
      const filteredRoles = filterAvailableRoles(availableRoles, highestRole);
      setRoles(filteredRoles);
      
      // Load current assignments
      setCurrentAssignments(currentAssignmentsData);
      
      // Load chains if user can assign chain-level roles
      if (canAssignChainRoles(highestRole)) {
        try {
          const chainsData = await authenticatedFetch('/chain').then(res => res.json());
          setChains(Array.isArray(chainsData) ? chainsData : []);
        } catch (err) {
          console.error('Error loading chains:', err);
          setChains([]);
        }
      }
      
    } catch (err) {
      setError('Error loading role assignment data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getHighestRole = (userRoles) => {
    if (!userRoles || userRoles.length === 0) return 'HOTEL_VIEWER';
    
    const roleHierarchy = ['SUPER_USER', 'CHAIN_ADMIN', 'BRAND_ADMIN', 'HOTEL_ADMIN', 'HOTEL_MANAGER', 'HOTEL_STAFF', 'HOTEL_VIEWER'];
    
    let highestRole = 'HOTEL_VIEWER';
    for (const role of roleHierarchy) {
      if (userRoles.some(userRole => userRole.roleName === role)) {
        highestRole = role;
        break;
      }
    }
    
    return highestRole;
  };

  const filterAvailableRoles = (allRoles, highestRole) => {
    switch (highestRole) {
      case 'SUPER_USER':
        return allRoles.filter(role => role.roleName !== 'SUPER_USER'); // Can't assign SUPER_USER to others
      case 'CHAIN_ADMIN':
        return allRoles.filter(role => 
          !['SUPER_USER', 'CHAIN_ADMIN'].includes(role.roleName)
        );
      case 'BRAND_ADMIN':
        return allRoles.filter(role => 
          !['SUPER_USER', 'CHAIN_ADMIN', 'BRAND_ADMIN'].includes(role.roleName)
        );
      case 'HOTEL_ADMIN':
        return allRoles.filter(role => 
          !['SUPER_USER', 'CHAIN_ADMIN', 'BRAND_ADMIN', 'HOTEL_ADMIN'].includes(role.roleName)
        );
      default:
        return []; // Other roles cannot assign roles
    }
  };

  const canAssignChainRoles = (highestRole) => {
    return ['SUPER_USER', 'CHAIN_ADMIN'].includes(highestRole);
  };

  const canAssignBrandRoles = (highestRole) => {
    return ['SUPER_USER', 'CHAIN_ADMIN', 'BRAND_ADMIN'].includes(highestRole);
  };

  const canAssignHotelRoles = (highestRole) => {
    return ['SUPER_USER', 'CHAIN_ADMIN', 'BRAND_ADMIN', 'HOTEL_ADMIN'].includes(highestRole);
  };

  // Load brands when chain is selected
  useEffect(() => {
    if (newAssignment.chainId && canAssignBrandRoles(currentUserHighestRole)) {
      loadBrandsForChain(newAssignment.chainId);
    } else {
      setBrands([]);
    }
  }, [newAssignment.chainId]);

  // Load hotels when brand is selected
  useEffect(() => {
    if (newAssignment.brandId && canAssignHotelRoles(currentUserHighestRole)) {
      loadHotelsForBrand(newAssignment.brandId);
    } else {
      setHotels([]);
    }
  }, [newAssignment.brandId]);

  const loadBrandsForChain = async (chainId) => {
    setLoadingOptions(true);
    try {
      const response = await authenticatedFetch(`/chain/${chainId}/brands`);
      const brandsData = await response.json();
      setBrands(Array.isArray(brandsData) ? brandsData : []);
    } catch (err) {
      console.error('Error loading brands:', err);
      setBrands([]);
      setError('Error loading brands: ' + err.message);
    } finally {
      setLoadingOptions(false);
    }
  };

  const loadHotelsForBrand = async (brandId) => {
    setLoadingOptions(true);
    try {
      const response = await authenticatedFetch(`/brand/${brandId}/hotels`);
      const brandData = await response.json();
      setHotels(Array.isArray(brandData.hotels) ? brandData.hotels : []);
    } catch (err) {
      console.error('Error loading hotels:', err);
      setHotels([]);
      setError('Error loading hotels: ' + err.message);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleAssignmentChange = (field, value) => {
    setNewAssignment(prev => {
      const updated = { ...prev, [field]: value };
      
      // Reset dependent fields
      if (field === 'chainId') {
        updated.brandId = null;
        updated.hotelId = null;
        setSelectedBrand(null);
        setSelectedHotel(null);
      } else if (field === 'brandId') {
        updated.hotelId = null;
        setSelectedHotel(null);
      }
      
      return updated;
    });
    
    // Update selected items for dropdowns
    if (field === 'roleId') {
      const role = roles.find(r => r.roleId === value);
      setSelectedRole(role || null);
    } else if (field === 'chainId') {
      const chain = chains.find(c => c.chainId === value);
      setSelectedChain(chain || null);
    } else if (field === 'brandId') {
      const brand = brands.find(b => b.brandId === value);
      setSelectedBrand(brand || null);
    } else if (field === 'hotelId') {
      const hotel = hotels.find(h => h.hotelId === value);
      setSelectedHotel(hotel || null);
    }
    
    clearValidationErrors();
  };

  const validateAssignment = () => {
    const errors = {};
    
    if (!newAssignment.roleId) {
      errors.role = 'Please select a role';
    }
    
    const selectedRole = roles.find(r => r.roleId === newAssignment.roleId);
    if (selectedRole) {
      switch (selectedRole.roleName) {
        case 'CHAIN_ADMIN':
          if (!newAssignment.chainId) {
            errors.scope = 'Chain is required for CHAIN_ADMIN role';
          }
          break;
        case 'BRAND_ADMIN':
          if (!newAssignment.chainId || !newAssignment.brandId) {
            errors.scope = 'Chain and Brand are required for BRAND_ADMIN role';
          }
          break;
        case 'HOTEL_ADMIN':
        case 'HOTEL_MANAGER':
        case 'HOTEL_STAFF':
        case 'HOTEL_VIEWER':
          if (!newAssignment.chainId || !newAssignment.brandId || !newAssignment.hotelId) {
            errors.scope = 'Chain, Brand, and Hotel are required for hotel-level roles';
          }
          break;
      }
    }
    
    // Check for duplicates
    const isDuplicate = currentAssignments.some(assignment => {
      if (selectedRole?.roleName === 'CHAIN_ADMIN') {
        return assignment.chainId === newAssignment.chainId && 
               assignment.roleId === newAssignment.roleId;
      } else if (selectedRole?.roleName === 'BRAND_ADMIN') {
        return assignment.brandId === newAssignment.brandId && 
               assignment.roleId === newAssignment.roleId;
      } else {
        return assignment.hotelId === newAssignment.hotelId && 
               assignment.roleId === newAssignment.roleId;
      }
    });
    
    if (isDuplicate) {
      errors.duplicate = `This user already has the ${selectedRole?.roleName} role assigned to this scope`;
    }
    
    return errors;
  };

  const handleAssignRole = async () => {
    setError(null);
    setSuccess(null);
    
    const errors = validateAssignment();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setIsAssigning(true);
    
    try {
      const assignmentData = {
        userId: targetUser.userId,
        roleId: newAssignment.roleId,
        chainId: newAssignment.chainId,
        brandId: newAssignment.brandId,
        hotelId: newAssignment.hotelId,
        isActive: true
      };
      
      const response = await authenticatedFetch('/user-hotel-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to assign role');
      }
      
      // Refresh assignments
      const updatedAssignments = await authenticatedFetch(`/user-hotel-roles/user/${targetUser.userId}`).then(res => res.json());
      setCurrentAssignments(updatedAssignments);
      
      // Reset form
      setNewAssignment({
        roleId: null,
        chainId: null,
        brandId: null,
        hotelId: null
      });
      
      // Reset selected items
      setSelectedRole(null);
      setSelectedChain(null);
      setSelectedBrand(null);
      setSelectedHotel(null);
      
      setSuccess('Role assigned successfully');
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
      
      // Notify parent component
      if (onRolesChange) {
        onRolesChange(updatedAssignments);
      }
      
    } catch (err) {
      setError('Error assigning role: ' + err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveRole = async (assignmentId) => {
    try {
      const response = await authenticatedFetch(`/user-hotel-roles/${assignmentId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove role');
      }
      
      // Refresh assignments
      const updatedAssignments = await authenticatedFetch(`/user-hotel-roles/user/${targetUser.userId}`).then(res => res.json());
      setCurrentAssignments(updatedAssignments);
      
      setSuccess('Role removed successfully');
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
      
      // Notify parent component
      if (onRolesChange) {
        onRolesChange(updatedAssignments);
      }
      
    } catch (err) {
      setError('Error removing role: ' + err.message);
    }
  };

  const clearValidationErrors = () => {
    setValidationErrors({});
    setError(null);
    // Don't clear success message here to keep it visible
  };

  const getScopeDisplay = (assignment) => {
    // Determinar el tipo de scope basado en los datos disponibles
    if (assignment.chainId && !assignment.brandId && !assignment.hotelId) {
      return { 
        type: 'CHAIN', 
        name: assignment.chainName || `Chain ID: ${assignment.chainId}`, 
        color: 'blue' 
      };
    } else if (assignment.chainId && assignment.brandId && !assignment.hotelId) {
      return { 
        type: 'BRAND', 
        name: assignment.brandName || `Brand ID: ${assignment.brandId}`, 
        color: 'purple' 
      };
    } else if (assignment.chainId && assignment.brandId && assignment.hotelId) {
      return { 
        type: 'HOTEL', 
        name: assignment.hotelName || `Hotel ID: ${assignment.hotelId}`, 
        color: 'green' 
      };
    }
    
    // Fallback basado en nombres disponibles
    if (assignment.chainName && !assignment.brandName && !assignment.hotelName) {
      return { type: 'CHAIN', name: assignment.chainName, color: 'blue' };
    } else if (assignment.chainName && assignment.brandName && !assignment.hotelName) {
      return { type: 'BRAND', name: assignment.brandName, color: 'purple' };
    } else if (assignment.chainName && assignment.brandName && assignment.hotelName) {
      return { type: 'HOTEL', name: assignment.hotelName, color: 'green' };
    }
    
    // Si no hay datos suficientes, mostrar información básica
    if (assignment.roleName) {
      if (assignment.roleName.includes('CHAIN')) {
        return { type: 'CHAIN', name: 'Chain Assignment', color: 'blue' };
      } else if (assignment.roleName.includes('BRAND')) {
        return { type: 'BRAND', name: 'Brand Assignment', color: 'purple' };
      } else if (assignment.roleName.includes('HOTEL')) {
        return { type: 'HOTEL', name: 'Hotel Assignment', color: 'green' };
      }
    }
    
    return { type: 'UNKNOWN', name: 'General Assignment', color: 'gray' };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <SkeletonText paragraph width="100%" lineCount={4} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" style={{ position: 'relative' }}>
      <style jsx>{`
        .cds--dropdown {
          position: relative;
        }
        .cds--dropdown-list {
          z-index: 9999 !important;
        }
        .cds--list-box__menu {
          z-index: 9999 !important;
        }
      `}</style>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Role Assignment
      </h3>
      
      {/* Success/Error Messages */}
      {success && (
        <InlineNotification 
          kind="success" 
          title="Success" 
          subtitle={success} 
          style={{ 
            marginBottom: 16, 
            fontSize: '14px', 
            fontWeight: '500',
            backgroundColor: '#defbe6',
            border: '1px solid #24a148',
            color: '#0e6027'
          }}
          onClose={() => setSuccess(null)}
          hideCloseButton={false}
        />
      )}
      
      {error && (
        <InlineNotification 
          kind="error" 
          title="Error" 
          subtitle={error} 
          style={{ marginBottom: 16 }}
          onClose={() => setError(null)}
        />
      )}
      
      {/* Current Assignments */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-700 mb-3">Current Role Assignments</h4>
        {currentAssignments.length === 0 ? (
          <Tile style={{ textAlign: "center", padding: "1rem" }}>
            <div className="text-sm text-gray-500">
              No roles assigned yet
            </div>
          </Tile>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Rol</TableHeader>
                <TableHeader>Jerarquía</TableHeader>
                <TableHeader>Estado</TableHeader>
                <TableHeader></TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentAssignments.map((assignment) => {
                const scope = getScopeDisplay(assignment);
                
                // Construir texto de jerarquía según el tipo de scope
                let hierarchyText = '';
                if (scope.type === 'CHAIN') {
                  hierarchyText = assignment.chainName || `Chain ID: ${assignment.chainId || 'N/A'}`;
                } else if (scope.type === 'BRAND') {
                  const chainText = assignment.chainName || `Chain ID: ${assignment.chainId || 'N/A'}`;
                  const brandText = assignment.brandName || `Brand ID: ${assignment.brandId || 'N/A'}`;
                  hierarchyText = `${chainText} > ${brandText}`;
                } else if (scope.type === 'HOTEL') {
                  const chainText = assignment.chainName || `Chain ID: ${assignment.chainId || 'N/A'}`;
                  const brandText = assignment.brandName || `Brand ID: ${assignment.brandId || 'N/A'}`;
                  const hotelText = assignment.hotelName || `Hotel ID: ${assignment.hotelId || 'N/A'}`;
                  hierarchyText = `${chainText} > ${brandText} > ${hotelText}`;
                } else {
                  // Para casos desconocidos, mostrar los IDs disponibles
                  const parts = [];
                  if (assignment.chainId) parts.push(`Chain: ${assignment.chainId}`);
                  if (assignment.brandId) parts.push(`Brand: ${assignment.brandId}`);
                  if (assignment.hotelId) parts.push(`Hotel: ${assignment.hotelId}`);
                  hierarchyText = parts.length > 0 ? parts.join(' > ') : 'No hierarchy data';
                }
                
                return (
                  <TableRow key={assignment.userHotelRoleId}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Tag type={scope.color} size="sm">
                          {scope.type}
                        </Tag>
                        <span className="font-medium">{assignment.roleName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{hierarchyText}</span>
                    </TableCell>
                    <TableCell>
                      <Tag 
                        type={assignment.isActive ? 'green' : 'red'} 
                        size="sm"
                      >
                        {assignment.isActive ? 'Active' : 'Inactive'}
                      </Tag>
                    </TableCell>
                    <TableCell>
                      <Button
                        kind="ghost"
                        size="sm"
                        iconDescription="Remove role"
                        onClick={() => handleRemoveRole(assignment.userHotelRoleId)}
                        hasIconOnly
                      >
                        <TrashCan size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
      
      {/* New Assignment Form */}
      <div className="border-t pt-6">
        <h4 className="text-md font-medium text-gray-700 mb-4">Assign New Role</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6" style={{ minHeight: '120px' }}>
          {/* Role Selection */}
          <div style={{ position: 'relative', zIndex: 40 }}>
            <Dropdown
              id="role-dropdown"
              titleText="Role"
              label="Select role..."
              items={roles}
              itemToString={item => item ? item.roleName : ''}
              selectedItem={selectedRole}
              onChange={({ selectedItem }) => handleAssignmentChange('roleId', selectedItem?.roleId)}
              invalid={!!validationErrors.role}
              invalidText={validationErrors.role}
            />
          </div>
          
          {/* Chain Selection */}
          {canAssignChainRoles(currentUserHighestRole) && (
            <div style={{ position: 'relative', zIndex: 30 }}>
              {loadingOptions ? (
                <SkeletonText paragraph width="100%" lineCount={1} />
              ) : (
                <Dropdown
                  id="chain-dropdown"
                  titleText="Chain"
                  label="Select chain..."
                  items={chains}
                  itemToString={item => item ? item.chainName : ''}
                  selectedItem={selectedChain}
                  onChange={({ selectedItem }) => handleAssignmentChange('chainId', selectedItem?.chainId)}
                  invalid={!!validationErrors.scope}
                  invalidText={validationErrors.scope}
                />
              )}
            </div>
          )}
          
          {/* Brand Selection */}
          {canAssignBrandRoles(currentUserHighestRole) && newAssignment.chainId && (
            <div style={{ position: 'relative', zIndex: 20 }}>
              {loadingOptions ? (
                <SkeletonText paragraph width="100%" lineCount={1} />
              ) : (
                <Dropdown
                  id="brand-dropdown"
                  titleText="Brand"
                  label="Select brand..."
                  items={brands}
                  itemToString={item => item ? item.brandName : ''}
                  selectedItem={selectedBrand}
                  onChange={({ selectedItem }) => handleAssignmentChange('brandId', selectedItem?.brandId)}
                  invalid={!!validationErrors.scope}
                  invalidText={validationErrors.scope}
                />
              )}
            </div>
          )}
          
          {/* Hotel Selection */}
          {canAssignHotelRoles(currentUserHighestRole) && newAssignment.brandId && (
            <div style={{ position: 'relative', zIndex: 10 }}>
              {loadingOptions ? (
                <SkeletonText paragraph width="100%" lineCount={1} />
              ) : (
                <Dropdown
                  id="hotel-dropdown"
                  titleText="Hotel"
                  label="Select hotel..."
                  items={hotels}
                  itemToString={item => item ? item.hotelName : ''}
                  selectedItem={selectedHotel}
                  onChange={({ selectedItem }) => handleAssignmentChange('hotelId', selectedItem?.hotelId)}
                  invalid={!!validationErrors.scope}
                  invalidText={validationErrors.scope}
                />
              )}
            </div>
          )}
        </div>
        
        {/* Validation Errors */}
        {validationErrors.duplicate && (
          <InlineNotification 
            kind="error" 
            title="Duplicate Assignment" 
            subtitle={validationErrors.duplicate} 
            style={{ marginBottom: 16 }}
            onClose={() => setValidationErrors(prev => ({ ...prev, duplicate: null }))}
          />
        )}
        
        {/* Assign Button */}
        <Button 
          kind="primary" 
          onClick={handleAssignRole} 
          disabled={isAssigning || !newAssignment.roleId}
          renderIcon={Add}
        >
          {isAssigning ? 'Assigning...' : 'Assign Role'}
        </Button>
      </div>
    </div>
  );
};

export default RoleAssignmentField;