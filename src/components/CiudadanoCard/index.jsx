import React, { useState } from 'react';
import './ciudadanoCard.css';
import ciudadanoService from '../../services/ciudadanoService';

const CiudadanoCard = ({ ciudadano }) => {
    const [voto, setVoto] = useState(ciudadano?.voto);

    const handleVoto = (ciudadano) => {
        setVoto(!voto);
        ciudadano.voto = !voto;
        const data = {
            nombre: ciudadano?.nombre,
            apellido: ciudadano?.apellido,
            dni: ciudadano?.dni,
            voto: !voto,
            status: ciudadano?.status,
        }
        ciudadanoService.update(ciudadano.id, data);
    }

    return (
        <div className='ciudadano-card-body'>
            <div className='ciudadano-card-header'>
                <div className={`ciudadano-voto-status-color ${voto ? 'bg-success' : 'bg-danger'}`}></div>
                <span className='ciudadano-nombre'>{ciudadano?.apellido}, {ciudadano?.nombre}</span>
            </div>
            <div className='ciudadano-card-info'>
                <span className='ciudadano-dni'>DNI: {ciudadano?.dni}</span>
                <div className='ciudadano-domicilio'>
                    <i className='fas fa-map-marker-alt'></i>
                    <span className='ciudadano-domicilio-texto ml-1'>{ciudadano?.domicilio}</span>
                </div>
                <span className='ciudadano-numero-mesa'>Orden: {ciudadano?.numero_orden}</span>
            </div>
            <div className='ciudadano-card-footer'>
                {/* Boton de votó o no votó */}
                <button
                    className={`ciudadano-voto-button btn btn-sm ${voto ? 'btn-success' : 'btn-danger'}`}
                    onClick={() => handleVoto(ciudadano)}
                >
                    <i className={`${voto ? 'fas fa-circle-check' : 'fa-regular fa-circle'}`}></i>
                    <span>{voto ? 'Ya votó' : 'Marcar como votó'}</span>
                </button>
            </div>
        </div>
    );
};

export default CiudadanoCard;