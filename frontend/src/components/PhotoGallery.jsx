import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Camera, Trash2, Image, Loader2, Star } from 'lucide-react';
import axios from 'axios';

// Sortable item wrapper
const SortablePhotoItem = ({ photo, onRemove, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative aspect-square rounded-2xl overflow-hidden border border-dark-200 bg-white group shadow-sm hover:shadow-md transition-all duration-300"
    >
      <img
        src={photo.url}
        alt="Foto propiedad"
        className="w-full h-full object-cover select-none"
        loading="lazy"
        decoding="async"
      />

      {/* Drag handle overlay */}
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 cursor-grab active:cursor-grabbing bg-black/0 group-hover:bg-black/10 transition-colors duration-300"
      />

      {/* Badge portada */}
      {index === 0 && (
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-primary-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-primary-500/20 select-none animate-fade-in z-20">
          <Star className="w-3.5 h-3.5 fill-current" />
          <span>Portada</span>
        </div>
      )}

      {/* Action overlay */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
        <button
          type="button"
          onClick={() => onRemove(photo.id)}
          className="p-2 rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg transition-all active:scale-95"
          title="Eliminar foto"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {photo.progress < 100 && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-20 animate-fade-in">
          <Loader2 className="w-8 h-8 animate-spin text-primary-400 mb-2" />
          <span className="text-xs font-bold">{photo.progress}%</span>
        </div>
      )}
    </div>
  );
};

const PhotoGallery = ({ propertyId, photos, setPhotos }) => {
  const [error, setError] = useState(null);
  const objectUrlsRef = useRef([]);

  // Revoke all created Object URLs when component unmounts to prevent memory leaks/freezes
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px threshold to allow button clicks
      },
    })
  );

  const onDrop = useCallback(
    async (acceptedFiles, rejectedFiles) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const errorDetail = rejectedFiles[0].errors[0];
        if (errorDetail.code === 'file-too-large') {
          setError('Cada imagen debe pesar menos de 2 MB.');
        } else {
          setError('Solo se permiten imágenes JPEG, PNG o WEBP.');
        }
        return;
      }

      if (photos.length + acceptedFiles.length > 20) {
        setError('Solo puedes subir un máximo de 20 fotos por propiedad.');
        return;
      }

      // Add new files to list. If there is no propertyId (Wizard mode), set progress to 100% directly.
      // This reduces re-renders by combining initial state and progress update.
      const newPhotos = acceptedFiles.map((file, idx) => {
        const tempId = `temp_${Date.now()}_${idx}`;
        const url = URL.createObjectURL(file);
        objectUrlsRef.current.push(url);
        
        return {
          id: tempId,
          file,
          url,
          progress: propertyId ? 0 : 100,
          isLocal: true,
        };
      });

      setPhotos((prev) => [...prev, ...newPhotos]);

      // If propertyId exists, upload immediately to backend!
      if (propertyId) {
        for (let item of newPhotos) {
          await uploadFileToServer(item, propertyId);
        }
      }
    },
    [photos.length, propertyId, setPhotos]
  );

  const uploadFileToServer = async (photoItem, propId) => {
    const formData = new FormData();
    formData.append('photo', photoItem.file);

    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const res = await axios.post(`${API_URL}/properties/${propId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setPhotos((prev) =>
            prev.map((p) => (p.id === photoItem.id ? { ...p, progress } : p))
          );
        },
      });

      // Replace local photo with server photo
      const serverPhoto = res.data.photo;
      setPhotos((prev) =>
        prev.map((p) => (p.id === photoItem.id ? { ...serverPhoto, progress: 100 } : p))
      );
      
      // Cleanup local blob URL once successfully uploaded to server
      URL.revokeObjectURL(photoItem.url);
      objectUrlsRef.current = objectUrlsRef.current.filter((url) => url !== photoItem.url);
    } catch (err) {
      setError('Error al subir una de las imágenes. Por favor, intenta de nuevo.');
      setPhotos((prev) => prev.filter((p) => p.id !== photoItem.id));
      URL.revokeObjectURL(photoItem.url);
      objectUrlsRef.current = objectUrlsRef.current.filter((url) => url !== photoItem.url);
    }
  };

  const handleRemove = async (id) => {
    setError(null);
    const photoToRemove = photos.find((p) => p.id === id);

    if (!photoToRemove) return;

    if (photoToRemove.isLocal) {
      URL.revokeObjectURL(photoToRemove.url);
      objectUrlsRef.current = objectUrlsRef.current.filter((url) => url !== photoToRemove.url);
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      return;
    }

    // Server photo delete
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      await axios.delete(`${API_URL}/properties/${propertyId}/photos/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setPhotos((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError('No fue posible eliminar la foto. Intenta nuevamente.');
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setPhotos((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const newArray = arrayMove(items, oldIndex, newIndex);

      // If we have propertyId, update order in server
      if (propertyId && !newArray.some((p) => p.isLocal)) {
        updateOrderOnServer(newArray);
      }

      return newArray;
    });
  };

  const updateOrderOnServer = async (orderedArray) => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const photosPayload = orderedArray.map((p, index) => ({
        id: p.id,
        orderIndex: index,
      }));

      await axios.patch(
        `${API_URL}/properties/${propertyId}/photos/reorder`,
        { photos: photosPayload },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (err) {
      console.error('Error updating order on server:', err);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 2 * 1024 * 1024, // 2MB
  });

  return (
    <div className="space-y-6">
      {error && <div className="alert-error">{error}</div>}

      <div
        {...getRootProps()}
        className={`border-3 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? 'border-primary-400 bg-primary-50/50'
            : 'border-dark-200 bg-white hover:border-primary-300'
        }`}
      >
        <input {...getInputProps()} />
        <Camera className="w-12 h-12 text-primary-400 mx-auto mb-3" />
        <h4 className="text-md font-bold text-dark-800 mb-1">
          {isDragActive
            ? '¡Suelta las fotos aquí!'
            : 'Arrastra y suelta las fotos de tu hospedaje'}
        </h4>
        <p className="text-dark-400 text-xs mb-3">
          Puedes seleccionar varias a la vez. La primera foto será la de portada.
        </p>
        <span className="text-[11px] px-3 py-1 rounded-full bg-dark-100 text-dark-600 font-semibold">
          Hasta 2 MB por foto · Formatos JPG, PNG, WEBP · Máximo 20 fotos
        </span>
      </div>

      {photos.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {photos.map((photo, index) => (
                <SortablePhotoItem
                  key={photo.id}
                  photo={photo}
                  onRemove={handleRemove}
                  index={index}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default PhotoGallery;
