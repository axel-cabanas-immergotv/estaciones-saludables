import React, { useState, useRef, useEffect, useCallback } from 'react';
import './photoUpload.css';
import PhotoGallery from '../PhotoGallery';

const PhotoUpload = ({ 
    title = "Subir Foto",
    onUpload,
    onClose,
    maxFiles = 1,
    acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSizeMB = 10,
    folder = 'escrutinio',
    escuelaId = null,
    mesaId = null,
    tipoDocumento = 'acta'
}) => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [errors, setErrors] = useState([]);
    const [existingPhotos, setExistingPhotos] = useState([]);
    const [showGallery, setShowGallery] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef(null);

    // Cargar fotos existentes cuando se abre el modal
    useEffect(() => {
        if ((escuelaId || mesaId) && tipoDocumento) {
            loadExistingPhotos();
        }
    }, [escuelaId, mesaId, tipoDocumento]);

    const loadExistingPhotos = useCallback(async () => {
        try {
            let response;
            if (mesaId) {
                response = await fetch(`/api/admin/mesas/${mesaId}`);
            } else if (escuelaId) {
                response = await fetch(`/api/admin/escuelas/${escuelaId}`);
            } else {
                return;
            }

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    const entity = data.data;
                    let fieldName;
                    
                    if (mesaId) {
                        // Para mesas, usar los nombres correctos de campos
                        fieldName = tipoDocumento === 'acta' ? 'acta_de_escrutinio' : 'certificado_de_escrutinio';
                    } else {
                        // Para escuelas, usar los nombres existentes
                        fieldName = tipoDocumento === 'acta' ? 'acta_escrutinio' : 'cert_escrutinio';
                    }
                    
                    const photosString = entity[fieldName];
                    
                    if (photosString && photosString.trim()) {
                        // Para una sola foto, no necesitamos split
                        setExistingPhotos([photosString.trim()]);
                    } else {
                        setExistingPhotos([]);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading existing photos:', error);
            setExistingPhotos([]);
        }
    }, [escuelaId, mesaId, tipoDocumento]);

    const deletePhoto = async () => {
        if (existingPhotos.length === 0) return;
        
        // Confirmar eliminación
        const confirmDelete = window.confirm(
            `¿Está seguro de que desea eliminar la foto de ${tipoDocumento === 'acta' ? 'Acta de Escrutinio' : 'Certificado de Escrutinio'}?`
        );
        
        if (!confirmDelete) return;
        
        setDeleting(true);
        setErrors([]);
        
        try {
            const response = await fetch('/api/upload/escrutinio/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    escuela_id: escuelaId,
                    mesa_id: mesaId,
                    tipo_documento: tipoDocumento
                })
            });

            const result = await response.json();
            
            if (result.success) {
                // Limpiar fotos existentes
                setExistingPhotos([]);
                
                // Mostrar mensaje de éxito
                console.log('Foto eliminada exitosamente');
                
                // Notificar al componente padre si es necesario
                if (onUpload) {
                    onUpload([]); // Array vacío indica que se eliminó la foto
                }
            } else {
                setErrors([result.error || 'Error al eliminar la foto']);
            }
        } catch (error) {
            console.error('Error deleting photo:', error);
            setErrors(['Error al eliminar la foto: ' + error.message]);
        } finally {
            setDeleting(false);
        }
    };

    const processFiles = (fileList) => {
        const selectedFiles = Array.from(fileList);
        const newErrors = [];
        const validFiles = [];

        selectedFiles.forEach((file) => {
            // Validar tipo de archivo
            if (!acceptedTypes.includes(file.type)) {
                newErrors.push(`${file.name}: Tipo de archivo no válido. Solo se permiten imágenes.`);
                return;
            }

            // Validar tamaño
            const maxSizeBytes = maxSizeMB * 1024 * 1024;
            if (file.size > maxSizeBytes) {
                newErrors.push(`${file.name}: Archivo demasiado grande. Máximo ${maxSizeMB}MB.`);
                return;
            }

            // Validar número máximo de archivos (solo 1)
            if (files.length + validFiles.length >= maxFiles) {
                newErrors.push(`Solo se permite ${maxFiles} archivo.`);
                return;
            }

            validFiles.push(file);
        });

        setErrors(newErrors);

        if (validFiles.length > 0) {
            const newFiles = validFiles.map(file => ({
                id: Date.now() + Math.random(),
                file,
                preview: URL.createObjectURL(file),
                uploading: false,
                uploaded: false,
                url: null,
                error: null
            }));

            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const handleFileSelect = (event) => {
        processFiles(event.target.files);
        
        // Limpiar el input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Drag & Drop handlers
    const handleDragOver = (event) => {
        event.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragOver(false);
        
        const droppedFiles = event.dataTransfer.files;
        processFiles(droppedFiles);
    };

    const removeFile = (fileId) => {
        setFiles(prev => {
            const fileToRemove = prev.find(f => f.id === fileId);
            if (fileToRemove && fileToRemove.preview) {
                URL.revokeObjectURL(fileToRemove.preview);
            }
            return prev.filter(f => f.id !== fileId);
        });
    };

    const uploadFiles = async () => {
        if (files.length === 0) {
            setErrors(['No hay archivos para subir']);
            return;
        }

        setUploading(true);
        setErrors([]);

        // Set all files as uploading
        setFiles(prev => prev.map(f => ({ ...f, uploading: true })));

        try {
            const formData = new FormData();
            
            // Add single file to FormData
            formData.append('file', files[0].file);
            formData.append('folder', folder);
            if (mesaId) {
                formData.append('mesa_id', mesaId);
            } else if (escuelaId) {
                formData.append('escuela_id', escuelaId);
            }
            if (tipoDocumento) {
                formData.append('tipo_documento', tipoDocumento);
            }

            const response = await fetch('/api/upload/escrutinio', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                // Update file with success status
                setFiles(prev => prev.map(fileObj => ({
                    ...fileObj,
                    uploaded: true,
                    uploading: false,
                    url: result.url,
                    error: null
                })));

                // Show success message
                if (result.url) {
                    // Reemplazar foto existente (solo una foto)
                    setExistingPhotos([result.url]);
                    
                    if (onUpload) {
                        onUpload([{
                            filename: files[0].file.name,
                            url: result.url,
                            size: files[0].file.size,
                            type: files[0].file.type
                        }]);
                    }
                }
            } else {
                throw new Error(result.error || 'Error al subir archivo');
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            setErrors([error.message || 'Error general en el proceso de subida']);
            
            // Mark all files as failed
            setFiles(prev => prev.map(f => ({
                ...f,
                uploading: false,
                error: error.message || 'Error en la subida'
            })));
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        // Limpiar URLs de preview
        files.forEach(fileObj => {
            if (fileObj.preview) {
                URL.revokeObjectURL(fileObj.preview);
            }
        });
        
        if (onClose) {
            onClose();
        }
    };

    return (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-backdrop fade show" onClick={handleClose}></div>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="fas fa-camera me-2"></i>
                            {title}
                        </h5>
                        <button 
                            type="button" 
                            className="btn-close" 
                            onClick={handleClose}
                        ></button>
                    </div>
                    
                    <div className="modal-body">
                        {/* Fotos existentes */}
                        {existingPhotos.length > 0 && (
                            <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="mb-0">
                                        <i className="fas fa-image me-2"></i>
                                        Foto existente
                                    </h6>
                                    <div className="d-flex gap-2">
                                        <button 
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => setShowGallery(true)}
                                        >
                                            <i className="fas fa-eye me-1"></i>
                                            Ver foto
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={deletePhoto}
                                            disabled={deleting}
                                            title="Eliminar foto existente"
                                        >
                                            {deleting ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                                    Eliminando...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-trash me-1"></i>
                                                    Eliminar
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="existing-photos-preview">
                                    {existingPhotos.map((photo, index) => (
                                        <div 
                                            key={index}
                                            className="existing-photo-thumbnail"
                                            onClick={() => setShowGallery(true)}
                                        >
                                            <img 
                                                src={photo} 
                                                alt="Foto existente"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Área de drop */}
                        <div 
                            className={`photo-upload-dropzone ${isDragOver ? 'dragover' : ''}`}
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <div className="dropzone-content">
                                <i className="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                                <h6>Haz clic para seleccionar una foto o arrastra aquí</h6>
                                <p className="text-muted mb-0">
                                    Una sola foto, máximo {maxSizeMB}MB
                                </p>
                                <p className="text-muted small">
                                    Formatos: JPEG, PNG, GIF, WebP
                                </p>
                                <p className="text-muted small">
                                    <i className="fas fa-camera me-1"></i>
                                    En móviles: abre la cámara automáticamente
                                </p>
                            </div>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={`${acceptedTypes.join(',')},image/*`}
                            capture="environment"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />

                        {/* Botones adicionales para móviles */}
                        <div className="mobile-upload-buttons mt-3 d-md-none">
                            <div className="row g-2">
                                <div className="col-6">
                                    <button 
                                        className="btn btn-outline-primary w-100"
                                        onClick={() => {
                                            // Crear input temporal para galería
                                            const tempInput = document.createElement('input');
                                            tempInput.type = 'file';
                                            tempInput.accept = acceptedTypes.join(',');
                                            tempInput.onchange = (e) => processFiles(e.target.files);
                                            tempInput.click();
                                        }}
                                    >
                                        <i className="fas fa-images me-2"></i>
                                        Galería
                                    </button>
                                </div>
                                <div className="col-6">
                                    <button 
                                        className="btn btn-outline-success w-100"
                                        onClick={() => {
                                            // Crear input temporal para cámara
                                            const tempInput = document.createElement('input');
                                            tempInput.type = 'file';
                                            tempInput.accept = 'image/*';
                                            tempInput.capture = 'environment';
                                            tempInput.onchange = (e) => processFiles(e.target.files);
                                            tempInput.click();
                                        }}
                                    >
                                        <i className="fas fa-camera me-2"></i>
                                        Cámara
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Lista de archivos */}
                        {files.length > 0 && (
                            <div className="mt-4">
                                <h6>Archivos seleccionados ({files.length})</h6>
                                <div className="photo-preview-grid">
                                    {files.map((fileObj) => (
                                        <div key={fileObj.id} className="photo-preview-item">
                                            <div className="photo-preview-image">
                                                <img 
                                                    src={fileObj.preview} 
                                                    alt={fileObj.file.name}
                                                />
                                                <div className="photo-preview-overlay">
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => removeFile(fileObj.id)}
                                                        disabled={uploading}
                                                    >
                                                        <i className="fas fa-times"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div className="photo-preview-info">
                                                <div className="photo-filename" title={fileObj.file.name}>
                                                    {fileObj.file.name}
                                                </div>
                                                <div className="photo-size">
                                                    {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                                                </div>
                                                
                                                {/* Estado de subida */}
                                                {fileObj.uploading && (
                                                    <div className="upload-progress">
                                                        <div className="progress">
                                                            <div 
                                                                className="progress-bar progress-bar-striped progress-bar-animated" 
                                                                style={{ width: '100%' }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {fileObj.uploaded && (
                                                    <div className="upload-success">
                                                        <i className="fas fa-check-circle text-success"></i>
                                                        <span className="text-success small">Subido</span>
                                                    </div>
                                                )}
                                                
                                                {fileObj.error && (
                                                    <div className="upload-error">
                                                        <i className="fas fa-exclamation-circle text-danger"></i>
                                                        <span className="text-danger small">Error</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Errores */}
                        {errors.length > 0 && (
                            <div className="alert alert-danger mt-3">
                                <h6><i className="fas fa-exclamation-triangle me-2"></i>Errores:</h6>
                                <ul className="mb-0">
                                    {errors.map((error, index) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    
                    <div className="modal-footer">
                        <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={handleClose}
                            disabled={uploading}
                        >
                            Cancelar
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-primary" 
                            onClick={uploadFiles}
                            disabled={uploading || files.length === 0}
                        >
                            {uploading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    Subiendo...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-upload me-2"></i>
                                    Subir Foto
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Galería de fotos existentes */}
            {showGallery && (
                <PhotoGallery
                    photos={existingPhotos}
                    title={`Fotos de ${tipoDocumento === 'acta' ? 'Acta de Escrutinio' : 'Certificado de Escrutinio'}`}
                    onClose={() => setShowGallery(false)}
                />
            )}
        </div>
    );
};

export default PhotoUpload;
