// src/components/MapComponent.jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useGeolocated } from 'react-geolocated';

const containerStyle = {
  width: '100%',
  height: '600px',
  marginBottom: '20px' // Espacio para los controles
};

const center = {
  lat: -33.4489, // Santiago, Chile como centro inicial
  lng: -70.6693
};

// Función para calcular la distancia entre dos puntos (fórmula de Haversine)
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = lat1 * Math.PI / 180; // lat1 en radianes
  const φ2 = lat2 * Math.PI / 180; // lat2 en radianes
  const Δφ = (lat2 - lat1) * Math.PI / 180; // Diferencia de latitud en radianes
  const Δλ = (lon2 - lon1) * Math.PI / 180; // Diferencia de longitud en radianes

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c; // Distancia en metros
  return d;
}

const MapComponent = () => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_Maps_API_KEY
  });

  const mapRef = useRef(null);
  const [markers, setMarkers] = useState([]);
  const [distance, setDistance] = useState(0);
  const [circle, setCircle] = useState(null);

  const {
    coords,
    isGeolocationAvailable,
    isGeolocationEnabled,
    positionError // Para capturar errores de geolocalización
  } = useGeolocated({
    positionOptions: {
      enableHighAccuracy: true, // ¡Importante! Pedir alta precisión
      timeout: 10000,           // Esperar hasta 10 segundos por una lectura
      maximumAge: 0             // No usar una posición en caché
    },
    userDecisionTimeout: 5000,
  });

  const onLoad = useCallback(function callback(map) {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(function callback(map) {
    mapRef.current = null;
  }, []);

  // Función para registrar la geolocalización actual
  const handleRegisterGeolocation = () => {
    if (coords) {
      const newPoint = {
        lat: coords.latitude,
        lng: coords.longitude,
        timestamp: new Date(),
        accuracy: coords.accuracy // Guardar la precisión también
      };
      const updatedMarkers = [...markers, newPoint];
      setMarkers(updatedMarkers);

      // Calcular distancia si hay al menos dos puntos
      if (updatedMarkers.length >= 2) {
        const firstPoint = updatedMarkers[0];
        const lastPoint = updatedMarkers[updatedMarkers.length - 1];
        const dist = haversineDistance(
          firstPoint.lat,
          firstPoint.lng,
          lastPoint.lat,
          lastPoint.lng
        );
        setDistance(dist);
      }
    } else if (positionError) {
      alert(`Error de geolocalización: ${positionError.message}. Código: ${positionError.code}`);
    } else {
      alert("No se pudo obtener la geolocalización. Asegúrate de que los permisos estén habilitados y que el dispositivo pueda obtener una señal.");
    }
  };

  useEffect(() => {
    if (coords && mapRef.current) {
      // Centrar el mapa en la posición actual cuando se obtiene la geolocalización
      mapRef.current.panTo({ lat: coords.latitude, lng: coords.longitude });
    }
  }, [coords]);

  useEffect(() => {
    if (coords && mapRef.current && isLoaded) {
      // Eliminar el círculo anterior si existe
      if (circle) {
        circle.setMap(null);
      }

      // Crear nuevo círculo
      const newCircle = new window.google.maps.Circle({
        strokeColor: '#0000FF',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#0000FF',
        fillOpacity: 0.15,
        map: mapRef.current,
        center: { lat: coords.latitude, lng: coords.longitude },
        radius: coords.accuracy
      });

      setCircle(newCircle);
    }
  }, [coords, isLoaded]);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Medición de Puntos con Geolocalización</h1>
      <p>
        <small>
          **Nota:** La precisión de la geolocalización del navegador puede variar significativamente
          dependiendo del dispositivo, la señal GPS/Wi-Fi/móvil y la configuración del sistema operativo.
          Para mayor precisión, asegúrate de tener una buena señal GPS y Wi-Fi activado.
        </small>
      </p>

      {!isGeolocationAvailable && (
        <p style={{ color: 'red' }}>Tu navegador no soporta la API de Geolocation.</p>
      )}
      {!isGeolocationEnabled && isGeolocationAvailable && (
        <p style={{ color: 'orange' }}>Geolocation no está habilitada. Por favor, habilítala en la configuración de tu navegador y/o dispositivo.</p>
      )}
      {positionError && (
        <p style={{ color: 'red' }}>Error al obtener la posición: {positionError.message} (Código: {positionError.code}).</p>
      )}
      {coords && (
        <p>
          Precisión actual estimada: **{coords.accuracy.toFixed(2)} metros**
          <br/>
          (Lat: {coords.latitude.toFixed(6)}, Lng: {coords.longitude.toFixed(6)})
        </p>
      )}

      <button
        onClick={handleRegisterGeolocation}
        disabled={!isGeolocationAvailable || !isGeolocationEnabled || !coords}
        style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
      >
        Registrar mi Geolocalización Actual
      </button>

      {markers.length > 0 && (
        <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
          <h2>Puntos Registrados:</h2>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {markers.map((marker, index) => (
              <li key={index} style={{ marginBottom: '5px' }}>
                Punto {index + 1}: Lat: {marker.lat.toFixed(6)}, Lng: {marker.lng.toFixed(6)} (Precisión: {marker.accuracy.toFixed(2)}m) (
                {marker.timestamp.toLocaleTimeString()})
              </li>
            ))}
          </ul>
          {markers.length >= 2 && (
            <h3 style={{ color: 'green' }}>Distancia entre el primer y último punto: **{distance.toFixed(2)} metros**</h3>
          )}
        </div>
      )}

      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={coords ? { lat: coords.latitude, lng: coords.longitude } : center} // Centrar en la ubicación actual si está disponible
          zoom={17} // Zoom más cercano para apreciar mejor las diferencias
          onLoad={onLoad}
          onUnmount={onUnmount}
        >
          {markers.map((marker, index) => (
            <Marker
              key={`marker-${index}`}
              position={{ lat: marker.lat, lng: marker.lng }}
              label={{
                text: `${index + 1}`, // Etiqueta con el número de punto
                fontWeight: 'bold',
                color: 'white',
              }}
              title={`Punto ${index + 1}\nPrecisión: ${marker.accuracy.toFixed(2)}m`}
            />
          ))}
          {coords && (
            <Marker
              key="current-position-marker"
              position={{ lat: coords.latitude, lng: coords.longitude }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: 'blue',
                fillOpacity: 0.8,
                strokeWeight: 0,
                scale: 8,
              }}
              title={`Tu posición actual\nPrecisión: ${coords.accuracy.toFixed(2)}m`}
            />
          )}
        </GoogleMap>
      ) : (
        <div>Cargando Mapa...</div>
      )}
    </div>
  );
};

export default MapComponent;