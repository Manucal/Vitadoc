import React, { useState } from 'react';
import api from '../../services/api';
import '../../styles/BulkUserCreation.css';

export default function BulkUserCreation({ tenantId, onSuccess }) {
  const [users, setUsers] = useState([
    { full_name: '', document_id: '', role: 'doctor', phone: '', email: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleAddRow = () => {
    setUsers([...users, { full_name: '', document_id: '', role: 'doctor', phone: '', email: '' }]);
  };

  const handleRemoveRow = (index) => {
    setUsers(users.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    const newUsers = [...users];
    newUsers[index][field] = value;
    setUsers(newUsers);
  };

  const handleDownloadTemplate = () => {
    const headers = 'full_name,document_id,role,phone,email\n';
    const instruccion = '# Roles válidos: doctor, nurse, secretary, admin\n';
    const example = 'Manuel Calvache Morales,1113669285,doctor,3101234567,manuel@example.com\n';
    const csv = headers + instruccion + example;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'vitadoc_template_usuarios.csv');
    link.click();
  };

  const handleUploadCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target.result;
        const lines = csv.split('\n').slice(1);
        const parsed = lines
          .filter((line) => line.trim() && !line.trim().startsWith('#'))
          .map((line) => {
            const [full_name, document_id, role, phone, email] = line.split(',');
            return {
              full_name: full_name?.trim() || '',
              document_id: document_id?.trim() || '',
              role: role?.trim() || 'doctor',
              phone: phone?.trim() || '',
              email: email?.trim() || ''
            };
          });
        setUsers(parsed.length > 0 ? parsed : users);
        setError('');
      } catch (err) {
        setError('Error al procesar CSV');
      }
    };
    reader.readAsText(file);
  };

  // ✅ NUEVO: Validar que email tenga formato correcto
  const validateEmail = (email) => {
    if (!email) return true; // Email es opcional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // ✅ NUEVO: Validar duplicados de email en la tabla
  const checkDuplicateEmail = (email, currentIndex) => {
    if (!email) return false;
    return users.some((u, i) => i !== currentIndex && u.email === email);
  };

  // ✅ NUEVO: Validar duplicados de documento en la tabla
  const checkDuplicateDocument = (document_id, currentIndex) => {
    if (!document_id) return false;
    return users.some((u, i) => i !== currentIndex && u.document_id === document_id);
  };

  // ✅ NUEVO: Validar roles válidos
  const VALID_ROLES = ['doctor', 'nurse', 'secretary', 'admin'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // ✅ NUEVA: Validar antes de enviar
      const VALID_ROLES = ['doctor', 'nurse', 'secretary', 'admin'];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      // Validar cantidad de usuarios
      if (users.length > 100) {
        setError('⚠️ Máximo 100 usuarios por importación');
        setLoading(false);
        return;
      }

      // Validar cada usuario
      for (let i = 0; i < users.length; i++) {
        const user = users[i];

        // Validar campos requeridos
        if (!user.full_name || !user.document_id || !user.role) {
          setError(`❌ Fila ${i + 1}: Faltan campos requeridos (Nombre, Cédula, Rol)`);
          setLoading(false);
          return;
        }

        // Validar rol válido
        if (!VALID_ROLES.includes(user.role.toLowerCase())) {
          setError(`❌ Fila ${i + 1}: Rol '${user.role}' no válido. Usa: doctor, nurse, secretary, admin`);
          setLoading(false);
          return;
        }

        // Validar formato email (si se proporciona)
        if (user.email && !emailRegex.test(user.email)) {
          setError(`❌ Fila ${i + 1}: Email inválido '${user.email}'`);
          setLoading(false);
          return;
        }

        // Validar documento único
        if (checkDuplicateDocument(user.document_id, i)) {
          setError(`❌ Fila ${i + 1}: Cédula '${user.document_id}' está duplicada`);
          setLoading(false);
          return;
        }

        // Validar email único (si se proporciona)
        if (user.email && checkDuplicateEmail(user.email, i)) {
          setError(`❌ Fila ${i + 1}: Email '${user.email}' está duplicado`);
          setLoading(false);
          return;
        }
      }

      // ✅ Si todas las validaciones pasaron, enviar al backend
      const response = await api.post(`/tenants/${tenantId}/bulk-users`, {
        users
      });

      setResults(response.data.data);
      setUsers([{ full_name: '', document_id: '', role: 'doctor', phone: '', email: '' }]);
      if (onSuccess) onSuccess();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Error desconocido';
      setError(`❌ Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResults = () => {
    if (!results || !results.created_users) return;

    let csv = 'Nombre Completo,Usuario,Contraseña Temporal,Email,Rol\n';
    results.created_users.forEach(u => {
      csv += `${u.full_name},${u.username},${u.temporary_password},${u.email},${u.role}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'vitadoc_credenciales.csv');
    link.click();
  };

  return (
    <div className="bulk-creation-container">
      <h3>➕ Crear Múltiples Usuarios</h3>

      <div className="bulk-actions">
        <button type="button" className="btn-secondary" onClick={handleDownloadTemplate}>
          📥 Descargar Plantilla CSV
        </button>
        <label className="btn-secondary" style={{ cursor: 'pointer' }}>
          📤 Cargar CSV
          <input type="file" accept=".csv" onChange={handleUploadCSV} style={{ display: 'none' }} />
        </label>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="users-table-wrapper">
          <table className="users-input-table">
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>Cédula</th>
                <th>Rol</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => {
                // ✅ NUEVO: Detectar validaciones por fila
                const isDocDuplicate = checkDuplicateDocument(user.document_id, index);
                const isEmailDuplicate = checkDuplicateEmail(user.email, index);
                const isEmailInvalid = user.email && !validateEmail(user.email);
                const isRoleInvalid = user.role && !VALID_ROLES.includes(user.role.toLowerCase());

                return (
                  <tr key={index} className={isDocDuplicate || isEmailDuplicate || isEmailInvalid || isRoleInvalid ? 'row-error' : ''}>
                    <td>
                      <input
                        type="text"
                        value={user.full_name}
                        onChange={(e) => handleChange(index, 'full_name', e.target.value)}
                        required
                        placeholder="Manuel Calvache"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={user.document_id}
                        onChange={(e) => handleChange(index, 'document_id', e.target.value)}
                        required
                        placeholder="1113669285"
                      />
                      {isDocDuplicate && <small style={{ color: 'red' }}>⚠️ Duplicado</small>}
                    </td>
                    <td>
                      <select 
                        value={user.role} 
                        onChange={(e) => handleChange(index, 'role', e.target.value)}
                        className={isRoleInvalid ? 'input-error' : ''}
                      >
                        <option value="doctor">Médico</option>
                        <option value="nurse">Enfermera</option>
                        <option value="secretary">Secretaria</option>
                        <option value="admin">Admin Clínica</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={user.phone}
                        onChange={(e) => handleChange(index, 'phone', e.target.value)}
                        placeholder="3101234567"
                      />
                    </td>
                    <td>
                      <input
                        type="email"
                        value={user.email}
                        onChange={(e) => handleChange(index, 'email', e.target.value)}
                        placeholder="usuario@example.com"
                        className={isEmailInvalid || isEmailDuplicate ? 'input-error' : ''}
                      />
                      {isEmailInvalid && <small style={{ color: 'red' }}>⚠️ Inválido</small>}
                      {isEmailDuplicate && <small style={{ color: 'red' }}>⚠️ Duplicado</small>}
                    </td>
                    <td>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveRow(index)} 
                        className="btn-danger-small"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button type="button" className="btn-secondary" onClick={handleAddRow}>
          + Agregar Fila
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? '⏳ Creando...' : `✓ Crear ${users.length} Usuarios`}
        </button>
      </form>

      {error && <div className="alert-error">{error}</div>}

      {results && (
        <div className="results-container">
          <h4>✓ Usuarios Creados Exitosamente</h4>
          
          {results.errors && results.errors.length > 0 && (
            <div className="alert-warning">
              <strong>⚠️ {results.total_errors} usuarios NO se crearon:</strong>
              <ul>
                {results.errors.map((err, i) => (
                  <li key={i}>{err.user}: {err.error}</li>
                ))}
              </ul>
            </div>
          )}

          <table className="results-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Contraseña Temporal</th>
                <th>Email</th>
                <th>Rol</th>
              </tr>
            </thead>
            <tbody>
              {results.created_users.map((u, i) => (
                <tr key={i}>
                  <td>{u.full_name}</td>
                  <td>
                    <strong>{u.username}</strong>
                  </td>
                  <td>
                    <code>{u.temporary_password}</code>
                  </td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="results-info">
            ℹ️ <strong>Información importante:</strong>
          </p>
          <ul style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <li>✅ Comparte estas credenciales con los usuarios de forma segura</li>
            <li>✅ Los usuarios deberán cambiar la contraseña en su primer login</li>
            <li>🔒 No publiques este CSV en lugares inseguros</li>
            <li>📧 Preferiblemente, envía las credenciales por email encriptado</li>
          </ul>

          <button type="button" onClick={handleDownloadResults} className="btn-secondary">
            📥 Descargar Resultados (CSV)
          </button>
        </div>
      )}
    </div>
  );
}
