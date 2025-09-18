import React from 'react';
import './pagination.css';

const Pagination = ({
    pagination,
    onPageChange,
    onPageSizeChange,
    className = '',
    showPageSizeSelector = true,
    pageSizeOptions = [10, 20, 50, 100]
}) => {
    // Don't render if no pagination data or only one page
    if (!pagination || pagination.pages <= 1) return null;
    
    const { page, pages, total, limit } = pagination;
    const startItem = ((page - 1) * limit) + 1;
    const endItem = Math.min(page * limit, total);
    
    // Generate page numbers to show
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }
    
    return (
        <div className={`pagination-wrapper d-flex justify-content-between align-items-center mt-3 ${className}`}>
            <div className="d-flex align-items-center">
                <span className="text-muted me-3">
                    Mostrando {startItem}-{endItem} de {total} elementos
                </span>
                {showPageSizeSelector && onPageSizeChange && (
                    <>
                        <select
                            className="form-select form-select-sm"
                            style={{ width: 'auto' }}
                            value={limit}
                            onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
                        >
                            {pageSizeOptions.map((size) => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                        <span className="text-muted ms-2">por página</span>
                    </>
                )}
            </div>
            
            <nav>
                <ul className="pagination pagination-sm mb-0">
                    {/* First Page */}
                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                        <button
                            className="page-link"
                            disabled={page === 1}
                            onClick={() => onPageChange && onPageChange(1)}
                            title="Primera página"
                        >
                            <i className="fas fa-angle-double-left"></i>
                        </button>
                    </li>
                    
                    {/* Previous Page */}
                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                        <button
                            className="page-link"
                            disabled={page === 1}
                            onClick={() => onPageChange && onPageChange(page - 1)}
                            title="Página anterior"
                        >
                            <i className="fas fa-angle-left"></i>
                        </button>
                    </li>
                    
                    {/* Page Numbers */}
                    {pageNumbers.map((pageNum) => (
                        <li
                            key={pageNum}
                            className={`page-item ${pageNum === page ? 'active' : ''}`}
                        >
                            <button
                                className="page-link"
                                onClick={() => onPageChange && onPageChange(pageNum)}
                                title={`Página ${pageNum}`}
                            >
                                {pageNum}
                            </button>
                        </li>
                    ))}
                    
                    {/* Next Page */}
                    <li className={`page-item ${page === pages ? 'disabled' : ''}`}>
                        <button
                            className="page-link"
                            disabled={page === pages}
                            onClick={() => onPageChange && onPageChange(page + 1)}
                            title="Página siguiente"
                        >
                            <i className="fas fa-angle-right"></i>
                        </button>
                    </li>
                    
                    {/* Last Page */}
                    <li className={`page-item ${page === pages ? 'disabled' : ''}`}>
                        <button
                            className="page-link"
                            disabled={page === pages}
                            onClick={() => onPageChange && onPageChange(pages)}
                            title="Última página"
                        >
                            <i className="fas fa-angle-double-right"></i>
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default Pagination;
