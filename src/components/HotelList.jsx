import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loading, 
  InlineNotification, 
  Button, 
  Pagination, 
  DataTable,
  TableContainer, 
  Table, 
  TableHead, 
  TableRow, 
  TableHeader, 
  TableBody, 
  TableCell,
  Search,
  Grid,
  Column
} from '@carbon/react';
import { Edit, TrashCan, View } from '@carbon/icons-react';
import { useAuthenticatedFetch } from '../services/apiService';

const decodeHotelStatus = (statusKey) => {
  const statusMap = { A: 'Active', P: 'Pending', I: 'Inactive' };
  return statusMap[statusKey] || statusKey;
};

function HotelList() {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [totalElements, setTotalElements] = useState(0);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('ASC');
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const authenticatedFetch = useAuthenticatedFetch();

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDeleteError(null);
    setDeleteSuccess(null);
    try {
      let url = `/hotels/hotelList?page=${currentPage}&size=${pageSize}`;
      if (sortColumn && sortDirection) {
        url += `&sort=${sortColumn},${sortDirection.toLowerCase()}`;
      }
      console.log('Fetching URL:', url);
      const response = await authenticatedFetch(url);
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${response.statusText || 'Could not fetch list'}. Body: ${errorBody}`);
      }
      const data = await response.json();
      console.log('Data received from API:', data);
      setHotels(data.content || []);
      setTotalElements(data.totalElements || 0);
      setCurrentPage(data.number || 0);
      setPageSize(data.size || 25);
    } catch (err) {
      setError(err.message || 'Could not load hotel list.');
      console.error('Error fetching hotels:', err);
      setHotels([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sortColumn, sortDirection, authenticatedFetch]);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  const handleSort = useCallback((columnKey) => {
    console.log(`handleSort (called by DataTable) for column: ${columnKey}`);
    if (sortColumn === columnKey) {
      setSortDirection(prevDirection => (prevDirection === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortColumn(columnKey);
      setSortDirection('ASC');
    }
    if (currentPage !== 0) {
      setCurrentPage(0);
    }
  }, [sortColumn, currentPage]);

  const handleDelete = async (hotelId) => {
    if (!window.confirm('Are you sure you want to delete this hotel?')) {
      return;
    }

    try {
      const response = await authenticatedFetch(`/hotels/${hotelId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${errorBody || 'Could not delete hotel'}`);
      }

      setDeleteSuccess('Hotel deleted successfully');
      setDeleteError(null);
      fetchHotels(); // Refresh the list
    } catch (err) {
      setDeleteError(err.message || 'Could not delete hotel');
      setDeleteSuccess(null);
      console.error('Error deleting hotel:', err);
    }
  };

  const handlePageChange = ({ page, pageSize }) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(0); // Reset to first page when searching
  };

  // Filter hotels based on search term
  const filteredHotels = hotels.filter(hotel =>
    hotel.hotelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotel.hotelCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotel.brand?.brandName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const headers = [
    { key: 'hotelCode', header: 'Hotel Code' },
    { key: 'hotelName', header: 'Hotel Name' },
    { key: 'brand', header: 'Brand' },
    { key: 'status', header: 'Status' },
    { key: 'actions', header: 'Actions' }
  ];

  const rows = filteredHotels.map(hotel => ({
    id: hotel.hotelId,
    hotelCode: hotel.hotelCode || 'N/A',
    hotelName: hotel.hotelName || 'N/A',
    brand: hotel.brand?.brandName || 'N/A',
    status: decodeHotelStatus(hotel.hotelStatus) || 'N/A',
    actions: (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button
          kind="ghost"
          size="sm"
          iconDescription="View"
          hasIconOnly
          onClick={() => navigate(`/hotel/${hotel.hotelId}`)}
        >
          <View />
        </Button>
        <Button
          kind="ghost"
          size="sm"
          iconDescription="Edit"
          hasIconOnly
          onClick={() => navigate(`/hotel/edit/${hotel.hotelId}`)}
        >
          <Edit />
        </Button>
        <Button
          kind="ghost"
          size="sm"
          iconDescription="Delete"
          hasIconOnly
          onClick={() => handleDelete(hotel.hotelId)}
        >
          <TrashCan />
        </Button>
      </div>
    )
  }));

  if (loading) {
    return <Loading description="Loading hotels..." />;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <Grid>
        <Column lg={16} md={8} sm={4}>
          <h1>Hotel List</h1>

          {error && (
            <InlineNotification
              kind="error"
              title="Error"
              subtitle={error}
              style={{ marginBottom: '1rem' }}
            />
          )}

          {deleteError && (
            <InlineNotification
              kind="error"
              title="Delete Error"
              subtitle={deleteError}
              style={{ marginBottom: '1rem' }}
            />
          )}

          {deleteSuccess && (
            <InlineNotification
              kind="success"
              title="Success"
              subtitle={deleteSuccess}
              style={{ marginBottom: '1rem' }}
            />
          )}

          <div style={{ marginBottom: '1rem' }}>
            <Search
              placeholder="Search hotels..."
              value={searchTerm}
              onChange={handleSearch}
              size="lg"
            />
          </div>

          <DataTable
            rows={rows}
            headers={headers}
            isSortable
            sortRow={(cellA, cellB, { sortDirection, sortStates, locale }) => {
              if (sortDirection === sortStates.ASC) {
                return cellA.localeCompare(cellB, locale);
              }
              return cellB.localeCompare(cellA, locale);
            }}
            onSort={handleSort}
          >
            {({ rows, headers, getTableProps, getTableContainerProps }) => (
              <TableContainer {...getTableContainerProps()}>
                <Table {...getTableProps()}>
                  <TableHead>
                    <TableRow>
                      {headers.map((header) => (
                        <TableHeader key={header.key} isSortable={header.key !== 'actions'}>
                          {header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.cells.map((cell) => (
                          <TableCell key={cell.id}>
                            {cell.value}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DataTable>

          <Pagination
            page={currentPage}
            pageSize={pageSize}
            pageSizes={[10, 25, 50, 100]}
            totalItems={totalElements}
            onChange={handlePageChange}
          />
        </Column>
      </Grid>
    </div>
  );
}

export default HotelList; 