import React from 'react';
import '../styles/VisitDetails.css'; // Usamos los estilos base de modal

const ConfirmModal = ({ isOpen, title, message, isDanger, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ backdropFilter: 'blur(2px)' }}>
      {/* Diseño Minimalista: Más ancho que alto, sin íconos grandes */}
      <div className="modal-content" style={{ maxWidth: '420px', padding: '24px', textAlign: 'left', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        
        {/* Título: Sobrio y profesional */}
        <h3 style={{ 
          fontSize: '1.1rem', 
          fontWeight: '600', 
          color: '#1f2937', // Gris muy oscuro (casi negro)
          marginBottom: '8px',
          marginTop: 0 
        }}>
          {title}
        </h3>
        
        {/* Mensaje: Claro y legible */}
        <p style={{ 
          color: '#4b5563', // Gris medio
          fontSize: '0.95rem', 
          marginBottom: '24px', 
          lineHeight: '1.5' 
        }}>
          {message}
        </p>

        {/* Botones: Alineados a la derecha (estándar de escritorio/profesional) */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button 
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              background: 'white',
              color: '#374151',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
            onMouseOut={(e) => e.target.style.background = 'white'}
          >
            Cancelar
          </button>

          <button 
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              // Rojo corporativo si es peligro, Verde corporativo si es seguro
              background: isDanger ? '#dc2626' : '#10b981', 
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {isDanger ? 'Sí, Eliminar' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;