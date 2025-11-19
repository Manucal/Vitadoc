// 📋 Configuración de secuencia de tabs - FLEXIBLE Y FÁCIL DE CAMBIAR
// Actualizado: 07-11-2025 15:48 PM

export const TAB_SEQUENCE = [
  {
    id: 'new-consultation',
    label: 'Nueva Consulta',
    icon: '➕',
    order: 0,
    canAutoNav: false // Primera tab, no se navega automáticamente a ella
  },
  {
    id: 'anamnesis',
    label: 'Anamnesis',
    icon: '📋',
    order: 1,
    canAutoNav: true
  },
  {
    id: 'system-review',
    label: 'Revisión Sistemas',
    icon: '🔍',
    order: 2,
    canAutoNav: true
  },
  {
    id: 'vital-signs',
    label: 'Signos Vitales',
    icon: '🏥',
    order: 3,
    canAutoNav: true
  },
  {
    id: 'physical-exam',
    label: 'Examen Físico',
    icon: '👤',
    order: 4,
    canAutoNav: true
  },
  {
    id: 'diagnoses',
    label: 'Diagnósticos',
    icon: '🔍',
    order: 5,
    canAutoNav: true
  },
  {
    id: 'recommendations',
    label: 'Recomendaciones',
    icon: '💡',
    order: 6,
    canAutoNav: true
  },
  {
    id: 'treatments',
    label: 'Medicamentos',
    icon: '💊',
    order: 7,
    canAutoNav: true
  },
  
];

// Función para obtener el siguiente tab después de guardar
export const getNextTabAfterSave = (currentTabId) => {
  const currentTab = TAB_SEQUENCE.find(tab => tab.id === currentTabId);
  if (!currentTab) return null;

  const nextTab = TAB_SEQUENCE.find(tab => tab.order === currentTab.order + 1);
  return nextTab ? nextTab.id : null;
};

// Función para obtener el tab anterior
export const getPreviousTabAfterSave = (currentTabId) => {
  const currentTab = TAB_SEQUENCE.find(tab => tab.id === currentTabId);
  if (!currentTab) return null;

  const prevTab = TAB_SEQUENCE.find(tab => tab.order === currentTab.order - 1);
  return prevTab ? prevTab.id : null;
};

// Función para obtener la secuencia en orden
export const getTabSequence = () => {
  return TAB_SEQUENCE.sort((a, b) => a.order - b.order);
};

// Función para verificar si un tab existe
export const isValidTab = (tabId) => {
  return TAB_SEQUENCE.some(tab => tab.id === tabId);
};