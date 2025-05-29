// src/components/MapComponent.jsx
import { useJsApiLoader } from '@react-google-maps/api';
import { useState } from 'react';
import { useGeolocated } from 'react-geolocated';
import { mapConfig } from '../config/googleMapsConfig';
// ... otras importaciones ...

const MapComponent = () => {
  const { isLoaded } = useJsApiLoader(mapConfig);

  const [markers, setMarkers] = useState([]);
  const [distance, setDistance] = useState(0);
  const [isTracking, setIsTracking] = useState(false);

  const {
    coords,
    positionError,
    getPosition
  } = useGeolocated({
    positionOptions: {
      enableHighAccuracy: true,  // ¡ESTO ES CRÍTICO! Le dice al dispositivo que use el GPS.
      timeout: 10000,           // Dale tiempo suficiente para obtener una señal (ej. 10 segundos).
      maximumAge: 0             // ¡ESTO ES CRÍTICO! Fuerzale a NO usar una posición cacheada.
    },
    userDecisionTimeout: 5000,
    isGeolocationEnabled: isTracking,
    watchPosition: false,
    suppressLocationOnMount: true
  });

  // ... resto del código ...

  // Reemplaza tu función haversineDistance
  // function haversineDistance(...) { ... }

  const handleStartTracking = () => {
    console.log('Iniciando seguimiento...');
    setIsTracking(true);
    getPosition();
  };

  const formatDistance = (meters) => {
    // Redondear a múltiplos de 10 metros
    return Math.round(meters / 10) * 10;
  };

  const handleRegisterGeolocation = () => {
    console.log('Intentando registrar ubicación...');
    console.log('Coords:', coords);
    console.log('Is Loaded:', isLoaded);
    
    if (!coords) {
      console.log('No hay coordenadas disponibles');
      alert('No hay datos de ubicación disponibles. Por favor, espera un momento y vuelve a intentarlo.');
      return;
    }

    if (!isLoaded) {
      console.log('Google Maps no está cargado');
      alert('El mapa de Google aún no está cargado. Por favor, espera un momento.');
      return;
    }

    // Redondear las coordenadas a 4 decimales para reducir precisión
    const newPoint = {
      lat: Number(coords.latitude.toFixed(4)),
      lng: Number(coords.longitude.toFixed(4)),
      timestamp: new Date(),
      accuracy: Math.round(coords.accuracy)
    };
    console.log('Nuevo punto a registrar:', newPoint);

    setMarkers(prevMarkers => {
      const updatedMarkers = [...prevMarkers, newPoint];
      console.log('Marcadores actualizados:', updatedMarkers);
      return updatedMarkers;
    });

    if (markers.length >= 1) {
      const firstPoint = markers[0];
      const lastPoint = newPoint;

      if (window.google) {
        const googleMapsDistance = window.google.maps.geometry.spherical.computeDistanceBetween(
          new window.google.maps.LatLng(firstPoint.lat, firstPoint.lng),
          new window.google.maps.LatLng(lastPoint.lat, lastPoint.lng)
        );
        console.log('Distancia calculada:', googleMapsDistance);
        setDistance(formatDistance(googleMapsDistance));
      }
    }
  };

  return (
    <div>
      {!isTracking ? (
        <button onClick={handleStartTracking}>
          Iniciar Seguimiento
        </button>
      ) : (
        <>
          <button 
            onClick={handleRegisterGeolocation} 
            disabled={!coords}
            style={{ 
              padding: '10px 20px',
              margin: '10px 0',
              backgroundColor: coords ? '#4CAF50' : '#cccccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: coords ? 'pointer' : 'not-allowed'
            }}
          >
            Registrar Ubicación
          </button>
          {coords && (
            <p>
              Ubicación actual: {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
              <br />
              Precisión: {Math.round(coords.accuracy)} metros
            </p>
          )}
        </>
      )}
      {markers.length > 0 && (
        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
          <h3>Puntos registrados: {markers.length}</h3>
          {markers.map((marker, index) => (
            <p key={index}>
              Punto {index + 1}: {marker.lat}, {marker.lng}
            </p>
          ))}
          {markers.length >= 2 && (
            <div>
              <p>Distancia entre primer y último punto: {distance} metros</p>
              <p>
                Primer punto: {markers[0].lat}, {markers[0].lng}
                <br />
                Último punto: {markers[markers.length - 1].lat}, {markers[markers.length - 1].lng}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MapComponent;