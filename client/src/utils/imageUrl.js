/**
 * Helper to get absolute image URL for rendering
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Format relative upload path with backend server host if needed
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5005';
  const backendHost = apiBase.replace(/\/api\/?$/, '');
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  return `${backendHost}${cleanPath}`;
};
