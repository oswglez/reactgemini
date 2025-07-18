// src/components/Dashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, isLoading } = useAuth0();
  const quickActions = [
    { icon: '🏨', title: 'Add Hotel', description: 'Onboard new property', variant: 'carbon' },
    { icon: '🛏️', title: 'Add Room Types', description: 'Configure room types', variant: 'carbon' },
    { icon: '🚪', title: 'Add Room Units', description: 'Create individual rooms', variant: 'carbon' },
    { icon: '📷', title: 'Upload Media', description: 'Add photos & floorplans', variant: 'carbon' },
    { icon: '👥', title: 'Manage Users', description: 'Assign permissions', variant: 'carbon' },
    { icon: '💰', title: 'Set Pricing', description: 'Configure upsell rates', variant: 'carbon' },
    { icon: '📊', title: 'View Reports', description: 'Analytics & insights', variant: 'carbon' },
    { icon: '⬆️', title: 'Bulk Upload', description: 'Mass media import', variant: 'carbon' },
    { icon: '⚙️', title: 'Settings', description: 'System configuration', variant: 'carbon' },
    { icon: '📋', title: 'List Template', description: 'View demo & examples', variant: 'carbon' }
  ];

  const navigationCards = [
    {
      icon: '📊',
      title: 'Dashboard',
      description: 'Overview of implementation progress and system status',
      items: ['Implementation progress', 'Media completeness summary', 'Recent activity', 'System alerts'],
      status: 'complete',
      count: 12
    },
    {
      icon: '🏨',
      title: 'Hotels',
      description: 'Manage property-level settings and content',
      items: ['Property directory', 'Hotel profiles & policies', 'Media management', 'Floorplan uploads'],
      status: 'in-progress',
      count: 47
    },
    {
      icon: '🛏️',
      title: 'Room Types',
      description: 'Manage room type configurations and pricing',
      items: ['Room type definitions', 'Base pricing configuration', 'Occupancy limits', 'Amenity assignments'],
      status: 'in-progress',
      count: 4
    },
    {
      icon: '🚪',
      title: 'Room Units',
      description: 'Manage individual room unit details',
      items: ['Unit assignments', 'Physical locations', 'Representative photos', 'Availability status'],
      status: 'in-progress',
      count: 1842
    },
    {
      icon: '☕',
      title: 'Amenities',
      description: 'Manage hotel amenities and their availability',
      items: ['Amenity configuration', 'Availability status', 'Category management', 'Service details'],
      status: 'in-progress',
      count: 8
    },
    {
      icon: '👥',
      title: 'Users & Permissions',
      description: 'Control access and user management',
      items: ['User directory', 'Role assignments', 'Permission control', 'Access management'],
      count: 23
    },
    {
      icon: '💰',
      title: 'Pricing & Availability',
      description: 'Manage PMS sync and upsell pricing',
      items: ['PMS integration status', 'Manual pricing override', 'Upsell configurations', 'Dynamic pricing rules'],
      status: 'complete'
    },
    {
      icon: '📊',
      title: 'Reports & Analytics',
      description: 'Monitor performance and engagement metrics',
      items: ['Engagement heatmaps', 'Revenue analytics', 'Implementation tracking', 'Conversion metrics']
    },
    {
      icon: '📷',
      title: 'Media Library',
      description: 'Advanced media workflows and bulk management',
      items: ['Bulk upload tools', 'Image organization', 'Floorplan management', 'Media audit dashboard'],
      status: 'pending'
    },
    {
      icon: '⚙️',
      title: 'Settings',
      description: 'System-wide configuration and integrations',
      items: ['System preferences', 'PMS/API integrations', 'Branding configuration', 'Notification settings']
    },
    {
      icon: '❓',
      title: 'Support Center',
      description: 'Assistance and self-service resources',
      items: ['Knowledge base', 'Support tickets', 'Contact ExpectraAI', 'System status']
    }
  ];

  const recentActivity = [
    {
      id: '1',
      type: 'hotel',
      title: 'New hotel onboarded',
      description: 'Grand Plaza Hotel added to system',
      time: '2 hours ago',
      status: 'success',
      user: 'Sarah Chen'
    },
    {
      id: '2',
      type: 'media',
      title: 'Media upload completed',
      description: '127 images uploaded for Oceanview Resort',
      time: '4 hours ago',
      status: 'success',
      user: 'Mike Rodriguez'
    },
    {
      id: '3',
      type: 'room',
      title: 'Room types configured',
      description: '15 room types added for Downtown Suites',
      time: '6 hours ago',
      status: 'info',
      user: 'Anna Kim'
    },
    {
      id: '4',
      type: 'system',
      title: 'PMS sync warning',
      description: 'Connection timeout for Hilltop Inn - requires attention',
      time: '8 hours ago',
      status: 'warning',
      user: 'System'
    },
    {
      id: '5',
      type: 'user',
      title: 'New user invited',
      description: 'Hotel manager access granted for Seaside Resort',
      time: '1 day ago',
      status: 'info',
      user: 'Admin'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'complete': return 'status-complete';
      case 'in-progress': return 'status-in-progress';
      case 'pending': return 'status-pending';
      default: return 'status-default';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'hotel': return '🏨';
      case 'room': return '🛏️';
      case 'media': return '📷';
      case 'user': return '👥';
      case 'system': return '⚠️';
      default: return '🕐';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const getStatusColorClass = (status) => {
    switch (status) {
      case 'success': return 'status-success';
      case 'warning': return 'status-warning';
      default: return 'status-info';
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-container">
              <span className="logo-icon">🏨</span>
            </div>
            <div className="header-text">
              <h1 className="header-title">ExpectraAI</h1>
              <p className="header-subtitle">Hotel Admin Portal</p>
            </div>
          </div>
          <div className="header-right">
            <div className="user-info">
              <div className="user-avatar">
                {isLoading ? (
                  <span className="user-icon">⏳</span>
                ) : user?.picture ? (
                  <img 
                    src={user.picture} 
                    alt={user.name || 'User'} 
                    className="user-avatar-img"
                  />
                ) : (
                  <span className="user-icon">👤</span>
                )}
              </div>
              <div className="user-details">
                <p className="user-name">
                  {isLoading ? 'Loading...' : (user?.name || 'User')}
                </p>
                <p className="user-email">
                  {isLoading ? 'Loading...' : (user?.email || 'No email')}
                </p>
              </div>
              <button 
                onClick={() => logout({ returnTo: window.location.origin })}
                className="logout-button"
                title="Logout"
                disabled={isLoading}
              >
                🚪
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Welcome Section */}
        <div className="welcome-section">
          <h1 className="welcome-title">Welcome to ExpectraAI Hotel Admin</h1>
          <p className="welcome-description">
            Manage your hotel properties, rooms, and media assets with our comprehensive admin portal. 
            Configure settings, track performance, and optimize guest experiences across all your properties.
          </p>
          {isAuthenticated && user && (
            <div className="auth-status">
              <p className="auth-message">
                ✅ Authenticated as: <strong>{user.name}</strong> ({user.email})
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-card">
          <div className="card-header">
            <div className="card-title">
              <div className="title-icon">➕</div>
              Quick Actions
            </div>
          </div>
          <div className="card-content">
            <div className="quick-actions-grid">
              {quickActions.map((action, index) => (
                <button 
                  key={index} 
                  className={`action-button action-${action.variant}`}
                >
                  <span className="action-icon">{action.icon}</span>
                  <div className="action-text">
                    <div className="action-title">{action.title}</div>
                    <div className="action-description">{action.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="stats-section">
          <p className="stats-placeholder">Additional metrics will be displayed here as needed.</p>
        </div>

        {/* Main Navigation Grid */}
        <div className="navigation-section">
          <h2 className="section-title">Main Sections</h2>
          <div className="navigation-grid">
            {navigationCards.map((card, index) => (
              <div 
                key={index} 
                className="navigation-card"
                onClick={() => {
                  if (card.title === 'Hotels') {
                    navigate('/hotels');
                  } else if (card.title === 'Room Types') {
                    navigate('/types/room');
                  }
                }}
                style={{ cursor: (card.title === 'Hotels' || card.title === 'Room Types') ? 'pointer' : 'default' }}
              >
                <div className="card-header">
                  <div className="card-header-top">
                    <div className="card-icon-container">
                      <span className="card-icon">{card.icon}</span>
                    </div>
                    <div className="card-header-right">
                      {card.count && (
                        <span className={`status-badge ${getStatusColor(card.status)}`}>
                          {card.count}
                        </span>
                      )}
                      <span className="arrow-icon">➡️</span>
                    </div>
                  </div>
                  <h3 className="card-title">{card.title}</h3>
                </div>
                <div className="card-content">
                  <p className="card-description">{card.description}</p>
                  <ul className="card-items">
                    {card.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="card-item">
                        <span className="item-bullet"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-activity-card">
          <div className="card-header">
            <div className="card-title">
              <div className="title-icon">🕐</div>
              Recent Activity
            </div>
          </div>
          <div className="card-content">
            <div className="activity-list">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-icon-container">
                    <span className="activity-icon">{getActivityIcon(activity.type)}</span>
                  </div>
                  <div className="activity-content">
                    <div className="activity-header">
                      <div className="activity-info">
                        <h4 className="activity-title">{activity.title}</h4>
                        <p className="activity-description">{activity.description}</p>
                        <div className="activity-meta">
                          <span className="user-badge">{activity.user}</span>
                          <span className="activity-time">{activity.time}</span>
                        </div>
                      </div>
                      <span className={`status-icon ${getStatusColorClass(activity.status)}`}>
                        {getStatusIcon(activity.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
      </div>
      </main>
    </div>
  );
};

export default Dashboard;