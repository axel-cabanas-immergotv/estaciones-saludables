import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import ContentHeader from '../../../components/ContentHeader';
import ciudadanoService from '../../../services/ciudadanoService.js';
import CiudadanoCard from '../../../components/CiudadanoCard';
import Search from '../../../components/Search';
import './ciudadano.css';
import Pagination from '../../../components/Pagination';
import Badge from '../../../components/Badge';

const Ciudadano = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [ciudadanos, setCiudadanos] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [searchTerm, setSearchTerm] = useState(''); // Término en el input (solo UI)
    const [activeSearch, setActiveSearch] = useState(''); // Término activo para búsqueda
    const [currentFilters, setCurrentFilters] = useState({});
    const [loading, setLoading] = useState(false);
    const [mesaFilter, setMesaFilter] = useState(null); // Para mostrar el filtro de mesa activo
    const [isInitialized, setIsInitialized] = useState(false); // Flag para coordinar la inicialización
    const [activeVotoFilter, setActiveVotoFilter] = useState(null); // Para rastrear el filtro de voto activo
    const [voteCounts, setVoteCounts] = useState({ voted: 0, notVoted: 0 }); // Conteos totales de voto

    // Efecto de inicialización - configura filtros iniciales basados en URL
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const mesaParam = searchParams.get('mesa');
        
        // Configurar filtros iniciales en una sola vez
        const initialFilters = {};
        let initialMesaFilter = null;
        
        if (mesaParam) {
            initialFilters.mesa_numero = mesaParam;
            initialMesaFilter = mesaParam;
        }
        
        // Establecer todo el estado inicial de una vez
        setCurrentFilters(initialFilters);
        setMesaFilter(initialMesaFilter);
        setIsInitialized(true); // Marcar como inicializado
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Solo ejecutar al montar - intencionalmente ignoramos location.search

    // Efecto para cambios posteriores en URL (después de la inicialización)
    useEffect(() => {
        if (!isInitialized) return; // No actuar hasta que esté inicializado
        
        const searchParams = new URLSearchParams(location.search);
        const mesaParam = searchParams.get('mesa');
        
        if (mesaParam && mesaParam !== mesaFilter) {
            // Aplicar filtro de mesa
            setCurrentFilters(prevFilters => ({ ...prevFilters, mesa_numero: mesaParam }));
            setMesaFilter(mesaParam);
            setCurrentPage(1);
        } else if (!mesaParam && mesaFilter) {
            // Limpiar filtro de mesa
            setCurrentFilters(prevFilters => {
                const newFilters = { ...prevFilters };
                delete newFilters.mesa_numero;
                return newFilters;
            });
            setMesaFilter(null);
        }
    }, [location.search, mesaFilter, isInitialized]);

    // Función para cargar conteos de voto
    const loadVoteCounts = async (filters) => {
        try {
            const response = await ciudadanoService.getVoteCounts(filters);
            if (response.success) {
                setVoteCounts({
                    voted: response.data.voted,
                    notVoted: response.data.notVoted
                });
            }
        } catch (error) {
            console.error('Error loading vote counts:', error);
        }
    };

    // Efecto principal para cargar data - solo después de la inicialización
    useEffect(() => {
        if (!isInitialized) return; // No cargar hasta que esté inicializado
        
        const load = async () => {
            setLoading(true);
            try {
                const params = {
                    page: currentPage,
                    limit: pageSize,
                    search: activeSearch,
                    filters: currentFilters,
                };
                
                // Cargar ciudadanos paginados y conteos de voto en paralelo
                const [ciudadanosResponse] = await Promise.all([
                    ciudadanoService.get(params),
                    loadVoteCounts(currentFilters) // Cargar conteos con los mismos filtros
                ]);
                
                if (ciudadanosResponse.success) {
                    setCiudadanos(ciudadanosResponse.data);
                    setPagination(ciudadanosResponse.pagination);
                }
            } catch (error) {
                console.error('Error loading ciudadano:', error);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [currentPage, activeSearch, currentFilters, pageSize, isInitialized]);

    const handleSearchChange = (search) => {
        // Solo actualizar el estado del input (UI), NO ejecutar búsqueda
        setSearchTerm(search);
    };

    const handleSearchExecute = (search, filters) => {
        // Ejecutar búsqueda real cuando se hace clic en buscar o se presiona Enter
        setActiveSearch(search); // Esto dispara el useEffect para hacer el request
        setCurrentFilters(filters);
        setCurrentPage(1);
    };

    const handleClearSearch = () => {
        // Limpiar la URL primero
        const newPath = location.pathname;
        navigate(newPath, { replace: true });
        
        // Limpiar estados
        setSearchTerm('');
        setActiveSearch('');
        setCurrentFilters({});
        setCurrentPage(1);
        setMesaFilter(null);
        setActiveVotoFilter(null);
        setVoteCounts({ voted: 0, notVoted: 0 });
    };

    const handleClearMesaFilter = () => {
        // Limpiar el query parameter de la URL primero
        const searchParams = new URLSearchParams(location.search);
        searchParams.delete('mesa');
        
        // Navegar a la misma ruta sin el query parameter
        const newSearch = searchParams.toString();
        const newPath = location.pathname + (newSearch ? `?${newSearch}` : '');
        navigate(newPath, { replace: true });
        
        // Los estados se actualizarán automáticamente por el useEffect que detecta cambios en URL
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handlePageSizeChange = (newSize) => {
        setPageSize(newSize);
        setCurrentPage(1); // Reset to first page when changing page size
    };

    const filterCiudadanos = (votoType) => {
        // Si el filtro actual es el mismo que se está clickeando, limpiarlo
        if (activeVotoFilter === votoType) {
            setCurrentFilters(prevFilters => {
                const newFilters = { ...prevFilters };
                delete newFilters.voto;
                return newFilters;
            });
            setActiveVotoFilter(null);
        } else {
            // Aplicar el nuevo filtro
            const votoValue = votoType === 'voto' ? true : false;
            setCurrentFilters(prevFilters => ({ ...prevFilters, voto: votoValue }));
            setActiveVotoFilter(votoType);
        }
        
        setCurrentPage(1);
    };

    return (
        <div className="content-section">
            <ContentHeader
                icon='fas fa-user'
                title='Ciudadanos'
                description={mesaFilter ? `Ciudadanos de Mesa ${mesaFilter}` : 'Gestión de ciudadanos asistentes'}
            />
            
            {/* Mostrar alerta cuando se está filtrando por mesa */}
            {mesaFilter && (
                <div className="alert alert-info d-flex justify-content-between align-items-center">
                    <div>
                        <i className="fas fa-table me-2"></i>
                        <strong>Filtrando por Mesa {mesaFilter}</strong>
                        <span className="ms-2">Se muestran solo los ciudadanos asistentes asignados a esta mesa</span>
                    </div>
                    <div className="d-flex gap-2">
                        <Link 
                            to="/admin/mesa" 
                            className="btn btn-sm btn-outline-secondary"
                            title="Volver a mesas"
                        >
                            <i className="fas fa-arrow-left me-1"></i>
                            Volver a Mesas
                        </Link>
                        <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={handleClearMesaFilter}
                            title="Quitar filtro de mesa"
                        >
                            <i className="fas fa-times me-1"></i>
                            Quitar Filtro
                        </button>
                    </div>
                </div>
            )}
            
            <Search
                enableSearch={true}
                searchTerm={searchTerm}
                searchPlaceholder="Buscar por nombre, apellido, DNI, domicilio o número de orden de asistencia"
                onSearchChange={handleSearchChange}
                onSearchExecute={handleSearchExecute}
                onClearSearch={handleClearSearch}
                filters={currentFilters}
                autoSearch={false}
            />
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body d-flex gap-2 flex-wrap">
                            <Badge
                                text={`Asistieron: 0`}
                                variant={activeVotoFilter === 'voto' ? 'success' : 'outline-success'}
                                icon="fa-check-circle"
                                size='lg'
                                clickable={true}
                                onClick={() => {}}
                                title={activeVotoFilter === 'voto' ? 'Click para quitar filtro' : 'Click para filtrar solo los que asistieron'}
                            />
                            <Badge
                                text={`No asistieron: 0`}
                                variant={activeVotoFilter === 'no_voto' ? 'danger' : 'outline-danger'}
                                icon="fa-times-circle"
                                size='lg'
                                clickable={true}
                                onClick={() => {}}
                                title={activeVotoFilter === 'no_voto' ? 'Click para quitar filtro' : 'Click para filtrar solo los que no asistieron'}
                            />
                            {activeVotoFilter && (
                                <Badge
                                    text="Limpiar filtros"
                                    variant="secondary"
                                    icon="fa-times"
                                    size='md'
                                    clickable={true}
                                    onClick={() => {
                                        setCurrentFilters(prevFilters => {
                                            const newFilters = { ...prevFilters };
                                            delete newFilters.voto;
                                            return newFilters;
                                        });
                                        setActiveVotoFilter(null);
                                        setCurrentPage(1);
                                    }}
                                    title="Limpiar todos los filtros de asistencia"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {
                !loading ? (
                    <>
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-body ciudadanos-card-container gap-2">
                                    {/* {
                                        ciudadanos.length > 0 ? (
                                            ciudadanos.map((ciudadano) => (
                                                <CiudadanoCard key={ciudadano.id} ciudadano={ciudadano} />
                                            ))
                                        ) : (
                                            <div className="text-center py-5">
                                                <h4>No se encontraron ciudadanos asistentes</h4>
                                            </div>
                                        )
                                    } */}
                                    <div className="text-center py-5">
                                        <h4>No se encontraron ciudadanos asistentes</h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* <Pagination
                        pagination={pagination}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                    /> */}
                    </>
                ) : (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Cargando...</span>
                        </div>
                    </div>
                )
            }

        </div>
    )
}

export default Ciudadano;