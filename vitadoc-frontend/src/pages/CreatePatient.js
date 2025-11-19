import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/CreatePatient.css';


// Lista de departamentos de Colombia
const DEPARTAMENTOS_COLOMBIA = [
  'Amazonas',
  'Antioquia',
  'Arauca',
  'Atlántico',
  'Bolívar',
  'Boyacá',
  'Caldas',
  'Caquetá',
  'Casanare',
  'Cauca',
  'Cesar',
  'Chocó',
  'Córdoba',
  'Cundinamarca',
  'Guainía',
  'Guaviare',
  'Huila',
  'La Guajira',
  'Magdalena',
  'Meta',
  'Nariño',
  'Norte de Santander',
  'Putumayo',
  'Quindío',
  'Risaralda',
  'Santander',
  'Sucre',
  'Tolima',
  'Valle del Cauca',
  'Vaupés',
  'Vichada'
];


export default function CreatePatient() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [departmentDropdown, setDepartmentDropdown] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('');
  
  const [form, setForm] = useState({
    document_type: '',
    document_id: '',
    full_name: '',
    birth_date: '',
    gender: '',
    bloodtype: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    department: ''
  });


  // Filtrar departamentos según lo que el usuario escriba
  const filteredDepartments = DEPARTAMENTOS_COLOMBIA.filter(dept =>
    dept.toLowerCase().startsWith(departmentFilter.toLowerCase())
  );


  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };


  const handleDepartmentInputChange = (e) => {
    const value = e.target.value;
    setDepartmentFilter(value);
    setForm({ ...form, department: value });
    setDepartmentDropdown(true);
  };


  const selectDepartment = (dept) => {
    setForm({ ...form, department: dept });
    setDepartmentFilter('');
    setDepartmentDropdown(false);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);


    try {
      if (!form.document_type || !form.document_id || !form.full_name || !form.birth_date) {
        setError('Por favor completa los campos requeridos');
        setLoading(false);
        return;
      }


      const response = await api.post('/patients/register', form, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });


      if (response.data.success) {
        setSuccess('Paciente registrado exitosamente');
        setForm({
          document_type: '',
          document_id: '',
          full_name: '',
          birth_date: '',
          gender: '',
          bloodtype: '',
          phone: '',
          email: '',
          address: '',
          city: '',
          department: ''
        });
        setTimeout(() => navigate('/doctor-patient-action'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar paciente');
    } finally {
      setLoading(false);
    }
  };


  const handleBack = () => {
    navigate('/doctor-patient-action');
  };


  return (
    <div className="page-center">
      <div className="create-patient-container">
        <button className="back-button" onClick={handleBack}>
          ← Atrás
        </button>


        <div className="create-header">
          <h2>Registrar Nuevo Paciente</h2>
          <p className="create-subtitle">Completa los datos del paciente</p>
        </div>


        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-grid">
            {/* Fila 1: Tipo Documento, No. Documento, Nombre Completo */}
            <div className="form-group">
              <label htmlFor="document_type">Tipo de Documento *</label>
              <select
                id="document_type"
                name="document_type"
                className="input-field"
                value={form.document_type}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Selecciona</option>
                <option value="CC">Cédula de Ciudadanía</option>
                <option value="CE">Cédula de Extranjería</option>
                <option value="PP">Pasaporte</option>
                <option value="TI">Tarjeta de Identidad</option>
              </select>
            </div>


            <div className="form-group">
              <label htmlFor="document_id">No. de Documento *</label>
              <input
                type="text"
                id="document_id"
                name="document_id"
                className="input-field"
                placeholder="Ej: 1234567890"
                value={form.document_id}
                onChange={handleChange}
                disabled={loading}
              />
            </div>


            <div className="form-group">
              <label htmlFor="full_name">Nombre Completo *</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                className="input-field"
                placeholder="Ej: Juan Pérez García"
                value={form.full_name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>


            {/* Fila 2: Fecha Nacimiento, Género, Tipo Sangre */}
            <div className="form-group">
              <label htmlFor="birth_date">Fecha de Nacimiento *</label>
              <input
                type="date"
                id="birth_date"
                name="birth_date"
                className="input-field"
                value={form.birth_date}
                onChange={handleChange}
                disabled={loading}
              />
            </div>


            <div className="form-group">
              <label htmlFor="gender">Género</label>
              <select
                id="gender"
                name="gender"
                className="input-field"
                value={form.gender}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Selecciona</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="O">Otro</option>
              </select>
            </div>


            <div className="form-group">
              <label htmlFor="bloodtype">Tipo de Sangre</label>
              <select
                id="bloodtype"
                name="bloodtype"
                className="input-field"
                value={form.bloodtype}
                onChange={handleChange}
                disabled={loading}
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


            {/* Fila 3: Email, Teléfono, Dirección */}
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className="input-field"
                placeholder="Ej: paciente@example.com"
                value={form.email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>


            <div className="form-group">
              <label htmlFor="phone">Teléfono</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className="input-field"
                placeholder="Ej: 3105551234"
                value={form.phone}
                onChange={handleChange}
                disabled={loading}
              />
            </div>


            <div className="form-group">
              <label htmlFor="address">Dirección</label>
              <input
                type="text"
                id="address"
                name="address"
                className="input-field"
                placeholder="Ej: Calle 10 #20-30"
                value={form.address}
                onChange={handleChange}
                disabled={loading}
              />
            </div>


            {/* Fila 4: Ciudad, Departamento (con autocomplete) */}
            <div className="form-group">
              <label htmlFor="city">Ciudad</label>
              <input
                type="text"
                id="city"
                name="city"
                className="input-field"
                placeholder="Ej: Bogotá"
                value={form.city}
                onChange={handleChange}
                disabled={loading}
              />
            </div>


            <div className="form-group department-autocomplete">
              <label htmlFor="department">Departamento</label>
              <input
                type="text"
                id="department"
                className="input-field"
                placeholder="Ej: Cundinamarca"
                value={departmentFilter || form.department}
                onChange={handleDepartmentInputChange}
                onFocus={() => setDepartmentDropdown(true)}
                disabled={loading}
                autoComplete="off"
              />
              {departmentDropdown && filteredDepartments.length > 0 && (
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


          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Registrando...' : '✓ Registrar Paciente'}
          </button>
        </form>


        <p className="form-note">* Campos requeridos</p>
      </div>
    </div>
  );
}
