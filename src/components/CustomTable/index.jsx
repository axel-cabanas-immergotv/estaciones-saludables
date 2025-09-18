import React, { useState } from 'react';
import './customTable.css';

const CustomTable = ({
    data,
    columns,
    loading,
    error,
    searchTerm,
    onSearchChange,
    onSearch,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    onPageChange,
    onPageSizeChange,
    searchPlaceholder = "Buscar...",
    emptyMessage = "No se encontraron datos"
}) => {
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm || '');

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (onSearch) {
            onSearch(localSearchTerm);
        }
    };

    const handleSearchInputChange = (e) => {
        const value = e.target.value;
        setLocalSearchTerm(value);
        if (onSearchChange) {
            onSearchChange(value);
        }
    };

    const renderTable = () => {
        if (loading) {
            return (
                <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="alert alert-danger">
                    {error}
                </div>
            );
        }

        if (!data || data.length === 0) {
            return (
                <div className="text-center py-4">
                    <p className="text-muted">{emptyMessage}</p>
                </div>
            );
        }

        return (
            <div className="table-responsive">
                <table className="table table-striped table-hover">
                    <thead className="table-dark">
                        <tr>
                            {columns.map((column, index) => (
                                <th key={index}>{column.header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, rowIndex) => (
                            <tr key={item.id || rowIndex}>
                                {columns.map((column, colIndex) => (
                                    <td key={colIndex}>
                                        {column.render ? column.render(item) : item[column.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderPagination = () => {
        if (totalPages <= 1) return null;

        const pages = [];
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return (
            <nav aria-label="Table pagination">
                <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button
                            className="page-link"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            Anterior
                        </button>
                    </li>
                    
                    {pages.map(page => (
                        <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                            <button
                                className="page-link"
                                onClick={() => onPageChange(page)}
                            >
                                {page}
                            </button>
                        </li>
                    ))}
                    
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button
                            className="page-link"
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Siguiente
                        </button>
                    </li>
                </ul>
            </nav>
        );
    };

    return (
        <div className="custom-table-container">
            {/* Search */}
            <div className="card mb-4">
                <div className="card-body">
                    <form onSubmit={handleSearchSubmit} className="row g-3">
                        <div className="col-md-4">
                            <input
                                type="text"
                                className="form-control"
                                placeholder={searchPlaceholder}
                                value={localSearchTerm}
                                onChange={handleSearchInputChange}
                            />
                        </div>
                        <div className="col-md-2">
                            <button type="submit" className="btn btn-outline-primary w-100">
                                <i className="fas fa-search"></i>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Results Info */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <p className="text-muted mb-0">
                    Mostrando {data?.length || 0} de {totalItems} elementos
                </p>
                <div className="d-flex align-items-center">
                    <label className="me-2">Mostrar:</label>
                    <select
                        className="form-select form-select-sm"
                        style={{ width: 'auto' }}
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            {renderTable()}

            {/* Pagination */}
            {renderPagination()}
        </div>
    );
};

export default CustomTable;
