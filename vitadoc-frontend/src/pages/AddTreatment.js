import React, { useState } from 'react';
import api from '../services/api';
import { searchMedicines, getMedicineData } from '../data/medicinesDatabase';
import '../styles/AddTreatment.css';

export default function AddTreatment({ visitId, onTreatmentAdded, onClose }) {
  const [formData, setFormData] = useState({
    medicationName: '',
    dosage: '',
    frequency: '',
    duration: '',
    route: 'oral',
    quantity: '',
    instructions: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);

  // Búsqueda de medicamentos
  const handleMedicineChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, medicationName: value });
    setSelectedMedicine(null);

    if (value.trim().length >= 2) {
      const results = searchMedicines(value);
      setSearchResults(results);
      setShowSuggestions(true);
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
    }
  };

  // Seleccionar medicamento y llenar campos automáticamente
  const handleSelectMedicine = (medicine) => {
    const medicineData = getMedicineData(medicine.name);
    
    setFormData({
      medicationName: medicine.name,
      dosage: medicineData.defaultDosage,
      frequency: medicineData.defaultFrequency,
      duration: '',
      route: medicineData.defaultRoute,
      quantity: '',
      instructions: medicineData.instructions
    });
    
    setShowSuggestions(false);
    setSearchResults([]);
    setSelectedMedicine(medicineData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Cuando cambia la dosis, permitir elegir de opciones sugeridas
  const handleDosageChange = (e) => {
    const { value } = e.target;
    setFormData({ ...formData, dosage: value });
  };

  // Cuando cambia la vía, actualizar opciones disponibles
  const handleRouteChange = (e) => {
    const { value } = e.target;
    setFormData({ ...formData, route: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validaciones
    if (!formData.medicationName.trim()) {
      setError('El nombre del medicamento es requerido');
      return;
    }

    if (!formData.dosage.trim()) {
      setError('La dosis es requerida');
      return;
    }

    if (!formData.frequency.trim()) {
      setError('La frecuencia es requerida');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(
        `/medical-visits/${visitId}/treatments`,
        {
          medicationName: formData.medicationName.trim(),
          dosage: formData.dosage.trim(),
          frequency: formData.frequency.trim(),
          duration: formData.duration.trim() || null,
          route: formData.route,
          quantity: formData.quantity.trim() || null,
          instructions: formData.instructions.trim() || null
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );

      if (response.data.success) {
        setSuccess('✓ Medicamento agregado exitosamente');
        setFormData({
          medicationName: '',
          dosage: '',
          frequency: '',
          duration: '',
          route: 'oral',
          quantity: '',
          instructions: ''
        });
        setSelectedMedicine(null);

        if (onTreatmentAdded) {
          onTreatmentAdded();
        }

        // Cerrar modal después de 1.5 segundos
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al agregar medicamento');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      medicationName: '',
      dosage: '',
      frequency: '',
      duration: '',
      route: 'oral',
      quantity: '',
      instructions: ''
    });
    setError('');
    setSuccess('');
    setShowSuggestions(false);
    setSearchResults([]);
    setSelectedMedicine(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content treatment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header treatment-header">
          <h3>💊 Agregar Medicamento</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            {/* BÚSQUEDA DE MEDICAMENTOS CON AUTOCOMPLETADO */}
            <div className="form-group">
              <label htmlFor="medicationName">Nombre del Medicamento *</label>
              <div className="autocomplete-container">
                <input
                  id="medicationName"
                  type="text"
                  name="medicationName"
                  value={formData.medicationName}
                  onChange={handleMedicineChange}
                  onFocus={() => formData.medicationName.length >= 2 && setShowSuggestions(true)}
                  placeholder="Ej: Amoxicilina, Ibuprofeno..."
                  className="input-field"
                  disabled={loading}
                  autoComplete="off"
                />

                {/* SUGERENCIAS DROPDOWN */}
                {showSuggestions && searchResults.length > 0 && (
                  <div className="suggestions-dropdown">
                    {searchResults.map((medicine, index) => (
                      <div
                        key={index}
                        className="suggestion-item medicine-suggestion"
                        onClick={() => handleSelectMedicine(medicine)}
                      >
                        <div className="suggestion-name">{medicine.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <small className="input-hint">Ingresa el nombre para buscar medicamentos</small>
            </div>

            {/* INFORMACIÓN DEL MEDICAMENTO SELECCIONADO */}
            {selectedMedicine && (
              <div className="info-box medicine-info">
                <p>
                  <strong>✓ Medicamento:</strong> {selectedMedicine.name}
                </p>
                <p>
                  <strong>Instrucciones:</strong> {selectedMedicine.instructions}
                </p>
              </div>
            )}

            {/* DOSIS Y VÍA */}
            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="dosage">Dosis *</label>
                <input
                  id="dosage"
                  type="text"
                  name="dosage"
                  value={formData.dosage}
                  onChange={handleDosageChange}
                  placeholder="Ej: 500 mg, 2 gotas..."
                  className="input-field"
                  disabled={loading}
                />
                {selectedMedicine && selectedMedicine.dosages.length > 0 && (
                  <div className="dosage-suggestions">
                    <small>Dosis sugeridas:</small>
                    <div className="dosage-buttons">
                      {selectedMedicine.dosages.map((dose, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`dosage-btn ${formData.dosage === dose ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, dosage: dose })}
                          disabled={loading}
                        >
                          {dose}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="route">Vía de Administración</label>
                <select
                  id="route"
                  name="route"
                  value={formData.route}
                  onChange={handleRouteChange}
                  className="input-field"
                  disabled={loading}
                >
                  <option value="oral">Oral</option>
                  <option value="inyectable">Inyectable</option>
                  <option value="tópica">Tópica</option>
                  <option value="inhalatoria">Inhalatoria</option>
                  <option value="nasal">Nasal</option>
                  <option value="oftálmica">Oftálmica</option>
                  <option value="ótica">Ótica</option>
                  <option value="rectal">Rectal</option>
                  <option value="sublingual">Sublingual</option>
                  <option value="transdérmica">Transdérmica</option>
                </select>
              </div>
            </div>

            {/* FRECUENCIA Y DURACIÓN */}
            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="frequency">Frecuencia *</label>
                <input
                  id="frequency"
                  type="text"
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleChange}
                  placeholder="Ej: Cada 8 horas, 2 veces al día..."
                  className="input-field"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="duration">Duración</label>
                <input
                  id="duration"
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="Ej: 7 días, 2 semanas..."
                  className="input-field"
                  disabled={loading}
                />
              </div>
            </div>

            {/* CANTIDAD E INSTRUCCIONES */}
            <div className="form-group">
              <label htmlFor="quantity">Cantidad</label>
              <input
                id="quantity"
                type="text"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="Ej: 20 comprimidos, 1 frasco..."
                className="input-field"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="instructions">Instrucciones Especiales</label>
              <textarea
                id="instructions"
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                placeholder="Ej: Tomar con alimentos, no mezclar con alcohol..."
                className="input-field textarea-field"
                rows="3"
                disabled={loading}
              />
            </div>

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
                className="btn btn-primary treatment-btn"
                disabled={loading}
              >
                {loading ? '⏳ Guardando...' : '✓ Agregar Medicamento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}