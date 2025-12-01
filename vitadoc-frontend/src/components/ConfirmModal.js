import React from 'react';
import '../styles/ConfirmModal.css'; // Crearemos este CSS en el paso 2

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, isDanger }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay-confirm" onClick={onCancel}>
      <div className="modal-content-confirm" onClick={(e) => e.stopPropagation()}>
        <div className={`modal-icon ${isDanger ? 'icon-danger' : 'icon-info'}`}>
          {isDanger ? '🗑️' : 'ℹ️'}
        </div>
        
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        
        <div className="modal-actions-confirm">
          <button className="btn-cancel" onClick={onCancel}>
            Cancelar
          </button>
          <button 
            className={isDanger ? "btn-confirm-danger" : "btn-confirm-primary"} 
            onClick={onConfirm}
          >
            {isDanger ? 'Sí, Eliminar' : 'Sí, Aceptar'}
          </button>
        </div>
      </div>
    </div>
  );
}