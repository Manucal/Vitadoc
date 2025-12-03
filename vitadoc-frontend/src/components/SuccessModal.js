import React from 'react';
import '../styles/VisitDetails.css'; // Reusamos los estilos de modal existentes

const SuccessModal = ({ isOpen, title, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ textAlign: 'center', padding: '30px' }}>
        {/* Ícono de Check Profesional (SVG) */}
        <div style={{ 
          margin: '0 auto 20px', 
          width: '60px', 
          height: '60px', 
          borderRadius: '50%', 
          backgroundColor: '#dcfce7', // Verde claro fondo
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <svg width="35" height="35" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '10px' }}>
          {title || 'Operación Exitosa'}
        </h3>
        
        <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '25px', lineHeight: '1.5' }}>
          {message}
        </p>

        <button 
          onClick={onClose}
          className="btn-primary"
          style={{ 
            width: '100%', 
            justifyContent: 'center', 
            padding: '10px',
            fontSize: '1rem'
          }}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;