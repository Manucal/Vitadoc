import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { searchCIE10, getDescriptionByCode } from '../data/cie10Database';
import '../styles/AddDiagnosis.css';

export default function AddDiagnosis({ visitId, onDiagnosisAdded, onClose }) {
  const [formData, setFormData] = useState({
    diagnosisCodeCie10: '',
    diagnosisDescription: '',
    diagnosisType: 'principal',
    severity: 'moderada'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  // Búsqueda de diagnósticos CIE-10
  const handleCodeChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, diagnosisCodeCie10: value });
    setSelectedSuggestion(null);

    if (value.trim().length >= 1) {
      const results = searchCIE10(value);
      setSearchResults(results);
      setShowSuggestions(true);
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
    }
  };

  // Seleccionar diagnóstico de las sugerencias
  const handleSelectSuggestion = (item) => {
    setFormData({
      ...formData,
      diagnosisCodeCie10: item.code,
      diagnosisDescription: item.description
    });
    setShowSuggestions(false);
    setSearchResults([]);
    setSelectedSuggestion(item);
  };

  const handleDescriptionChange = (e) => {
    const { value } = e.target;
    setFormData({ ...formData, diagnosisDescription: value });
    setSelectedSuggestion(null);
  };

  const handleTypeChange = (e) => {
    const { value } = e.target;
    setFormData({ ...formData, diagnosisType: value });
  };

  const handleSeverityChange = (e) => {
    const { value } = e.target;
    setFormData({ ...formData, severity: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validaciones
    if (!formData.diagnosisCodeCie10.trim()) {
      setError('El código CIE-10 es requerido');
      return;
    }

    if (!formData.diagnosisDescription.trim()) {
      setError('La descripción del diagnóstico es requerida');
      return;
    }

    // Validar formato CIE-10 (letra seguida de números)
    const cie10Pattern = /^[A-Z]\d{2}(\.\d)?$/;
    if (!cie10Pattern.test(formData.diagnosisCodeCie10.toUpperCase())) {
      setError('Formato CIE-10 inválido. Ejemplo válido: A00, B34.9');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(
        `/medical-visits/${visitId}/diagnoses`,
        {
          diagnosisCodeCie10: formData.diagnosisCodeCie10.trim().toUpperCase(),
          diagnosisDescription: formData.diagnosisDescription.trim(),
          diagnosisType: formData.diagnosisType,
          severity: formData.severity
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );

      if (response.data.success) {
        setSuccess('✓ Diagnóstico agregado exitosamente');
        setFormData({
          diagnosisCodeCie10: '',
          diagnosisDescription: '',
          diagnosisType: 'principal',
          severity: 'moderada'
        });
        setSelectedSuggestion(null);

        if (onDiagnosisAdded) {
          onDiagnosisAdded();
        }

        // Cerrar modal después de 1.5 segundos
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al agregar diagnóstico');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      diagnosisCodeCie10: '',
      diagnosisDescription: '',
      diagnosisType: 'principal',
      severity: 'moderada'
    });
    setError('');
    setSuccess('');
    setShowSuggestions(false);
    setSearchResults([]);
    setSelectedSuggestion(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content diagnosis-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🔍 Agregar Diagnóstico</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            {/* BÚSQUEDA DE CIE-10 CON AUTOCOMPLETADO */}
            <div className="form-group">
              <label htmlFor="diagnosisCodeCie10">Código CIE-10 *</label>
              <div className="autocomplete-container">
                <input
                  id="diagnosisCodeCie10"
                  type="text"
                  name="diagnosisCodeCie10"
                  value={formData.diagnosisCodeCie10}
                  onChange={handleCodeChange}
                  onFocus={() => formData.diagnosisCodeCie10 && setShowSuggestions(true)}
                  placeholder="Ej: A00, R51, I10"
                  className="input-field"
                  maxLength="10"
                  disabled={loading}
                  autoComplete="off"
                />

                {/* SUGERENCIAS DROPDOWN */}
                {showSuggestions && searchResults.length > 0 && (
                  <div className="suggestions-dropdown">
                    {searchResults.map((item, index) => (
                      <div
                        key={index}
                        className="suggestion-item"
                        onClick={() => handleSelectSuggestion(item)}
                      >
                        <div className="suggestion-code">{item.code}</div>
                        <div className="suggestion-description">{item.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <small className="input-hint">
                Ingresa código (A00) o descripción (cefalea) para buscar
              </small>
            </div>

            {/* DESCRIPCIÓN DEL DIAGNÓSTICO */}
            <div className="form-group">
              <label htmlFor="diagnosisDescription">Descripción del Diagnóstico *</label>
              <textarea
                id="diagnosisDescription"
                name="diagnosisDescription"
                value={formData.diagnosisDescription}
                onChange={handleDescriptionChange}
                placeholder="La descripción se completa automáticamente..."
                className="input-field textarea-field"
                rows="4"
                disabled={loading}
              />
            </div>

            {/* TIPO Y SEVERIDAD */}
            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="diagnosisType">Tipo de Diagnóstico</label>
                <select
                  id="diagnosisType"
                  name="diagnosisType"
                  value={formData.diagnosisType}
                  onChange={handleTypeChange}
                  className="input-field"
                  disabled={loading}
                >
                  <option value="principal">Principal</option>
                  <option value="secundario">Secundario</option>
                  <option value="diferencial">Diferencial</option>
                  <option value="presumptivo">Presumptivo</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="severity">Severidad</label>
                <select
                  id="severity"
                  name="severity"
                  value={formData.severity}
                  onChange={handleSeverityChange}
                  className="input-field"
                  disabled={loading}
                >
                  <option value="leve">Leve</option>
                  <option value="moderada">Moderada</option>
                  <option value="severa">Severa</option>
                  <option value="crítica">Crítica</option>
                </select>
              </div>
            </div>

            {/* INFO SELECCIONADA */}
            {selectedSuggestion && (
              <div className="info-box">
                <p>
                  <strong>✓ Diagnóstico seleccionado:</strong> {selectedSuggestion.code} - {selectedSuggestion.description}
                </p>
              </div>
            )}

            {/* BOTONES DE ACCIÓN */}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleReset}
                disabled={loading}
              >
                🔄 Limpiar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? '⏳ Guardando...' : '✓ Agregar Diagnóstico'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}