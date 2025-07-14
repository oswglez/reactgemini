# RoomUnitsList Component

## Descripción
El componente `RoomUnitsList` es una interfaz moderna y funcional para gestionar las unidades de habitación (room units) de un hotel específico. Está basado en la estructura del componente `HotelList` actual y utiliza DataTable de Carbon Design System para mostrar y gestionar habitaciones.

## Características

### 🎯 Funcionalidades Principales
- **Visualización en tabla**: Muestra todas las habitaciones de un hotel en formato DataTable
- **Ordenamiento**: Capacidad de ordenar por columnas específicas
- **Paginación**: Navegación entre páginas de resultados
- **Gestión de permisos**: Control de acceso basado en roles de usuario
- **Acciones CRUD**: Crear, editar, ver detalles y eliminar habitaciones
- **Selección de filas**: Sistema de selección tipo radio para acciones

### 🎨 Diseño
- **Interfaz moderna**: Utiliza Carbon Design System DataTable para una experiencia consistente
- **Layout responsivo**: Se adapta a diferentes tamaños de pantalla
- **Selección visual**: Sistema de selección tipo radio con filas interactivas
- **Estados de carga**: Indicadores de progreso y manejo de errores
- **Ordenamiento visual**: Iconos de flecha para indicar dirección de ordenamiento

## Uso

### Rutas
El componente se accede a través de la ruta:
```
/hotels/{hotelId}/rooms
```

### Props
El componente utiliza `useParams()` para obtener el `hotelId` de la URL.

### Dependencias
```javascript
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { apiService } from '../services/apiService';
```

## API Integration

### Endpoint Principal
```
GET /api/hotels/{hotelId}/roomsDTO
```

### Estructura de Respuesta
```json
{
  "hotelId": 1,
  "hotelName": "Hotel Example",
  "hotelCode": "HOTEL001",
  "totalFloors": 10,
  "totalRooms": 50,
  "rooms": [
    {
      "roomId": 1,
      "roomNumber": "101",
      "roomType": "STANDARD",
      "roomName": "Standard Room 101",
      "roomDescription": "Comfortable standard room",
      "roomBuildingName": "Main Building",
      "roomBuildingCode": "MB",
      "roomFloor": 1,
      "roomPrice": 150.00,
      "roomXCoordinates": "10.5",
      "roomYCoordinates": "20.3"
    }
  ]
}
```

## Estructura de la Tabla

### Columnas de la DataTable
1. **Select**: Checkbox para selección de fila
2. **Room Number**: Número de habitación
3. **Type**: Tipo de habitación
4. **Room Name**: Nombre de la habitación
5. **Building**: Edificio donde se encuentra
6. **Floor**: Piso de la habitación
7. **Price**: Precio de la habitación (formateado como moneda)
8. **Description**: Descripción de la habitación
9. **Building Code**: Código del edificio

### Funcionalidades de la Tabla
- **Ordenamiento**: Click en encabezados para ordenar
- **Selección**: Checkbox para seleccionar filas
- **Paginación**: Navegación entre páginas
- **Estados visuales**: Filas seleccionadas destacadas

## Servicios API

### RoomUnits Service
El componente utiliza el servicio `apiService.roomUnits` que incluye:

```javascript
// Obtener habitaciones de un hotel
apiService.roomUnits.getByHotelId(hotelId, getAccessTokenSilently)

// Eliminar una habitación
apiService.roomUnits.delete(roomId, getAccessTokenSilently)

// Obtener habitación específica
apiService.roomUnits.getById(roomId, getAccessTokenSilently)

// Crear nueva habitación
apiService.roomUnits.create(hotelId, roomData, getAccessTokenSilently)

// Actualizar habitación
apiService.roomUnits.update(roomId, roomData, getAccessTokenSilently)
```

## Control de Acceso

### Roles de Usuario
- **SUPER_USER**: Acceso completo
- **CHAIN_ADMIN**: Acceso completo
- **BRAND_ADMIN**: Acceso completo
- **HOTEL_ADMIN**: Acceso completo
- **HOTEL_MANAGER**: Solo lectura y edición
- **HOTEL_STAFF**: Solo lectura
- **HOTEL_VIEWER**: Solo lectura

### Permisos
- **canEdit**: Permite editar habitaciones
- **canDelete**: Permite eliminar habitaciones
- **canView**: Permite ver detalles

## Navegación

### Rutas Relacionadas
- `/hotels` - Lista de hoteles
- `/hotels/{hotelId}/rooms/new` - Crear nueva habitación
- `/hotels/{hotelId}/rooms/edit/{roomId}` - Editar habitación
- `/hotels/{hotelId}/rooms/{roomId}/details` - Ver detalles de habitación
- `/hotels/{hotelId}/rooms/{roomId}/amenities` - Ver amenities de habitación
- `/hotels/{hotelId}/rooms/{roomId}/media` - Ver media de habitación

## Estados del Componente

### Loading States
- Carga inicial de datos
- Operaciones de eliminación
- Actualizaciones de datos

### Error States
- Error de conexión
- Error de permisos
- Error de eliminación

### Success States
- Eliminación exitosa
- Actualización exitosa

## Estilos

### Estructura de Estilos
Los estilos están definidos como objetos JavaScript inline para mantener la consistencia con Carbon Design System:

```javascript
const containerStyle = { 
  marginTop: '1rem', 
  width: '100%', 
  padding: '20px', 
  backgroundColor: '#f9f9f9' 
};
```

### Componentes Carbon Utilizados
- `DataTable` - Tabla de datos principal
- `TableContainer` - Contenedor de tabla
- `Table` - Tabla base
- `TableHead` - Encabezado de tabla
- `TableBody` - Cuerpo de tabla
- `TableRow` - Fila de tabla
- `TableCell` - Celda de tabla
- `TableHeader` - Encabezado de columna
- `Loading` - Indicadores de carga
- `InlineNotification` - Notificaciones de estado
- `Button` - Botones de acción
- `Checkbox` - Selección de elementos
- `Modal` - Confirmaciones
- `Pagination` - Navegación de páginas

## Funcionalidades de Ordenamiento

### Columnas Ordenables
- Room Number
- Type
- Room Name
- Building
- Floor
- Price
- Building Code

### Lógica de Ordenamiento
```javascript
const handleSort = useCallback((columnKey) => {
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
```

## Funcionalidades de Paginación

### Configuración
- **Tamaños de página**: 10, 25, 50, 100 elementos
- **Navegación**: Botones de anterior/siguiente
- **Información**: Mostrar total de elementos y página actual

### Manejo de Cambios
```javascript
const handlePaginationChange = ({ page, pageSize: newPageSize }) => {
  const newRequestedPage = page - 1;
  if (newPageSize !== pageSize) {
    setPageSize(newPageSize);
    setCurrentPage(0);
  } else if (newRequestedPage !== currentPage) {
    setCurrentPage(newRequestedPage);
  }
};
```

## Mejoras Futuras

### Funcionalidades Sugeridas
- [ ] Filtros avanzados por tipo, piso, precio
- [ ] Búsqueda en tiempo real
- [ ] Exportación de datos a CSV/Excel
- [ ] Vista de calendario de disponibilidad
- [ ] Gestión de amenities por habitación
- [ ] Gestión de media por habitación
- [ ] Vista de mapa de habitaciones
- [ ] Selección múltiple para operaciones en lote

### Optimizaciones
- [ ] Lazy loading de datos
- [ ] Caché de datos
- [ ] Optimización de re-renders
- [ ] Compresión de datos
- [ ] Virtualización de filas para grandes datasets

## Troubleshooting

### Problemas Comunes
1. **Error 404**: Verificar que el hotelId existe
2. **Error 403**: Verificar permisos de usuario
3. **Error de red**: Verificar conectividad y configuración de API
4. **Datos vacíos**: Verificar que el hotel tenga habitaciones registradas
5. **Ordenamiento no funciona**: Verificar que la columna sea ordenable
6. **Paginación no actualiza**: Verificar el estado de currentPage

### Debug
- Revisar la consola del navegador para errores
- Verificar el estado de autenticación
- Comprobar la respuesta de la API
- Validar los permisos del usuario
- Verificar el estado de los hooks (useState, useEffect) 