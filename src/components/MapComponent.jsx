// src/components/MapComponent.jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useGeolocated } from 'react-geolocated';

const containerStyle = {
  width: '100%',
  height: '600px'
};

const center = {
  lat: -33.4489, // Santiago, Chile como centro inicial
  lng: -70.6693
};

// Función para calcular la distancia entre dos puntos (fórmula de Haversine)
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c; // in metres
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

  const { coords, isGeolocationAvailable, isGeolocationEnabled } = useGeolocated({
    positionOptions: {
      enableHighAccuracy: true,
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
        timestamp: new Date()
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
    } else {
      alert("No se pudo obtener la geolocalización. Asegúrate de que los permisos estén habilitados.");
    }
  };

  useEffect(() => {
    if (coords && mapRef.current) {
      // Centrar el mapa en la posición actual cuando se obtiene la geolocalización
      mapRef.current.panTo({ lat: coords.latitude, lng: coords.longitude });
    }
  }, [coords]);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Medición de Puntos con Google Maps</h1>
      {!isGeolocationAvailable && (
        <p>Tu navegador no soporta Geolocation.</p>
      )}
      {!isGeolocationEnabled && isGeolocationAvailable && (
        <p>Geolocation no está habilitada. Por favor, habilítala en la configuración de tu navegador.</p>
      )}

      <button onClick={handleRegisterGeolocation} disabled={!isGeolocationAvailable || !isGeolocationEnabled}>
        Registrar mi Geolocalización Actual
      </button>

      {markers.length > 0 && (
        <div>
          <h2>Puntos Registrados:</h2>
          <ul>
            {markers.map((marker, index) => (
              <li key={index}>
                Punto {index + 1}: Lat: {marker.lat.toFixed(6)}, Lng: {marker.lng.toFixed(6)} (
                {marker.timestamp.toLocaleTimeString()})
              </li>
            ))}
          </ul>
          {markers.length >= 2 && (
            <h3>Distancia entre el primer y último punto: {distance.toFixed(2)} metros</h3>
          )}
        </div>
      )}

      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={12}
          onLoad={onLoad}
          onUnmount={onUnmount}
        >
          {markers.map((marker, index) => (
            <Marker
              key={index}
              position={{ lat: marker.lat, lng: marker.lng }}
            />
          ))}
          {coords && (
            <Marker
              position={{ lat: coords.latitude, lng: coords.longitude }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: 'blue',
                fillOpacity: 0.8,
                strokeWeight: 0,
                scale: 8,
              }}
              title="Tu posición actual"
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