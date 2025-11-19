import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import '../styles/PatientDetails.css';

const DEPARTAMENTOS_COLOMBIA = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá', 'Caldas',
  'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca',
  'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño',
  'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda', 'Santander', 'Sucre',
  'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada'
];

export default function PatientDetails() {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [departmentDropdown, setDepartmentDropdown] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('');

  const [patient, setPatient] = useState({
    documentType: '',
    documentId: '',
    fullName: '',
    birthDate: '',
    gender: '',
    bloodType: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    department: ''
  });

  useEffect(() => {
    fetchPatientDetails();
  }, [patientId]);

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/patients/${patientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });

      if (response.data.success) {
        const p = response.data.patient;
        setPatient({
          documentType: p.document_type,
          documentId: p.document_id,
          fullName: p.full_name,
          birthDate: p.birth_date ? p.birth_date.split('T')[0] : '',
          gender: p.gender || '',
          bloodType: p.bloodtype || '',
          phone: p.phone || '',
          email: p.email || '',
          address: p.address || '',
          city: p.city || '',
          department: p.department || ''
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar datos del paciente');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPatient({ ...patient, [name]: value });
  };

  const handleDepartmentInputChange = (e) => {
    const value = e.target.value;
    setDepartmentFilter(value);
    setPatient({ ...patient, department: value });
    setDepartmentDropdown(true);
  };

  const selectDepartment = (dept) => {
    setPatient({ ...patient, department: dept });
    setDepartmentFilter('');
    setDepartmentDropdown(false);
  };

  const filteredDepartments = DEPARTAMENTOS_COLOMBIA.filter(dept =>
    dept.toLowerCase().startsWith(departmentFilter.toLowerCase())
  );

  const handleSave = async () => {
    try {
      setError('');
      setSuccess('');

      if (!patient.documentType || !patient.documentId || !patient.fullName || !patient.birthDate) {
        setError('Por favor completa los campos requeridos');
        return;
      }

      const updateData = {
        document_type: patient.documentType,
        document_id: patient.documentId,
        full_name: patient.fullName,
        birth_date: patient.birthDate,
        gender: patient.gender,
        bloodtype: patient.bloodType,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        city: patient.city,
        department: patient.department
      };


      const response = await api.put(`/patients/${patientId}`, updateData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });

      if (response.data.success) {
        setSuccess('Paciente actualizado exitosamente');
        setEditing(false);
        setTimeout(() => {
          navigate('/patients-list');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar paciente');
    }
  };

  const handleBack = () => {
    navigate('/patients-list');
  };

  if (loading) {
    return (
      <div className="page-center">
        <div className="loading-container">Cargando datos del paciente...</div>
      </div>
    );
  }

  return (
    <div className="page-center">
      <div className="patient-details-container">
        <button className="back-button" onClick={handleBack}>
          ← Atrás
        </button>

        <div className="details-header">
          <h2>Detalles del Paciente</h2>
          <p className="details-subtitle">Información completa del paciente</p>
        </div>

        <div className="details-content">
          <div className="details-grid">
            {/* Fila 1 */}
            <div className="form-group">
              <label>Tipo de Documento *</label>
              <select
                name="documentType"
                className="input-field"
                value={patient.documentType}
                onChange={handleChange}
                disabled={!editing}
              >
                <option value="">Selecciona</option>
                <option value="CC">Cédula de Ciudadanía</option>
                <option value="CE">Cédula de Extranjería</option>
                <option value="PP">Pasaporte</option>
                <option value="TI">Tarjeta de Identidad</option>
              </select>
            </div>

            <div className="form-group">
              <label>No. de Documento *</label>
              <input
                type="text"
                name="documentId"
                className="input-field"
                value={patient.documentId}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            <div className="form-group">
              <label>Nombre Completo *</label>
              <input
                type="text"
                name="fullName"
                className="input-field"
                value={patient.fullName}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            {/* Fila 2 */}
            <div className="form-group">
              <label>Fecha de Nacimiento *</label>
              <input
                type="date"
                name="birthDate"
                className="input-field"
                value={patient.birthDate}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            <div className="form-group">
              <label>Género</label>
              <select
                name="gender"
                className="input-field"
                value={patient.gender}
                onChange={handleChange}
                disabled={!editing}
              >
                <option value="">Selecciona</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="O">Otro</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tipo de Sangre</label>
              <select
                name="bloodType"
                className="input-field"
                value={patient.bloodType}
                onChange={handleChange}
                disabled={!editing}
              >
                <option value="">Selecciona</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            {/* Fila 3 */}
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                className="input-field"
                value={patient.email}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="tel"
                name="phone"
                className="input-field"
                value={patient.phone}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            <div className="form-group">
              <label>Dirección</label>
              <input
                type="text"
                name="address"
                className="input-field"
                value={patient.address}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            {/* Fila 4 */}
            <div className="form-group">
              <label>Ciudad</label>
              <input
                type="text"
                name="city"
                className="input-field"
                value={patient.city}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            <div className="form-group department-autocomplete">
              <label>Departamento</label>
              <input
                type="text"
                className="input-field"
                placeholder="Ej: Cundinamarca"
                value={departmentFilter || patient.department}
                onChange={handleDepartmentInputChange}
                onFocus={() => editing && setDepartmentDropdown(true)}
                disabled={!editing}
                autoComplete="off"
              />
              {editing && departmentDropdown && filteredDepartments.length > 0 && (
                <div className="department-list">
                  {filteredDepartments.map((dept, idx) => (
                    <div
                      key={idx}
                      className="department-item"
                      onClick={() => selectDepartment(dept)}
                    >
                      {dept}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

        <div className="action-buttons">
          {!editing ? (
            <>
              <button
                className="btn btn-primary"
                onClick={() => setEditing(true)}
              >
                ✏️ Editar Paciente
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate(`/patient-visits/${patientId}`)}
              >
                📋 Ver Historias Clínicas
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-primary"
                onClick={handleSave}
              >
                ✓ Guardar Cambios
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setEditing(false);
                  fetchPatientDetails();
                }}
              >
                ✕ Cancelar
              </button>
            </>
          )}
      </div>

        </div>
      </div>
    </div>
  );
}
