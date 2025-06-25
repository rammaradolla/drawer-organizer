import React, { useState } from 'react';
import { uploadDrawerPhoto, validateDrawerPhoto } from '../utils/uploadDrawerPhoto';
import { updateDesignNotesAndPhoto } from '../utils/supabaseDesigns';
import { useUser } from './UserProvider';

export default function CartItemForm({ 
  item, 
  onUpdate, 
  onClose 
}) {
  const { user } = useUser();
  const [notes, setNotes] = useState(item.customerNotes || '');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(item.drawerPhotoUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setPhotoFile(null);
      setPhotoPreview('');
      return;
    }

    try {
      validateDrawerPhoto(file);
      setPhotoFile(file);
      setError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err.message);
      setPhotoFile(null);
      setPhotoPreview('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      let drawerPhotoUrl = item.drawerPhotoUrl || '';
      
      // Upload new photo if selected
      if (photoFile) {
        drawerPhotoUrl = await uploadDrawerPhoto(user.id, photoFile);
      }

      // Update the design in Supabase
      if (item.designId) {
        await updateDesignNotesAndPhoto(item.designId, notes, drawerPhotoUrl);
      }

      // Update the item with new data
      const updatedItem = {
        ...item,
        customerNotes: notes,
        drawerPhotoUrl: drawerPhotoUrl
      };

      onUpdate(updatedItem);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add Notes & Photo</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Disclaimer at the top */}
        <div className="text-xs text-yellow-700 bg-yellow-50 border-l-4 border-yellow-400 p-2 rounded mb-4">
          <strong>Note:</strong> The notes and photo you provide are <b>optional</b> and are only used to help our product makers understand your needs. We cannot guarantee the accuracy of the information in your notes or the photo, and we do not rely on them for production. If the information is not useful or clear, we may proceed without it or contact you for clarification.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Notes Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about your drawer or design preferences..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1">
              {notes.length}/500 characters
            </div>
          </div>

          {/* Photo Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Drawer Photo (Optional)
            </label>
            <a href={photoPreview} target="_blank" rel="noopener noreferrer">
            <div className="aspect-[5/3] h-20 bg-gray-100 rounded-md border flex items-center justify-center mb-2">
              {photoPreview && (
                
                <img
                  src={photoPreview}
                  alt="Drawer preview"
                  className="max-h-full max-w-full object-contain"
                />
                
              )}
            </div>
            </a>
            {photoPreview && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                style={{ marginTop: '-2.5rem', marginRight: '0.5rem' }}
              >
                ✕
              </button>
            )}
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handlePhotoChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="text-xs text-gray-500">
              Max 5MB. Supported formats: JPEG, PNG, WebP
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 