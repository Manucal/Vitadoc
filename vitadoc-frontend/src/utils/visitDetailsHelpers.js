/**
 * Mapea la respuesta del backend a estados separados por sección
 */
export const mapResponseToFormData = (visit) => {
  if (!visit) {
    return {
      anamnesisData: {},
      vitalSignsData: {},
      systemReviewData: {},
      physicalExamData: {},
      followUpData: {}
    };
  }

  return {
    anamnesisData: {
      currentIllness: visit.anamnesis?.current_illness || '',
      symptomDuration: visit.anamnesis?.symptom_duration || '',
      symptomSeverity: visit.anamnesis?.symptom_severity || ''
    },
    vitalSignsData: {
      weight: visit.vitalSigns?.weight || '',
      height: visit.vitalSigns?.height || '',
      systolicBp: visit.vitalSigns?.systolic_bp || '',
      diastolicBp: visit.vitalSigns?.diastolic_bp || '',
      heartRate: visit.vitalSigns?.heart_rate || '',
      respiratoryRate: visit.vitalSigns?.respiratory_rate || '',
      bodyTemperature: visit.vitalSigns?.body_temperature || ''
    },
    systemReviewData: {
      generalAppearance: visit.systemReview?.general_appearance || '',
      head: visit.systemReview?.head || '',
      ear: visit.systemReview?.ear || '',
      eye: visit.systemReview?.eye || '',
      nose: visit.systemReview?.nose || '',
      throat: visit.systemReview?.throat || '',
      cardiovascular: visit.systemReview?.cardiovascular || '',
      respiratory: visit.systemReview?.respiratory || '',
      abdomen: visit.systemReview?.abdomen || '',
      genitourinary: visit.systemReview?.genitourinary || '',
      extremities: visit.systemReview?.extremities || '',
      nervous: visit.systemReview?.nervous || ''
    },
    physicalExamData: {
      generalAppearance: visit.physicalExam?.general_appearance || '',
      mentalStatus: visit.physicalExam?.mental_status || '',
      findings: visit.physicalExam?.findings || ''
    },
    followUpData: {
      followUpReason: visit.followUp?.follow_up_reason || '',
      followUpDate: visit.followUp?.follow_up_date || ''
    }
  };
};

/**
 * Valida datos de Signos Vitales
 */
export const validateVitalSigns = (data) => {
  const errors = [];

  if (data.weight) {
    const weight = parseFloat(data.weight);
    if (weight < 2.5 || weight > 300) {
      errors.push('Peso debe estar entre 2.5 kg y 300 kg');
    }
  }

  if (data.height) {
    const height = parseFloat(data.height);
    if (height < 50 || height > 250) {
      errors.push('Altura debe estar entre 50 cm y 250 cm');
    }
  }

  if (data.systolicBp) {
    const sbp = parseFloat(data.systolicBp);
    if (sbp < 40 || sbp > 250) {
      errors.push('Presión Sistólica debe estar entre 40 y 250 mmHg');
    }
  }

  if (data.diastolicBp) {
    const dbp = parseFloat(data.diastolicBp);
    if (dbp < 20 || dbp > 150) {
      errors.push('Presión Diastólica debe estar entre 20 y 150 mmHg');
    }
  }

  if (data.heartRate) {
    const hr = parseFloat(data.heartRate);
    if (hr < 30 || hr > 200) {
      errors.push('Frecuencia Cardíaca debe estar entre 30 y 200 bpm');
    }
  }

  if (data.respiratoryRate) {
    const rr = parseFloat(data.respiratoryRate);
    if (rr < 8 || rr > 60) {
      errors.push('Frecuencia Respiratoria debe estar entre 8 y 60 rpm');
    }
  }

  if (data.bodyTemperature) {
    const temp = parseFloat(data.bodyTemperature);
    if (temp < 35 || temp > 42) {
      errors.push('Temperatura debe estar entre 35°C y 42°C');
    }
  }

  return errors;
};

/**
 * Calcula el IMC (Índice de Masa Corporal)
 */
export const calculateIMC = (weight, height) => {
  if (!weight || !height || weight <= 0 || height <= 0) return null;
  try {
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(2);
  } catch {
    return null;
  }
};

/**
 * Valida que una sección esté completa
 */
export const getSectionStatus = (visit, section) => {
  if (!visit) return 'empty';

  switch (section) {
    case 'anamnesis':
      return visit.anamnesis?.current_illness?.trim() ? 'complete' : 'empty';

    case 'vitalSigns':
      const hasWeight = visit.vitalSigns?.weight;
      const hasHeight = visit.vitalSigns?.height;
      const hasBP = visit.vitalSigns?.systolic_bp;
      if (hasWeight && hasHeight && hasBP) return 'complete';
      if (hasWeight || hasHeight || hasBP) return 'partial';
      return 'empty';

    case 'systemReview':
      const reviewFields = [
        'head', 'ear', 'eye', 'nose', 'throat',
        'cardiovascular', 'respiratory', 'abdomen',
        'genitourinary', 'extremities', 'nervous'
      ];
      const filledReview = reviewFields.filter(f => visit.systemReview?.[f]?.trim()).length;
      if (filledReview >= 3) return 'complete';
      if (filledReview > 0) return 'partial';
      return 'empty';

    case 'physicalExam':
      return visit.physicalExam?.general_appearance?.trim() ? 'complete' : 'empty';

    case 'diagnoses':
      return visit.diagnoses?.length > 0 ? 'complete' : 'empty';

    case 'treatments':
      return visit.treatments?.length > 0 ? 'complete' : 'empty';

    case 'followUp':
      return visit.followUp?.follow_up_reason?.trim() ? 'complete' : 'empty';

    default:
      return 'empty';
  }
};

/**
 * Verifica que TODOS los tabs estén completos
 */
export const allSectionsComplete = (visit) => {
  if (!visit) return false;
  const sections = ['anamnesis', 'vitalSigns', 'systemReview', 'physicalExam', 'diagnoses', 'treatments', 'followUp'];
  return sections.every(section => getSectionStatus(visit, section) === 'complete');
};
