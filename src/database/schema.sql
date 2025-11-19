-- CREAR EXTENSIÓN UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================
-- TABLA TENANTS (Clínicas/IPS)
-- ============================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL,
  contact_email VARCHAR(100),
  contact_phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active',
  created_date TIMESTAMP DEFAULT NOW()
);


-- ============================================
-- TABLA USERS (Médicos y Personal)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'doctor',
  status VARCHAR(20) DEFAULT 'active',
  created_date TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);


-- ============================================
-- TABLA PATIENTS (Pacientes)
-- ============================================
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  document_id VARCHAR(50) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  birth_date DATE NOT NULL,
  gender VARCHAR(20),
  bloodtype VARCHAR(10),
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  department VARCHAR(100),
  occupation VARCHAR(100),
  marital_status VARCHAR(50),
  education_level VARCHAR(100),
  eps_name VARCHAR(100),
  eps_number VARCHAR(50),
  companion_name VARCHAR(255),
  companion_phone VARCHAR(20),
  created_date TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(tenant_id, document_type, document_id)
);


-- ============================================
-- TABLA MEDICAL_VISITS (Consultas Médicas)
-- ============================================
CREATE TABLE IF NOT EXISTS medical_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES users(id),
  visit_date TIMESTAMP NOT NULL DEFAULT NOW(),
  visit_time TIME,
  reason_for_visit TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  created_date TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  last_modified_date TIMESTAMP,
  last_modified_by UUID REFERENCES users(id)
);


-- ============================================
-- TABLA ANAMNESIS (Historia - Interrogatorio)
-- ============================================
CREATE TABLE IF NOT EXISTS anamnesis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID NOT NULL UNIQUE REFERENCES medical_visits(id) ON DELETE CASCADE,
  current_illness TEXT,
  symptom_duration VARCHAR(100),
  symptom_severity VARCHAR(50),
  associated_symptoms TEXT,
  relevant_history TEXT
);


-- ============================================
-- TABLA PERSONAL_HISTORY (Antecedentes Personales)
-- ============================================
CREATE TABLE IF NOT EXISTS personal_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID NOT NULL UNIQUE REFERENCES medical_visits(id) ON DELETE CASCADE,
  pathological TEXT,
  pharmacological TEXT,
  surgical TEXT,
  traumatic TEXT,
  allergic TEXT,
  transfusions TEXT,
  hospitalizations TEXT,
  toxicological TEXT
);


-- ============================================
-- TABLA FAMILY_HISTORY (Antecedentes Familiares)
-- ============================================
CREATE TABLE IF NOT EXISTS family_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID NOT NULL UNIQUE REFERENCES medical_visits(id) ON DELETE CASCADE,
  pathological TEXT,
  pharmacological TEXT,
  surgical TEXT,
  traumatic TEXT,
  allergic TEXT,
  gynecological TEXT,
  family_diseases TEXT
);


-- ============================================
-- TABLA VITAL_SIGNS (Signos Vitales)
-- ============================================
CREATE TABLE IF NOT EXISTS vital_signs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID NOT NULL UNIQUE REFERENCES medical_visits(id) ON DELETE CASCADE,
  weight DECIMAL(6,2),
  height INT,
  systolic_bp INT,
  diastolic_bp INT,
  heart_rate INT,
  respiratory_rate INT,
  body_temperature DECIMAL(4,2),
  imc DECIMAL(5,2),
  recorded_date TIMESTAMP DEFAULT NOW()
);


-- ============================================
-- TABLA SYSTEM_REVIEW (Revisión por Sistemas)
-- ============================================
CREATE TABLE IF NOT EXISTS system_review (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID NOT NULL UNIQUE REFERENCES medical_visits(id) ON DELETE CASCADE,
  head_neck TEXT,
  ocular TEXT,
  ears TEXT,
  thorax_abdomen TEXT,
  respiratory TEXT,
  cardiovascular TEXT,
  digestive TEXT,
  genitourinary TEXT,
  musculoskeletal TEXT,
  skin TEXT,
  nervous_system TEXT
);


-- ============================================
-- TABLA PHYSICAL_EXAM (Examen Físico)
-- ============================================
CREATE TABLE IF NOT EXISTS physical_exam (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID NOT NULL UNIQUE REFERENCES medical_visits(id) ON DELETE CASCADE,
  general_appearance TEXT,
  mental_status TEXT,
  detailed_findings TEXT,
  abnormalities TEXT,
  exam_date TIMESTAMP DEFAULT NOW()
);


-- ============================================
-- TABLA DIAGNOSES (Diagnósticos)
-- ============================================
CREATE TABLE IF NOT EXISTS diagnoses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID NOT NULL REFERENCES medical_visits(id) ON DELETE CASCADE,
  diagnosis_code_cie10 VARCHAR(10) NOT NULL,
  diagnosis_description TEXT NOT NULL,
  diagnosis_type VARCHAR(50), -- principal, relacionado, comorbilidad
  severity VARCHAR(50),
  created_date TIMESTAMP DEFAULT NOW()
);


-- ============================================
-- TABLA TREATMENTS (Tratamientos/Medicamentos)
-- ============================================
CREATE TABLE IF NOT EXISTS treatments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID NOT NULL REFERENCES medical_visits(id) ON DELETE CASCADE,
  medication_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  duration VARCHAR(100),
  route VARCHAR(50),
  quantity INT,
  instructions TEXT,
  prescribed_date TIMESTAMP DEFAULT NOW()
);


-- ============================================
-- TABLA LAB_ORDERS (Órdenes de Laboratorio)
-- ============================================
CREATE TABLE IF NOT EXISTS lab_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID NOT NULL REFERENCES medical_visits(id) ON DELETE CASCADE,
  test_code_cups VARCHAR(20),
  test_name VARCHAR(255) NOT NULL,
  test_description TEXT,
  quantity INT DEFAULT 1,
  urgency VARCHAR(50),
  ordered_date TIMESTAMP DEFAULT NOW()
);


-- ============================================
-- TABLA PROCEDURES (Procedimientos)
-- ============================================
CREATE TABLE IF NOT EXISTS procedures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID NOT NULL REFERENCES medical_visits(id) ON DELETE CASCADE,
  procedure_code_cups VARCHAR(20),
  procedure_name VARCHAR(255) NOT NULL,
  procedure_description TEXT,
  scheduled_date DATE,
  urgency VARCHAR(50),
  ordered_date TIMESTAMP DEFAULT NOW()
);


-- ============================================
-- TABLA FOLLOW_UP (Seguimiento/Control)
-- ============================================
CREATE TABLE IF NOT EXISTS follow_up (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID NOT NULL UNIQUE REFERENCES medical_visits(id) ON DELETE CASCADE,
  follow_up_date DATE,
  follow_up_time TIME,
  follow_up_reason TEXT,
  notes TEXT
);


-- ============================================
-- TABLA MEDICAL_RECORDS (Historias Clínicas Completas)
-- ============================================
CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  visit_id UUID NOT NULL REFERENCES medical_visits(id) ON DELETE CASCADE,
  digital_signature VARCHAR(1000),
  signature_timestamp TIMESTAMP,
  signature_certificate_id VARCHAR(100),
  status VARCHAR(50) DEFAULT 'draft', -- draft, completed, signed, archived
  created_date TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);


-- ============================================
-- TABLA AUDIT_LOG (Auditoría)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  timestamp TIMESTAMP DEFAULT NOW()
);


-- ============================================
-- CREAR ÍNDICES (PERFORMANCE)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_patients_tenant ON patients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_medical_visits_tenant ON medical_visits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_medical_visits_patient ON medical_visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_visits_doctor ON medical_visits(doctor_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_visit ON diagnoses(visit_id);
CREATE INDEX IF NOT EXISTS idx_treatments_visit ON treatments(visit_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_visit ON lab_orders(visit_id);
CREATE INDEX IF NOT EXISTS idx_procedures_visit ON procedures(visit_id);
CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);


-- ============================================
-- AGREGAR CAMPOS A TABLA TENANTS
-- ============================================
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'basic';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS user_count INT DEFAULT 1;



-- ============================================
-- AGREGAR CAMPOS A TABLA USERS
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS document_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;



-- ============================================
-- CREAR TABLA ROLES (Para permisos)
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '{}'
);



-- Insertar roles estándar
INSERT INTO roles (name, description, permissions) VALUES
  ('doctor', 'Médico - Acceso a consultas y pacientes', '{"create_patients": true, "create_visits": true, "see_analytics": false, "manage_users": false, "assist_visits": false}'),
  ('nurse', 'Enfermera - Soporte médico', '{"create_patients": false, "create_visits": false, "see_analytics": false, "manage_users": false, "assist_visits": true}'),
  ('admin', 'Administrador clínica', '{"create_patients": true, "create_visits": true, "see_analytics": true, "manage_users": true, "assist_visits": false}'),
  ('secretary', 'Secretaria - Registro de pacientes', '{"create_patients": true, "create_visits": false, "see_analytics": false, "manage_users": false, "assist_visits": false}')
ON CONFLICT (name) DO NOTHING;



-- ============================================
-- CREAR TABLA USER_SPECIALIZATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS user_specializations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialization VARCHAR(255) NOT NULL,
  professional_license VARCHAR(100),
  created_date TIMESTAMP DEFAULT NOW()
);



-- ============================================
-- CREAR ÍNDICES PARA NUEVOS CAMPOS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_document_id ON users(document_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_specializations_user ON user_specializations(user_id);



-- ============================================
-- AGREGAR COLUMNA PARA SEGUIMIENTO DE USUARIOS EN TENANTS
-- ============================================
-- Esta es una query de actualización que cuenta usuarios activos
UPDATE tenants SET user_count = (SELECT COUNT(*) FROM users WHERE tenant_id = tenants.id AND is_active = true);