// src/components/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  SideNav,
  SideNavItems,
  SideNavLink,
  // SideNavMenu, // Descomenta si necesitas submenús
  // SideNavMenuItem, // Descomenta si necesitas submenús
} from '@carbon/react';
import {
  Home,
  List,
  AddAlt as CreateIcon, // Usando AddAlt para "Create"
  Settings,
} from '@carbon/icons-react'; // Asegúrate de tener @carbon/icons-react instalado

// Define tus items de navegación
// Asegúrate que las rutas 'to' coincidan con las definidas en App.jsx
const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/hotel-list', label: 'Property List', icon: List },
  { to: '/hotel/new', label: 'Create Property', icon: CreateIcon },
  { to: '/types-management', label: 'Manage Types', icon: Settings },
  // Agrega más items de navegación aquí si es necesario
];

function Sidebar() {
  const location = useLocation();

  return (
    <SideNav
      isFixedNav // Mantiene el sidebar fijo
      expanded={true} // El sidebar estará expandido por defecto
      isChildOfHeader={false} // Poner a true si tienes un <Header> de Carbon encima
      aria-label="Side navigation"
      // className="custom-sidebar-class" // Si necesitas aplicar estilos CSS adicionales
    >
      <SideNavItems>
        {navItems.map((item) => (
          <SideNavLink
            renderIcon={item.icon}
            as={Link} // MUY IMPORTANTE para la integración con React Router
            to={item.to}
            key={item.to} // Usar 'to' como key ya que es único para cada enlace
            isActive={ // Lógica para determinar si el enlace está activo
              location.pathname === item.to ||
              (item.to !== "/" && item.to !== "/dashboard" && location.pathname.startsWith(item.to))
            }
          >
            {item.label}
          </SideNavLink>
        ))}
        {/* Ejemplo de Submenú (si lo necesitas en el futuro):
        <SideNavMenu title="Management" renderIcon={SettingsIcon}>
          <SideNavMenuItem element={Link} to="/management/users"> {/* Usa element={Link} para subitems *}
            User Management
          </SideNavMenuItem>
        </SideNavMenu>
        */}
      </SideNavItems>
    </SideNav>
  );
}

export default Sidebar;