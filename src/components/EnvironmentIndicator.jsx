import React, { useEffect, useState } from 'react';
import { getApiBaseUrl, getAvailableEnvironments } from '../services/config';

function EnvironmentIndicator() {
  const [currentEnv, setCurrentEnv] = useState('development');
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    try {
      // Get current environment from URL
      const urlParams = new URLSearchParams(window.location.search);
      const envFromUrl = urlParams.get('env');
      
      // Set environment
      setCurrentEnv(envFromUrl || 'development');
      
      // Get and set the base URL
      const apiUrl = getApiBaseUrl();
      setBaseUrl(apiUrl || 'http://localhost:8090');
    } catch (error) {
      console.error('Error in EnvironmentIndicator:', error);
      setCurrentEnv('development');
      setBaseUrl('http://localhost:8090');
    }
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '10px', 
      right: '10px', 
      background: '#f0f0f0', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 1000,
      border: '1px solid #ccc',
      maxWidth: '300px',
      wordBreak: 'break-all'
    }}>
      <div>Current Environment: <strong>{currentEnv || 'development'}</strong></div>
      <div>API Base URL: <strong>{baseUrl || 'http://localhost:8090'}</strong></div>
      <div>Available Environments: {getAvailableEnvironments().join(', ')}</div>
    </div>
  );
}

export default EnvironmentIndicator; 