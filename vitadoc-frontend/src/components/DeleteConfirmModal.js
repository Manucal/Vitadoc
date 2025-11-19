import React, { useState, useEffect } from 'react';
import '../styles/DeleteConfirmModal.css';

export default function DeleteConfirmModal({ 
  isOpen, 
  step, 
  onConfirm, 
  onCancel, 
  itemName,
  itemType = 'Historia Clínica', // Default para historias
  details = [], // Lista de detalles que se perderán
  loading = false
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  // Permitir cerrar con ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && !isDeleting) onCancel();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, isDeleting, onCancel]);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay delete-confirm-modal">
      <div className="modal-content">
        {step === 1 ? (
          // PRIMER MODAL - Confirmación inicial
          <>
            <div className="modal-header">
              <h3>⚠️ Confirmar eliminación</h3>
              <button 
                className="modal-close" 
                onClick={onCancel}
                disabled={isDeleting}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-message">
                ¿Estás seguro de que deseas eliminar {itemType === 'Historia Clínica' ? 'esta' : 'esta'} {itemType.toLowerCase()}?
              </p>
              <p className="modal-item-name">
                {itemType === 'Historia Clínica' ? 'Consulta del:' : itemType + ':'} <strong>{itemName}</strong>
              </p>
              <p className="modal-warning">
                Esta acción no puede ser deshecha.
              </p>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-cancel" 
                onClick={onCancel}
                disabled={isDeleting}
              >
                ✕ No, Cancelar
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleConfirm}
                disabled={isDeleting}
              >
                ✓ Sí, Continuar
              </button>
            </div>
          </>
        ) : (
          // SEGUNDO MODAL - Confirmación final
          <>
            <div className="modal-header critical">
              <h3>🚨 Última advertencia</h3>
              <button 
                className="modal-close" 
                onClick={onCancel}
                disabled={isDeleting}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="warning-box">
                <p className="warning-title">Esta acción NO puede ser revertida</p>
                <p className="warning-text">
                  Se perderá TODA la información de {itemType === 'Historia Clínica' ? 'esta historia clínica' : 'este ' + itemType.toLowerCase()}, incluyendo:
                </p>
                
                {details && details.length > 0 ? (
                  <ul className="warning-list">
                    {details.map((detail, idx) => (
                      <li key={idx}>{detail}</li>
                    ))}
                  </ul>
                ) : (
                  // Default para historias clínicas
                  <ul className="warning-list">
                    <li>Anamnesis y datos clínicos</li>
                    <li>Antecedentes personales y familiares</li>
                    <li>Signos vitales</li>
                    <li>Diagnósticos registrados</li>
                    <li>Medicamentos prescritos</li>
                    <li>Recomendaciones y seguimiento</li>
                  </ul>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-cancel" 
                onClick={onCancel}
                disabled={isDeleting}
              >
                ✕ Cancelar
              </button>
              <button 
                className="btn btn-danger-final" 
                onClick={handleConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? '⏳ Eliminando...' : '✓ Continuar - Entiendo'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
