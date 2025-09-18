import React from 'react';

const ContentHeader = ({ icon, title, description, handleCreateNew, buttonText, disabledButton }) => {
    return (
        <div className="content-header">
            <div className="d-flex justify-content-between align-items-center">
                <div>
                    <h1>
                        {icon && <i className={`${icon} me-2`}></i>}
                        {title}
                    </h1>
                    <p>{description}</p>
                </div>
                <div>
                    {handleCreateNew && (
                        <button 
                            className="btn btn-primary"
                            onClick={handleCreateNew}
                            disabled={disabledButton}
                        >
                            <i className="fas fa-plus me-1"></i>
                            {buttonText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContentHeader;