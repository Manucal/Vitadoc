import React, { useState } from 'react';
import api from '../../services/api';

export default function CreateTenantForm({ onCreate }) {
  const [form, setForm] = useState({
    clinic_name: '',
    clinic_email: '',
    admin_full_name: '',
    admin_email: '',
    admin_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await api.post('/tenants', {
        clinic_name: form.clinic_name,
        clinic_email: form.clinic_email,
        admin_full_name: form.admin_full_name,
        admin_email: form.admin_email,
        admin_password: form.admin_password
      });
      setSuccess('Clínica creada exitosamente 🎉');
      setForm({
        clinic_name: '',
        clinic_email: '',
        admin_full_name: '',
        admin_email: '',
        admin_password: ''
      });
      if (onCreate) onCreate();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear clínica');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tenant-form-container">
      <h3>➕ Crear Nueva Clínica</h3>
      <form onSubmit={handleSubmit} className="tenant-form">
        <div className="tenant-row">
          <input
            type="text"
            name="clinic_name"
            placeholder="Nombre de la clínica"
            value={form.clinic_name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="clinic_email"
            placeholder="Email de la clínica"
            value={form.clinic_email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="tenant-row">
          <input
            type="text"
            name="admin_full_name"
            placeholder="Nombre completo admin"
            value={form.admin_full_name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="admin_email"
            placeholder="Email admin"
            value={form.admin_email}
            onChange={handleChange}
            required
          />
        </div>
        <input
          type="password"
          name="admin_password"
          placeholder="Contraseña admin"
          value={form.admin_password}
          onChange={handleChange}
          required
        />
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Creando...' : '✓ Crear Clínica'}
        </button>
        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}
      </form>
    </div>
  );
}
