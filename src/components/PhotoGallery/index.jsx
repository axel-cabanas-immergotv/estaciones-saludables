import React, { useState } from 'react';
import './photoGallery.css';

const PhotoGallery = ({ 
    photos = [], 
    title = "Fotos",
    onClose 
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!photos || photos.length === 0) {
        return (
            <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                <div className="modal-backdrop fade show" onClick={onClose}></div>
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                <i className="fas fa-images me-2"></i>
                                {title}
                            </h5>
                            <button 
                                type="button" 
                                className="btn-close" 
                                onClick={onClose}
                            ></button>
                        </div>
                        <div className="modal-body text-center py-5">
                            <i className="fas fa-image fa-3x text-muted mb-3"></i>
                            <h6>No hay fotos disponibles</h6>
                            <p className="text-muted">No se han subido fotos para este documento.</p>
                        </div>
                        <div className="modal-footer">
                            <button 
                                type="button" 
                                className="btn btn-secondary" 
                                onClick={onClose}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const currentPhoto = photos[currentIndex];

    const goToPrevious = () => {
        setCurrentIndex((prevIndex) => 
            prevIndex === 0 ? photos.length - 1 : prevIndex - 1
        );
    };

    const goToNext = () => {
        setCurrentIndex((prevIndex) => 
            prevIndex === photos.length - 1 ? 0 : prevIndex + 1
        );
    };

    const goToPhoto = (index) => {
        setCurrentIndex(index);
    };

    return (
        <div className="modal photo-gallery-modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-backdrop fade show" onClick={onClose}></div>
            <div className="modal-dialog modal-xl">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="fas fa-image me-2"></i>
                            {title}
                        </h5>
                        <button 
                            type="button" 
                            className="btn-close" 
                            onClick={onClose}
                        ></button>
                    </div>
                    
                    <div className="modal-body">
                        <div className="photo-gallery-container">
                            {/* Foto principal */}
                            <div className="main-photo-container">
                                <div className="photo-wrapper">
                                    <img 
                                        src={currentPhoto} 
                                        alt={`Foto ${currentIndex + 1}`}
                                        className="main-photo"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                    <div className="photo-error" style={{ display: 'none' }}>
                                        <i className="fas fa-exclamation-triangle fa-2x text-warning mb-2"></i>
                                        <span>Error al cargar la imagen</span>
                                    </div>
                                </div>
                                
                                {/* Navegación */}
                                {photos.length > 1 && (
                                    <>
                                        <button 
                                            className="nav-button nav-prev"
                                            onClick={goToPrevious}
                                            title="Foto anterior"
                                        >
                                            <i className="fas fa-chevron-left"></i>
                                        </button>
                                        <button 
                                            className="nav-button nav-next"
                                            onClick={goToNext}
                                            title="Siguiente foto"
                                        >
                                            <i className="fas fa-chevron-right"></i>
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Miniaturas */}
                            {photos.length > 1 && (
                                <div className="thumbnails-container">
                                    <div className="thumbnails-scroll">
                                        {photos.map((photo, index) => (
                                            <div
                                                key={index}
                                                className={`thumbnail ${index === currentIndex ? 'active' : ''}`}
                                                onClick={() => goToPhoto(index)}
                                            >
                                                <img 
                                                    src={photo} 
                                                    alt={`Miniatura ${index + 1}`}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                                <div className="thumbnail-number">
                                                    {index + 1}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Información de la foto */}
                            <div className="photo-info">
                                <a 
                                    href={currentPhoto} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline-primary"
                                >
                                    <i className="fas fa-external-link-alt me-1"></i>
                                    Abrir en nueva pestaña
                                </a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="modal-footer">
                        <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={onClose}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PhotoGallery;
