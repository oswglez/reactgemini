// src/components/TypesManagementPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, Column, Tile } from '@carbon/react';
import { 
  Image, 
  Category, 
  Hotel 
} from '@carbon/icons-react';

const containerStyle = {
  marginTop: '1rem',
  width: '100%',
  padding: '40px',
  backgroundColor: '#f9f9f9',
};

const tileStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  cursor: 'pointer',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  height: '100%',
  textAlign: 'center',
};

const iconStyle = {
  marginBottom: '1rem',
  width: '48px',
  height: '48px',
};

const titleStyle = {
  fontSize: '1.25rem',
  fontWeight: '600',
  marginBottom: '1rem',
  color: '#161616',
};

const descriptionStyle = {
  fontSize: '0.875rem',
  color: '#525252',
  lineHeight: '1.5',
};

function TypesManagementPage() {
  const navigate = useNavigate();

  const typeCards = [
    {
      title: 'Media Types',
      description: 'Manage different types of media content such as images, videos, and documents.',
      icon: Image,
      path: '/types/media'
    },
    {
      title: 'Amenity Types',
      description: 'Manage categories of amenities available in properties.',
      icon: Category,
      path: '/types/amenity'
    },
    {
      title: 'Room Types',
      description: 'Manage different types of rooms and accommodations.',
      icon: Hotel,
      path: '/types/room'
    }
  ];

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: 'center', color: '#3751ff', marginBottom: '10px' }}>Types Management</h2>
      <p style={{ fontSize: '0.875rem', color: '#555', marginBottom: '40px', textAlign: 'center' }}>
        Select a category to manage different types of content and features in the system.
      </p>

      <Grid>
        {typeCards.map((card, index) => (
          <Column key={index} lg={5} md={4} sm={4} style={{ marginBottom: '2rem' }}>
            <Tile
              style={{
                ...tileStyle,
                ':hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                },
              }}
              onClick={() => navigate(card.path)}
            >
              <card.icon size={32} style={iconStyle} />
              <h3 style={titleStyle}>{card.title}</h3>
              <p style={descriptionStyle}>{card.description}</p>
            </Tile>
          </Column>
        ))}
      </Grid>
    </div>
  );
}

export default TypesManagementPage;
