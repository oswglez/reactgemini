// src/components/HotelList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Loading,
  InlineNotification,
  Button,
  Checkbox,
  Pagination,
  DataTable, // Importar DataTable
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  // Opcional: si quieres usar la toolbar de DataTable
  // TableToolbar,
  // TableToolbarContent,
  // TableToolbarSearch,
  // TableBatchActions,
  // TableBatchAction,
} from '@carbon/react';
import { AddFilled, ArrowUp, ArrowDown, ArrowsVertical } from '@carbon/icons-react';

const containerStyle = {
  marginTop: '1rem',
  width: '100%',
  padding: '20px',
  border: '2px solid blue',
  backgroundColor: '#f9f9f9',
};

const actionButtonStyle = {
  marginRight: '0.5rem',
};

const headerButtonContainerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
};

const tableTitleContainerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
};

function HotelList() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRowIds, setSelectedRowIds] = useState({}); // Para DataTable, la selección se maneja por IDs de fila

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [totalElements, setTotalElements] = useState(0);

  const [sortColumn, setSortColumn] = useState('hotelName');
  const [sortDirection, setSortDirection] = useState('ASC'); // DataTable suele usar 'ASC'/'DESC'

  const fetchHotels = useCallback(async (page, size, column, direction) => {
    setLoading(true);
    setError(null);
    try {
      let url = `http://localhost:8090/api/hotels/hotelList?page=${page}&size=${size}`;
      if (column && direction) {
        // Asegúrate que el backend espera 'asc' o 'desc' en minúsculas si es así
        url += `&sort=${column},${direction.toLowerCase()}`;
      }
      console.log('Fetching URL:', url);
      const response = await fetch(url);
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
  }, []);

  useEffect(() => {
    console.log('useEffect triggered with:', { currentPage, pageSize, sortColumn, sortDirection });
    fetchHotels(currentPage, pageSize, sortColumn, sortDirection);
  }, [fetchHotels, currentPage, pageSize, sortColumn, sortDirection]);

  // `handleSort` se llamará por DataTable a través de los TableHeader generados
  const handleSort = useCallback((columnKey) => {
    console.log(`handleSort (called by DataTable) for column: ${columnKey}`);
    if (sortColumn === columnKey) {
      setSortDirection(prevDirection => (prevDirection === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortColumn(columnKey);
      setSortDirection('ASC');
    }
    if (currentPage !== 0) {
      setCurrentPage(0); // Resetear a la primera página al cambiar el ordenamiento
    }
  }, [sortColumn, currentPage]);


  const getSortIcon = useCallback((columnKey) => {
    if (sortColumn === columnKey) {
      return sortDirection === 'ASC' ? <ArrowUp size={16} /> : <ArrowDown size={16} />;
    }
    // No mostramos ArrowsVertical por defecto si DataTable maneja sus propios indicadores o ninguno
    return null; // O <ArrowsVertical size={16} style={{ opacity: 0.3 }} />; si prefieres
  }, [sortColumn, sortDirection]);

  // Definición de encabezados para DataTable
  // Las 'key' deben coincidir con las propiedades de los objetos en 'tableRows'
  const dataTableHeaders = [
    // Para selección, DataTable tiene su propio mecanismo (TableSelectRow, TableSelectAll)
    // Si quieres un checkbox personalizado, puedes renderizarlo en una TableCell.
    // Por simplicidad, lo omitiré aquí, pero se puede añadir como una columna normal no ordenable.
    { key: 'hotelCode', header: 'Code', isSortable: true, style: { width: '100px' } },
    { key: 'hotelChain', header: 'Chain', isSortable: true, style: { width: '120px' } },
    { key: 'hotelBrand', header: 'Brand', isSortable: true, style: { width: '120px' } },
    { key: 'hotelName', header: 'Hotel Name', isSortable: true, style: { width: '220px' } },
    { key: 'hotelStreet', header: 'Street', isSortable: true, style: { width: '200px' } },
    { key: 'hotelCity', header: 'City', isSortable: true, style: { width: '120px' } },
    { key: 'hotelState', header: 'State', isSortable: true, style: { width: '100px' } },
    { key: 'hotelCountry', header: 'Country', isSortable: true, style: { width: '100px' } },
    { key: 'contactFirstName', header: 'Contact First', isSortable: true, style: { width: '130px' } },
    { key: 'contactLastName', header: 'Contact Last', isSortable: true, style: { width: '130px' } },
    { key: 'contactTitle', header: 'Title', isSortable: true, style: { width: '150px' } },
    { key: 'hotelWebsiteUrl', header: 'Website', isSortable: false, style: { width: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } },
    { key: 'hotelStatus', header: 'Status', isSortable: true, style: { width: '100px' } },
    { key: 'actions', header: 'Actions', isSortable: false, style: { width: '100px' } }, // Columna de acciones
  ];

  // Adaptar los datos para DataTable (cada fila necesita un 'id' string)
  const tableRows = hotels.map(hotel => ({
    ...hotel,
    id: hotel.hotelId.toString(), // DataTable espera un 'id' string en cada fila
    // Si las keys de los headers no coinciden con las de hotel, mapear aquí:
    // hotelCode: hotel.hotelCode, hotelChain: hotel.hotelChain, etc.
  }));

  const handlePaginationChange = ({ page, pageSize: newPageSize }) => {
    const newRequestedPage = page - 1; // Pagination es 1-based, nuestro estado es 0-based
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setCurrentPage(0); // Resetear a la primera página si cambia el tamaño
    } else if (newRequestedPage !== currentPage) {
      setCurrentPage(newRequestedPage);
    }
  };

  // Para manejar la selección si usas los componentes de selección de DataTable
  const handleSelectRow = (rowId) => {
    setSelectedRowIds(prev => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };
  
  const getSelectedHotelObjects = () => {
    return hotels.filter(hotel => selectedRowIds[hotel.hotelId.toString()]);
  };


  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: 'center', color: '#3751ff', marginBottom: '10px' }}>
        SelectVista AI Properties
      </h2>
      <p style={{ fontSize: '0.875rem', color: '#555', marginBottom: '20px', textAlign: 'center' }}>
        Below you will find the list of properties in the SelectVista AI platform.
        To create a new property select "Create New Property".
        To view or edit the details of a property, select the corresponding row and click on "View Details".
      </p>

      <div style={headerButtonContainerStyle}>
        <div /> {/* Espaciador */}
        <Link to="/hotel/new" style={{ textDecoration: 'none' }}>
          <Button kind="primary" renderIcon={AddFilled}>Create New Property</Button>
        </Link>
      </div>

      <div style={tableTitleContainerStyle}>
        <h3>List of Hotels ({totalElements})</h3>
        <div>
          <Button kind="secondary" style={actionButtonStyle} disabled={getSelectedHotelObjects().length === 0}>
            View Property Amenities
          </Button>
          <Button kind="secondary" disabled={getSelectedHotelObjects().length !== 1}>
            View Property Details
          </Button>
        </div>
      </div>

      {loading && <Loading description="Loading hotels..." withOverlay={false} style={{ marginTop: '2rem' }} />}
      {!loading && error && (
        <InlineNotification
          kind="error"
          title="Error Loading List"
          subtitle={error}
          onCloseButtonClick={() => setError(null)}
          lowContrast
        />
      )}

      {!loading && !error && (
        <>
          {hotels.length === 0 ? (
            <p style={{ textAlign: 'center', marginTop: '2rem' }}>No hotels registered yet.</p>
          ) : (
            <DataTable
              rows={tableRows}
              headers={dataTableHeaders}
              isSortable // Habilita la funcionalidad de ordenamiento de DataTable
              // La prop `sortRow` es para ordenamiento del lado del cliente.
              // Para el ordenamiento del lado del servidor, gestionamos el estado y re-fetch.
              // DataTable usará `sortDirection` y `sortHeaderKey` de sus props (si se pasan)
              // o manejará clics en `TableHeader` para disparar su lógica de ordenamiento.
              // No hay una prop `onSort` directa en todas las versiones/usos de DataTable;
              // el ordenamiento se maneja a través de `getHeaderProps` y el estado.
            >
              {({
                rows: dtRows, // Filas procesadas por DataTable
                headers: dtHeaders,
                getHeaderProps, // Importante para los encabezados
                getRowProps,
                getTableProps,
                // getBatchActionProps, // Para acciones en lote
                // getSelectionProps, // Para checkboxes de selección
                // getToolbarProps, // Para la barra de herramientas
                // ... más props del render prop
              }) => (
                <TableContainer>
                  {/* Ejemplo de Toolbar (opcional) */}
                  {/* <TableToolbar {...getToolbarProps()}>
                    <TableToolbarContent>
                      <TableToolbarSearch persistent="true" />
                    </TableToolbarContent>
                  </TableToolbar> */}
                  <Table {...getTableProps()} size="md" useZebraStyles={false}>
                    <TableHead>
                      <TableRow>
                        {/* Si necesitas selección, descomenta y adapta */}
                        {/* <TableSelectAll {...getBatchActionProps().onSelectAll ? getBatchActionProps() : {}} /> */}
                        {dtHeaders.map((header) => {
                          const headerProps = getHeaderProps({ header });
                          return (
                            <TableHeader
                              key={header.key}
                              {...headerProps} // Esto incluye el onClick para ordenamiento si header.isSortable
                              // El onClick original se reemplaza por el de getHeaderProps
                              // Si header.isSortable, Carbon adjuntará su propio onClick
                              // que actualiza el estado interno de DataTable. Necesitamos que ese
                              // estado se refleje en nuestro `sortColumn` y `sortDirection`.
                              // Para ordenamiento controlado por el servidor, usualmente interceptas esto.
                              onClick={() => { // Sobrescribimos/Añadimos nuestro onClick
                                console.log(`TableHeader clicked (via DataTable pattern): ${header.key}, isSortable: ${header.isSortable}`);
                                if (header.isSortable) {
                                  handleSort(header.key); // Llama a nuestra función de ordenamiento
                                }
                                // Si getHeaderProps tiene su propio onClick, y quieres que también se ejecute:
                                // if (headerProps.onClick) {
                                //   headerProps.onClick();
                                // }
                              }}
                              style={{ ...header.style }} // Mantén tus estilos si es necesario
                              isSortable={header.isSortable} // Pasar explícitamente
                            >
                              {header.header}
                              {/* DataTable usualmente maneja el ícono, pero si no lo hace, podemos usar el nuestro */}
                              {header.isSortable && (
                                <span style={{ marginLeft: '8px' }}>
                                  {getSortIcon(header.key)}
                                </span>
                              )}
                            </TableHeader>
                          );
                        })}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dtRows.map((row) => (
                        <TableRow {...getRowProps({ row })} key={row.id}>
                          {/* Si necesitas selección */}
                          {/* <TableSelectRow {...getSelectionProps({ row })} /> */}
                          {row.cells.map((cell) => {
                            // Renderizado especial para columnas como 'actions' o 'hotelWebsiteUrl'
                            if (cell.info.header === 'actions') {
                              return (
                                <TableCell key={cell.id}>
                                  <Link
                                    to={`/hotel/${row.id}`} // row.id es el hotelId
                                    state={{ hotelName: hotels.find(h => h.hotelId.toString() === row.id)?.hotelName }}
                                    style={{ textDecoration: 'none' }}
                                  >
                                    <Button size="sm" kind="tertiary">Select</Button>
                                  </Link>
                                </TableCell>
                              );
                            }
                            if (cell.info.header === 'hotelWebsiteUrl') {
                              return (
                                <TableCell key={cell.id} style={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {cell.value ? (
                                    <a
                                      href={cell.value.toString().startsWith('http') ? cell.value.toString() : `http://${cell.value}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: '#0f62fe', textDecoration: 'underline' }}
                                    >
                                      {cell.value}
                                    </a>
                                  ) : 'N/A'}
                                </TableCell>
                              );
                            }
                            // Renderizado por defecto
                            return (
                              <TableCell key={cell.id}>
                                {cell.value !== null && cell.value !== undefined ? cell.value.toString() : 'N/A'}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </DataTable>
          )}
          {totalElements > 0 && hotels.length > 0 && (
            <Pagination
              totalItems={totalElements}
              pageSize={pageSize}
              pageSizes={[10, 25, 50, 100]}
              page={currentPage + 1} // La paginación de Carbon es 1-based
              onChange={handlePaginationChange}
              style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}
            />
          )}
        </>
      )}
    </div>
  );
}

export default HotelList;