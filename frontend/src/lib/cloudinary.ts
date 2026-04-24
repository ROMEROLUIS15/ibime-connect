/**
 * Helper para generar URLs de video optimizadas en Cloudinary.
 * Aplica q_auto (calidad) y f_auto (formato WebM/MP4 según navegador).
 */
export const getCloudinaryVideoUrl = (publicId: string): string => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'tu_cloud_name';
  if (!publicId) return '';
  return `https://res.cloudinary.com/${cloudName}/video/upload/q_auto,f_auto/${publicId}`;
};

/**
 * Helper para generar una portada (thumbnail) automáticamente desde el video.
 * so_auto: busca el frame más representativo del video.
 */
export const getCloudinaryPosterUrl = (publicId: string): string => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'tu_cloud_name';
  if (!publicId) return '';
  return `https://res.cloudinary.com/${cloudName}/video/upload/so_auto,q_auto,f_auto/${publicId}.jpg`;
};
