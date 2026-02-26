'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'

interface ImageUploadInputProps {
  /** The hidden input name to include in the form submission */
  name: string
  /** Label text shown above the upload box */
  label?: string
  /** Existing image URL when editing */
  defaultValue?: string
  /** Called whenever the uploaded path changes (useful when not using native form submission) */
  onChange?: (path: string) => void
}

/**
 * A drag-and-drop or click-to-upload image field that immediately uploads
 * the file to /api/upload/image and stores the returned path in a hidden
 * <input> so it's included transparently in any form submission.
 */
export function ImageUploadInput({ name, label = 'Image', defaultValue, onChange }: ImageUploadInputProps) {
  // preview is what we show the user (data URL locally or the stored path)
  const [preview, setPreview] = useState<string | null>(
    defaultValue
      ? defaultValue.startsWith('http')
        ? defaultValue
        : `/api/uploads/${defaultValue}`
      : null
  )
  // storedValue is what gets submitted in the form
  const [storedValue, setStoredValue] = useState<string>(defaultValue || '')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(async (file: File) => {
    // Show a local preview immediately
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload/image', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.success && data.path) {
        setStoredValue(data.path)
        onChange?.(data.path)
      } else {
        setPreview(null)
        setStoredValue(defaultValue || '')
        alert(data.error || 'Upload failed, please try again.')
      }
    } catch {
      setPreview(null)
      alert('Upload failed, please try again.')
    } finally {
      setUploading(false)
    }
  }, [defaultValue])

  const handleFile = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.')
      return
    }
    uploadFile(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  const handleRemove = () => {
    setPreview(null)
    setStoredValue('')
    onChange?.('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}

      {/* Hidden input that carries the server path for form submission */}
      <input type="hidden" name={name} value={storedValue} />

      {preview ? (
        <div className="relative w-full max-w-sm">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-xl border border-gray-200 shadow-sm"
          />
          {uploading && (
            <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`w-full max-w-sm h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors select-none ${
            dragOver
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50/50'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
              <p className="text-sm text-gray-500">Uploading…</p>
            </>
          ) : (
            <>
              <div className="rounded-full bg-purple-100 p-3">
                <Upload className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">Click or drag & drop to upload</p>
              <p className="text-xs text-gray-400">PNG, JPG, WEBP up to 10 MB</p>
            </>
          )}
        </div>
      )}

      {/* Hidden real file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}
