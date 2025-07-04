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
  Loading,
  RadioButtonGroup,
  RadioButton,
  Tag,
  SkeletonText,
  Tile,
  RadioButtonGroup,
  RadioButton,
  Tag,
  SkeletonText,
  Tile
} from '@carbon/react';
import { useAuthenticatedFetch, apiService } from '../services/apiService';
import { useAuth0 } from "@auth0/auth0-react";

const UserRoleList = ({ userId, onClose }) => {
  const authenticatedFetch = useAuthenticatedFetch();
  const { getAccessTokenSilently } = useAuth0();
  
  // User and roles data
  const { getAccessTokenSilently } = useAuth0();
  
  // User and roles data
  const [user, setUser] = useState(null);
  const [userHotelRoles, setUserHotelRoles] = useState([]);
  const [roles, setRoles] = useState([]);
  
  // Available options for assignment
  const [chains, setChains] = useState([]);
  const [brands, setBrands] = useState([]);
  const [hotels, setHotels] = useState([]);
  
  // New assignment state
  const [assignmentType, setAssignmentType] = useState('hotel'); // 'chain', 'brand', 'hotel'
  const [newChain, setNewChain] = useState(null);
  const [newBrand, setNewBrand] = useState(null);
  const [newHotel, setNewHotel] = useState(null);
  const [newRole, setNewRole] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [addError, setAddError] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Remove the useEffect that loads all options at once
  // Add loading states for each dropdown
  const [loadingChains, setLoadingChains] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingHotels, setLoadingHotels] = useState(false);

  // Add filtered brands and hotels state
  const [filteredBrands, setFilteredBrands] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);

  // Load chains on mount
  useEffect(() => {
    setLoadingChains(true);
    apiService.chains.getAll(getAccessTokenSilently)
      .then(data => setChains(Array.isArray(data) ? data : []))
      .catch(() => setChains([]))
      .finally(() => setLoadingChains(false));
  }, []);

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

  // Load user's current roles and extract unique roles
  useEffect(() => {
    setLoading(true);
    apiService.userHotelRoles.getUserRoles(userId, getAccessTokenSilently)
      .then(data => {
        setUserHotelRoles(Array.isArray(data) ? data : []);
        // Extract unique roles for dropdown
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
  }, [userId, getAccessTokenSilently]);

  // When newChain changes, reset newBrand and newHotel, and load brands for that chain if needed
  useEffect(() => {
    setNewBrand(null);
    setNewHotel(null);
    if (newChain && (assignmentType === 'brand' || assignmentType === 'hotel')) {
      setLoadingBrands(true);
      apiService.chains.getById(newChain.chainId, getAccessTokenSilently)
        .then(chainData => {
          if (chainData && Array.isArray(chainData.brands)) {
            setFilteredBrands(chainData.brands);
          } else if (brands.length > 0) {
            setFilteredBrands(brands.filter(b => b.chainId === newChain.chainId));
          } else {
            setFilteredBrands([]);
          }
        })
        .catch(() => setFilteredBrands([]))
        .finally(() => setLoadingBrands(false));
    } else {
      setFilteredBrands([]);
    }
  }, [newChain, assignmentType]);

  // When newBrand changes, reset newHotel, and load hotels for that brand if needed
  useEffect(() => {
    setNewHotel(null);
    if (newBrand && assignmentType === 'hotel') {
      setLoadingHotels(true);
      apiService.get(`/brand/${newBrand.brandId}/hotels`, getAccessTokenSilently)
        .then(brandData => {
          if (brandData && Array.isArray(brandData.hotels)) {
            setFilteredHotels(brandData.hotels);
          } else {
            setFilteredHotels([]);
          }
        })
        .catch(() => setFilteredHotels([]))
        .finally(() => setLoadingHotels(false));
    } else {
      setFilteredHotels([]);
    }
  }, [newBrand, assignmentType]);

  // Add new role assignment
  const handleAddRole = () => {
    clearValidationErrors();
    setSuccessMessage(null);
    
    // Run validation
    const errors = validateAssignment();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setIsAssigning(true);
    
    let assignData = {
      userId: userId,
      roleId: newRole.roleId,
      isActive: true
    };
    
    // Add the appropriate ID based on assignment type
    if (assignmentType === 'chain' && newChain) {
      assignData.chainId = newChain.chainId;
    } else if (assignmentType === 'brand' && newBrand) {
      assignData.brandId = newBrand.brandId;
    } else if (assignmentType === 'hotel' && newHotel) {
      assignData.hotelId = newHotel.hotelId;
    }
    
    apiService.userHotelRoles.assignRole(assignData, getAccessTokenSilently)
      .then(() => {
        // Refresh the roles list
        return apiService.userHotelRoles.getUserRoles(userId, getAccessTokenSilently);
      })
      .then(data => {
        setUserHotelRoles(Array.isArray(data) ? data : []);
        // Refresh unique roles
        const uniqueRoles = [];
        const seen = new Set();
        (Array.isArray(data) ? data : []).forEach(rel => {
          if (rel.roleId && rel.roleName && !seen.has(rel.roleId)) {
            uniqueRoles.push({ roleId: rel.roleId, roleName: rel.roleName });
            seen.add(rel.roleId);
          }
        });
        setRoles(uniqueRoles);
        
        // Reset form
        setNewChain(null);
        setNewBrand(null);
        setNewHotel(null);
        setNewRole(null);
        
        // Show success message
        const scopeName = assignmentType === 'chain' ? newChain?.chainName : 
                         assignmentType === 'brand' ? newBrand?.brandName : 
                         newHotel?.hotelName;
        setSuccessMessage(`Role "${newRole.roleName}" successfully assigned to ${assignmentType} "${scopeName}"`);
      })
      .catch((error) => {
        console.error('Assignment error:', error);
        setAddError(error.message || "Could not assign role. Please try again.");
      })
      .finally(() => {
        setIsAssigning(false);
      });
  };

  const dataTableHeaders = [
    { key: 'scope', header: 'Scope', style: { width: '30%' } },
    { key: 'name', header: 'Name', style: { width: '30%' } },
    { key: 'role', header: 'Role', style: { width: '30%' } },
    { key: 'active', header: 'Active', style: { width: '10%' } }
  ];

  const tableRows = userHotelRoles.map((rel, idx) => {
    let scope = 'Hotel';
    let name = rel.hotelName || 'N/A';
    let scopeType = 'hotel';
    
    if (rel.chainId && rel.chainName) {
      scope = 'Chain';
      name = rel.chainName;
      scopeType = 'chain';
    } else if (rel.brandId && rel.brandName) {
      scope = 'Brand';
      name = rel.brandName;
      scopeType = 'brand';
    }
    
    return {
      id: idx.toString(),
      scope: scope,
      scopeType: scopeType,
      name: name,
      role: rel.roleName,
      active: rel.isActive ? 'Yes' : 'No',
    };
  });

  // Validation functions
  const validateAssignment = () => {
    const errors = {};
    
    // Validate role selection
    if (!newRole) {
      errors.role = 'Please select a role';
    }
    
    // Validate scope selection based on assignment type
    if (assignmentType === 'chain' && !newChain) {
      errors.scope = 'Please select a chain';
    } else if (assignmentType === 'brand' && !newBrand) {
      errors.scope = 'Please select a brand';
    } else if (assignmentType === 'hotel' && !newHotel) {
      errors.scope = 'Please select a hotel';
    }
    
    // Check for duplicate assignments
    const existingAssignment = userHotelRoles.find(rel => {
      if (assignmentType === 'chain' && newChain) {
        return rel.chainId === newChain.chainId && rel.roleId === newRole?.roleId;
      } else if (assignmentType === 'brand' && newBrand) {
        return rel.brandId === newBrand.brandId && rel.roleId === newRole?.roleId;
      } else if (assignmentType === 'hotel' && newHotel) {
        return rel.hotelId === newHotel.hotelId && rel.roleId === newRole?.roleId;
      }
      return false;
    });
    
    if (existingAssignment) {
      errors.duplicate = `This user already has the role "${newRole?.roleName}" assigned to this ${assignmentType}`;
    }
    
    return errors;
  };

  const clearValidationErrors = () => {
    setValidationErrors({});
    setAddError(null);
  };

  // Real-time validation for duplicate detection
  const getDuplicateWarning = () => {
    if (!newRole) return null;
    
    const existingAssignment = userHotelRoles.find(rel => {
      if (assignmentType === 'chain' && newChain) {
        return rel.chainId === newChain.chainId && rel.roleId === newRole.roleId;
      } else if (assignmentType === 'brand' && newBrand) {
        return rel.brandId === newBrand.brandId && rel.roleId === newRole.roleId;
      } else if (assignmentType === 'hotel' && newHotel) {
        return rel.hotelId === newHotel.hotelId && rel.roleId === newRole.roleId;
      }
      return false;
    });
    
    return existingAssignment ? `Warning: This user already has the role "${newRole.roleName}" assigned to this ${assignmentType}` : null;
  };

  const duplicateWarning = getDuplicateWarning();

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
      
      {/* Success Message */}
      {successMessage && (
        <InlineNotification 
          kind="success" 
          title="Success" 
          subtitle={successMessage} 
          style={{ marginBottom: 16 }}
          onClose={() => setSuccessMessage(null)}
        />
      )}
      
      {loading ? (
        <Loading active description="Loading roles..." />
      ) : userHotelRoles.length === 0 ? (
        <Tile style={{ textAlign: "center", padding: "2rem" }}>
          <div style={{ fontSize: 18, color: "#666" }}>
            No roles assigned yet.
          </div>
          <div style={{ fontSize: 14, color: "#999", marginTop: 8 }}>
            Use the form below to assign roles to this user.
          </div>
        </Tile>
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
                          {cell.id.includes('scope') ? (
                            <Tag 
                              type={row.scopeType === 'chain' ? 'blue' : 
                                    row.scopeType === 'brand' ? 'purple' : 'green'}
                              size="sm"
                            >
                              {cell.value}
                            </Tag>
                          ) : cell.id.includes('active') ? (
                            <Tag 
                              type={cell.value === 'Yes' ? 'green' : 'red'}
                              size="sm"
                            >
                              {cell.value}
                            </Tag>
                          ) : (
                            cell.value
                          )}
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

      <div style={{ marginTop: 32, marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Assign New Role</h3>
        
        {/* Assignment Type Selection */}
        <div style={{ marginBottom: 24 }}>
          <RadioButtonGroup
            name="assignment-type"
            legendText="Assignment Scope"
            valueSelected={assignmentType}
            onChange={(value) => {
              setAssignmentType(value);
              clearValidationErrors();
              // Reset selections when changing assignment type
              setNewChain(null);
              setNewBrand(null);
              setNewHotel(null);
              setNewRole(null);
            }}
          >
            <RadioButton
              id="chain-radio"
              labelText={`Chain (${chains.length} loaded)`}
              value="chain"
            />
            <RadioButton
              id="brand-radio"
              labelText={`Brand (${filteredBrands.length} loaded)`}
              value="brand"
            />
            <RadioButton
              id="hotel-radio"
              labelText={`Hotel (${hotels.length} loaded)`}
              value="hotel"
            />
          </RadioButtonGroup>
        </div>

        {/* Assignment Form */}
        <div style={{
          display: "flex",
          gap: 24,
          alignItems: "center",
          marginBottom: 24,
          flexWrap: 'wrap'
        }}>
          {/* Dynamic dropdown based on assignment type */}
          <div>
            {loadingChains ? (
              <SkeletonText paragraph width="220px" lineCount={1} />
            ) : (
              <Dropdown
                id="chain-dropdown"
                titleText="Chain"
                label="Select chain..."
                items={chains}
                itemToString={item => item ? item.chainName : ''}
                selectedItem={newChain}
                onChange={({ selectedItem }) => {
                  setNewChain(selectedItem);
                  setNewBrand(null);
                  setNewHotel(null);
                  clearValidationErrors();
                }}
                style={{ minWidth: 220, fontSize: 18 }}
                invalid={!!validationErrors.scope && (assignmentType === 'chain' || assignmentType === 'brand' || assignmentType === 'hotel')}
                invalidText={validationErrors.scope}
              />
            )}
          </div>
          
          {(assignmentType === 'brand' || assignmentType === 'hotel') && (
            <div>
              {loadingBrands ? (
                <SkeletonText paragraph width="220px" lineCount={1} />
              ) : (
                <Dropdown
                  id="brand-dropdown"
                  titleText="Brand"
                  label="Select brand..."
                  items={filteredBrands}
                  itemToString={item => item ? item.brandName : ''}
                  selectedItem={newBrand}
                  onChange={({ selectedItem }) => {
                    setNewBrand(selectedItem);
                    setNewHotel(null);
                    clearValidationErrors();
                  }}
                  style={{ minWidth: 180, fontSize: 18 }}
                  invalid={!!validationErrors.scope && (assignmentType === 'brand' || assignmentType === 'hotel')}
                  invalidText={validationErrors.scope}
                  disabled={!newChain}
                />
              )}
            </div>
          )}
          
          {assignmentType === 'hotel' && (
            <div>
              {loadingHotels ? (
                <SkeletonText paragraph width="220px" lineCount={1} />
              ) : (
                <Dropdown
                  id="hotel-dropdown"
                  titleText="Hotel"
                  label="Select hotel..."
                  items={filteredHotels}
                  itemToString={item => item ? item.hotelName || item.name : ''}
                  selectedItem={newHotel}
                  onChange={({ selectedItem }) => {
                    setNewHotel(selectedItem);
                    clearValidationErrors();
                  }}
                  style={{ minWidth: 180, fontSize: 18 }}
                  invalid={!!validationErrors.scope && assignmentType === 'hotel'}
                  invalidText={validationErrors.scope}
                  disabled={!newBrand}
                />
              )}
            </div>
          )}
          
          <div>
            <Dropdown
              id="role-dropdown"
              titleText="Role"
              label="Select role..."
              items={roles}
              itemToString={item => item ? item.roleName : ''}
              selectedItem={newRole}
              onChange={({ selectedItem }) => {
                setNewRole(selectedItem);
                clearValidationErrors();
              }}
              style={{ minWidth: 180, fontSize: 18 }}
              invalid={!!validationErrors.role}
              invalidText={validationErrors.role}
            />
          </div>
          
          <Button 
            kind="primary" 
            onClick={handleAddRole} 
            disabled={isAssigning} 
            style={{ height: 48, fontSize: 18 }}
          >
            {isAssigning ? 'Assigning...' : 'Assign Role'}
          </Button>
        </div>
        
        {/* Validation Error Messages */}
        {validationErrors.duplicate && (
          <InlineNotification 
            kind="error" 
            title="Duplicate Assignment" 
            subtitle={validationErrors.duplicate} 
            style={{ marginBottom: 16 }}
            onClose={() => setValidationErrors(prev => ({ ...prev, duplicate: null }))}
          />
        )}
        
        {/* Real-time Duplicate Warning */}
        {duplicateWarning && (
          <InlineNotification 
            kind="warning" 
            title="Potential Duplicate" 
            subtitle={duplicateWarning} 
            style={{ marginBottom: 16 }}
          />
        )}
      </div>
      {addError && <InlineNotification kind="error" title="Error" subtitle={addError} style={{ marginBottom: 16 }} />}
      <div style={{ textAlign: "right" }}>
        <Button kind="secondary" onClick={onClose} style={{ fontSize: 18, padding: "12px 32px" }}>Close</Button>
      </div>
    </div>
  );
};

export default UserRoleList; 