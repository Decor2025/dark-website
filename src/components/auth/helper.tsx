import { uploadToCloudinary } from '../../config/cloudinary';

async function urlToFile(url: string, filename: string, mimeType: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], filename, { type: mimeType });
}

async function uploadGooglePhoto(photoUrl: string) {
  try {
    const ext = photoUrl.split('.').pop()?.split('?')[0] || 'jpeg';
    const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

    const file = await urlToFile(photoUrl, `google_profile.${ext}`, mimeType);
    const secureUrl = await uploadToCloudinary(file);
    return secureUrl;
  } catch (err) {
    console.error('Error uploading Google photo:', err);
    return photoUrl;
  }
}

export default uploadGooglePhoto;