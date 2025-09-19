import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import estacionesService from '../../../services/estacionesService';
import ContentHeader from '../../../components/ContentHeader';
import './inicio.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for health stations
const estacionIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const InicioPage = () => {
  const [estaciones, setEstaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState([-34.6118, -58.3960]); // Buenos Aires por defecto
  const [mapZoom, setMapZoom] = useState(11);

  useEffect(() => {
    loadEstaciones();
  }, []);

  const loadEstaciones = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await estacionesService.get({ 
        limit: 1000, // Cargar todas las estaciones
        status: 'active' // Solo estaciones activas
      });
      
      if (response.success) {
        const estacionesData = response.data || [];
        setEstaciones(estacionesData);
        
        // Si hay estaciones, centrar el mapa en la primera estación
        if (estacionesData.length > 0) {
          const firstEstacion = estacionesData[0];
          if (firstEstacion.lat && firstEstacion.lon) {
            setMapCenter([parseFloat(firstEstacion.lat), parseFloat(firstEstacion.lon)]);
            setMapZoom(12);
          }
        }
      } else {
        setError(response.error || 'Error al cargar las estaciones');
      }
    } catch (err) {
      console.error('Error loading estaciones:', err);
      setError('Error al cargar las estaciones');
    } finally {
      setLoading(false);
    }
  };

  const renderEstacionPopup = (estacion) => (
    <Popup>
      <div className="estacion-popup">
        <h4 className="estacion-popup-title">{estacion.nombre}</h4>
        <div className="estacion-popup-content">
          <p><strong>Dirección:</strong> {estacion.direccion}</p>
          <p><strong>Estado:</strong> 
            <span className={`status-badge ${estacion.status}`}>
              {estacion.status === 'active' ? 'Activa' : 'Inactiva'}
            </span>
          </p>
          {estacion.descripcion && (
            <p><strong>Descripción:</strong> {estacion.descripcion}</p>
          )}
        </div>
      </div>
    </Popup>
  );

  if (loading) {
    return (
      <div className="inicio-page">
        <ContentHeader 
          title="Inicio"
          subtitle="Mapa de Estaciones Saludables"
        />
        <div className="loading-container">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
          </div>
          <p>Cargando estaciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="inicio-page">
        <ContentHeader 
          title="Inicio"
          subtitle="Mapa de Estaciones Saludables"
        />
        <div className="error-container">
          <div className="error-message">
            <i className="fas fa-exclamation-triangle"></i>
            <p>{error}</p>
            <button onClick={loadEstaciones} className="retry-button">
              <i className="fas fa-refresh"></i>
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="inicio-page">
      <ContentHeader 
        title="Inicio"
        subtitle="Mapa de Estaciones Saludables"
      />
      
      <div className="map-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-map-marker-alt"></i>
          </div>
          <div className="stat-content">
            <h3>{estaciones.length}</h3>
            <p>Estaciones Activas</p>
          </div>
        </div>
      </div>

      <div className="map-container">
        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          style={{ height: '600px', width: '100%' }}
          className="leaflet-map"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {estaciones.map((estacion) => {
            // Validar que las coordenadas sean válidas
            const lat = parseFloat(estacion.lat);
            const lon = parseFloat(estacion.lon);
            
            if (isNaN(lat) || isNaN(lon)) {
              console.warn(`Estación ${estacion.nombre} tiene coordenadas inválidas:`, estacion.lat, estacion.lon);
              return null;
            }
            
            return (
              <Marker
                key={estacion.id}
                position={[lat, lon]}
                icon={estacionIcon}
              >
                {renderEstacionPopup(estacion)}
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {estaciones.length === 0 && (
        <div className="no-estaciones">
          <i className="fas fa-map-marker-alt"></i>
          <h3>No hay estaciones disponibles</h3>
          <p>No se encontraron estaciones activas para mostrar en el mapa.</p>
        </div>
      )}
    </div>
  );
};

export default InicioPage;
