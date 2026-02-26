'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X } from 'lucide-react';

const FLAVORS = [
  'Chocolate',
  'Vanilla',
  'Strawberry',
  'Red Velvet',
  'Black Forest',
  'Butterscotch',
  'Pineapple',
  'Mango',
  'Mixed Fruit',
  'Coffee',
  'Caramel',
  'Blueberry',
];

export default function CustomOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [flavor, setFlavor] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload PNG, JPG, or PDF files only');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setImageFile(file);
    setError('');

    // Create preview for images (not PDF)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(''); // PDF selected
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!imageFile) {
      setError('Please upload a reference image');
      return;
    }

    if (!flavor) {
      setError('Please select a flavor');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a description');
      return;
    }

    if (description.length > 1000) {
      setError('Description cannot exceed 1000 characters');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Upload the image
      const formData = new FormData();
      formData.append('file', imageFile);

      const uploadRes = await fetch('/api/custom-orders/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!uploadRes.ok) {
        const uploadError = await uploadRes.json();
        throw new Error(uploadError.error || 'Failed to upload image');
      }

      const { fileUrl } = await uploadRes.json();

      // Step 2: Create the custom order
      const orderRes = await fetch('/api/custom-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          imageUrl: fileUrl,
          flavor,
          description,
        }),
      });

      if (!orderRes.ok) {
        const orderError = await orderRes.json();
        throw new Error(orderError.error || 'Failed to submit order');
      }

      // Success! Redirect to orders page or show success message
      alert('Custom order submitted successfully! We will contact you with a quote soon.');
      router.push('/orders');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Custom Cake Order</h1>
          <p className="text-gray-600 mb-8">
            Upload a reference image, select your flavor, and describe your dream cake!
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Image *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
                {!imageFile ? (
                  <div>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-purple-600">
                          Upload a file
                        </span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept="image/png,image/jpeg,image/jpg,application/pdf"
                          onChange={handleImageChange}
                        />
                      </label>
                      <p className="mt-1 text-xs text-gray-500">
                        PNG, JPG, PDF up to 5MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                    ) : (
                      <div className="py-12">
                        <p className="text-gray-700 font-medium">{imageFile.name}</p>
                        <p className="text-sm text-gray-500">PDF file selected</p>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Flavor Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Flavor *
              </label>
              <select
                value={flavor}
                onChange={(e) => setFlavor(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Select a flavor</option>
                {FLAVORS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your dream cake in detail... (size, design, colors, text, special requirements, etc.)"
                rows={6}
                maxLength={1000}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                required
              />
              <p className="mt-1 text-sm text-gray-500 text-right">
                {description.length}/1000 characters
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Custom Order'}
            </button>

            <p className="text-sm text-gray-500 text-center">
              We'll review your order and get back to you with a quote within 24 hours!
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
