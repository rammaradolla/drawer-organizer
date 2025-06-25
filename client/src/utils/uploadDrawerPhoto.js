import { supabase } from './supabaseClient';

export async function uploadDrawerPhoto(userId, file) {
  try {
    // Create a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `drawer-photos/${userId}/${Date.now()}.${fileExt}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('designs')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get a signed URL (valid for 1 week)
    const { data: signedData, error: signedError } = await supabase.storage
      .from('designs')
      .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 1 week

    if (signedError) {
      throw new Error(`Failed to create signed URL: ${signedError.message}`);
    }

    return signedData.signedUrl;
  } catch (error) {
    console.error('Error uploading drawer photo:', error);
    throw error;
  }
}

export function validateDrawerPhoto(file) {
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('File size must be less than 5MB');
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('File must be a JPEG, PNG, or WebP image');
  }

  return true;
} 