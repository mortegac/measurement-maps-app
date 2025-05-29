export const libraries = ['geometry'];

export const mapConfig = {
  id: 'google-map-script',
  googleMapsApiKey: import.meta.env.VITE_Maps_API_KEY,
  libraries
}; 