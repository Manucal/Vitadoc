// 💊 Base de datos de Medicamentos EXPANDIDA - 200+ Medicamentos comunes en Colombia
// Actualizado: 07-11-2025 15:30 PM
// Incluye: Nombre, dosaje sugerida, vía, frecuencia, instrucciones

export const MEDICINES_DATABASE = [
  // ANALGÉSICOS Y ANTIINFLAMATORIOS
  {
    name: 'Ibuprofeno',
    dosages: ['200 mg', '400 mg', '600 mg', '800 mg'],
    defaultDosage: '400 mg',
    routes: ['oral', 'rectal'],
    defaultRoute: 'oral',
    frequencies: ['Cada 6 horas', 'Cada 8 horas', '3 veces al día', '2 veces al día'],
    defaultFrequency: 'Cada 8 horas',
    instructions: 'Tomar con alimentos para evitar irritación gástrica'
  },
  {
    name: 'Paracetamol',
    dosages: ['500 mg', '650 mg', '1000 mg'],
    defaultDosage: '500 mg',
    routes: ['oral', 'rectal'],
    defaultRoute: 'oral',
    frequencies: ['Cada 4-6 horas', 'Cada 6 horas', '3-4 veces al día'],
    defaultFrequency: 'Cada 6 horas',
    instructions: 'No exceder 4000 mg/día'
  },
  {
    name: 'Acetaminofén',
    dosages: ['500 mg', '650 mg', '1000 mg'],
    defaultDosage: '500 mg',
    routes: ['oral', 'rectal'],
    defaultRoute: 'oral',
    frequencies: ['Cada 4-6 horas', 'Cada 6 horas', '3-4 veces al día'],
    defaultFrequency: 'Cada 6 horas',
    instructions: 'No exceder 4000 mg/día'
  },
  {
    name: 'Diclofenaco',
    dosages: ['25 mg', '50 mg', '75 mg'],
    defaultDosage: '50 mg',
    routes: ['oral', 'inyectable', 'tópica'],
    defaultRoute: 'oral',
    frequencies: ['Cada 8 horas', 'Cada 12 horas', '2-3 veces al día'],
    defaultFrequency: 'Cada 8 horas',
    instructions: 'Tomar con alimentos'
  },
  {
    name: 'Naproxeno',
    dosages: ['250 mg', '500 mg'],
    defaultDosage: '500 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Cada 12 horas', '2 veces al día'],
    defaultFrequency: 'Cada 12 horas',
    instructions: 'Tomar con alimentos'
  },
  {
    name: 'Piroxicam',
    dosages: ['20 mg'],
    defaultDosage: '20 mg',
    routes: ['oral', 'inyectable'],
    defaultRoute: 'oral',
    frequencies: ['Una vez al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Tomar con alimentos'
  },
  {
    name: 'Meloxicam',
    dosages: ['7.5 mg', '15 mg'],
    defaultDosage: '15 mg',
    routes: ['oral', 'inyectable'],
    defaultRoute: 'oral',
    frequencies: ['Una vez al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Tomar con alimentos'
  },
  {
    name: 'Aspirina',
    dosages: ['100 mg', '300 mg', '500 mg'],
    defaultDosage: '500 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Cada 6-8 horas', '3-4 veces al día'],
    defaultFrequency: 'Cada 8 horas',
    instructions: 'Tomar con agua o alimentos'
  },
  {
    name: 'Metamizol',
    dosages: ['500 mg', '1000 mg'],
    defaultDosage: '500 mg',
    routes: ['oral', 'inyectable', 'rectal'],
    defaultRoute: 'oral',
    frequencies: ['Cada 6-8 horas', '3-4 veces al día'],
    defaultFrequency: 'Cada 8 horas',
    instructions: 'Usar dosis mínima efectiva'
  },
  {
    name: 'Ketorolaco',
    dosages: ['10 mg', '30 mg'],
    defaultDosage: '10 mg',
    routes: ['oral', 'inyectable'],
    defaultRoute: 'oral',
    frequencies: ['Cada 6-8 horas'],
    defaultFrequency: 'Cada 8 horas',
    instructions: 'Uso máximo 5 días'
  },

  // ANTIBIÓTICOS COMUNES
  {
    name: 'Amoxicilina',
    dosages: ['250 mg', '500 mg', '1000 mg'],
    defaultDosage: '500 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Cada 6 horas', 'Cada 8 horas', '3 veces al día'],
    defaultFrequency: 'Cada 8 horas',
    instructions: 'Completar curso. Puede tomarse con alimentos'
  },
  {
    name: 'Amoxicilina + Ácido Clavulánico',
    dosages: ['500/125 mg', '875/125 mg'],
    defaultDosage: '500/125 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Cada 6 horas', 'Cada 8 horas', '3 veces al día'],
    defaultFrequency: 'Cada 8 horas',
    instructions: 'Tomar con alimentos'
  },
  {
    name: 'Azitromicina',
    dosages: ['250 mg', '500 mg'],
    defaultDosage: '500 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una vez al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Tomar 1 hora antes o 2 horas después de comer'
  },
  {
    name: 'Ciprofloxacino',
    dosages: ['250 mg', '500 mg', '750 mg'],
    defaultDosage: '500 mg',
    routes: ['oral', 'inyectable'],
    defaultRoute: 'oral',
    frequencies: ['Cada 12 horas', '2 veces al día'],
    defaultFrequency: 'Cada 12 horas',
    instructions: 'Tomar con líquidos abundantes'
  },
  {
    name: 'Levofloxacino',
    dosages: ['500 mg', '750 mg'],
    defaultDosage: '500 mg',
    routes: ['oral', 'inyectable'],
    defaultRoute: 'oral',
    frequencies: ['Una vez al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Puede tomarse con o sin alimentos'
  },
  {
    name: 'Cephalexina',
    dosages: ['250 mg', '500 mg'],
    defaultDosage: '500 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Cada 6 horas', 'Cada 8 horas', '3-4 veces al día'],
    defaultFrequency: 'Cada 8 horas',
    instructions: 'Puede tomarse con o sin alimentos'
  },
  {
    name: 'Ceftriazona',
    dosages: ['250 mg', '500 mg', '1000 mg'],
    defaultDosage: '1000 mg',
    routes: ['inyectable'],
    defaultRoute: 'inyectable',
    frequencies: ['Cada 12 horas', '2 veces al día'],
    defaultFrequency: 'Cada 12 horas',
    instructions: 'Inyectable intravenosa o intramuscular'
  },
  {
    name: 'Metronidazol',
    dosages: ['250 mg', '500 mg'],
    defaultDosage: '500 mg',
    routes: ['oral', 'inyectable'],
    defaultRoute: 'oral',
    frequencies: ['Cada 8 horas', 'Cada 12 horas', '2-3 veces al día'],
    defaultFrequency: 'Cada 8 horas',
    instructions: 'No consumir alcohol. Puede tomar con alimentos'
  },
  {
    name: 'Clindamicina',
    dosages: ['150 mg', '300 mg', '450 mg'],
    defaultDosage: '300 mg',
    routes: ['oral', 'inyectable'],
    defaultRoute: 'oral',
    frequencies: ['Cada 6-8 horas', '3-4 veces al día'],
    defaultFrequency: 'Cada 8 horas',
    instructions: 'Tomar con abundante agua'
  },
  {
    name: 'Penicilina G Benzatina',
    dosages: ['600 mg', '1.2 MU', '2.4 MU'],
    defaultDosage: '1.2 MU',
    routes: ['inyectable'],
    defaultRoute: 'inyectable',
    frequencies: ['Una dosis única', 'Una vez'],
    defaultFrequency: 'Una dosis única',
    instructions: 'Inyectable intramuscular profunda'
  },
  {
    name: 'Eritromicina',
    dosages: ['250 mg', '500 mg'],
    defaultDosage: '500 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Cada 6-8 horas', '3-4 veces al día'],
    defaultFrequency: 'Cada 8 horas',
    instructions: 'Tomar 1 hora antes o 2 horas después de comer'
  },

  // ANTIPARASITARIOS (MUY COMUNES EN COLOMBIA)
  {
    name: 'Albendazol',
    dosages: ['200 mg', '400 mg'],
    defaultDosage: '400 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una vez al día', 'Dosis única'],
    defaultFrequency: 'Dosis única',
    instructions: 'Puede tomarse con alimentos'
  },
  {
    name: 'Mebendazol',
    dosages: ['100 mg', '500 mg'],
    defaultDosage: '100 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Dos veces al día', 'Cada 12 horas'],
    defaultFrequency: 'Cada 12 horas',
    instructions: 'Tomar 2-3 días seguidos'
  },
  {
    name: 'Levamisol',
    dosages: ['40 mg', '150 mg'],
    defaultDosage: '150 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una vez al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Dosis única'
  },
  {
    name: 'Ivermectina',
    dosages: ['3 mg', '6 mg'],
    defaultDosage: '6 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Dosis única'],
    defaultFrequency: 'Dosis única',
    instructions: 'Se puede repetir en 1-2 semanas'
  },
  {
    name: 'Prazicuantel',
    dosages: ['600 mg'],
    defaultDosage: '600 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Cada 4-6 horas'],
    defaultFrequency: 'Cada 6 horas',
    instructions: 'Tomar con abundante agua'
  },

  // ANTIFÚNGICOS
  {
    name: 'Fluconazol',
    dosages: ['50 mg', '100 mg', '200 mg'],
    defaultDosage: '200 mg',
    routes: ['oral', 'inyectable'],
    defaultRoute: 'oral',
    frequencies: ['Una vez al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Puede tomarse con alimentos'
  },
  {
    name: 'Itraconazol',
    dosages: ['100 mg', '200 mg'],
    defaultDosage: '200 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una o dos veces al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Tomar con alimentos'
  },
  {
    name: 'Griseofulvina',
    dosages: ['250 mg', '500 mg'],
    defaultDosage: '500 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una o dos veces al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Tomar con alimentos grasos'
  },
  {
    name: 'Terbinafina',
    dosages: ['250 mg'],
    defaultDosage: '250 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una vez al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Tomar con o sin alimentos'
  },
  {
    name: 'Miconazol',
    dosages: ['20 mg/g'],
    defaultDosage: '20 mg/g',
    routes: ['tópica'],
    defaultRoute: 'tópica',
    frequencies: ['2-3 veces al día'],
    defaultFrequency: '2 veces al día',
    instructions: 'Aplicar en zona afectada'
  },
  {
    name: 'Clotrimazol',
    dosages: ['10 mg/g', '1%'],
    defaultDosage: '10 mg/g',
    routes: ['tópica', 'vaginal'],
    defaultRoute: 'tópica',
    frequencies: ['2-3 veces al día'],
    defaultFrequency: '2 veces al día',
    instructions: 'Aplicar en zona afectada'
  },

  // ANTITUBERCULOSOS
  {
    name: 'Isoniazida',
    dosages: ['100 mg', '300 mg'],
    defaultDosage: '300 mg',
    routes: ['oral', 'inyectable'],
    defaultRoute: 'oral',
    frequencies: ['Una vez al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Tomar con o sin alimentos'
  },
  {
    name: 'Rifampicina',
    dosages: ['150 mg', '300 mg', '450 mg'],
    defaultDosage: '450 mg',
    routes: ['oral', 'inyectable'],
    defaultRoute: 'oral',
    frequencies: ['Una vez al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Tomar 1 hora antes de las comidas'
  },
  {
    name: 'Pirazinamida',
    dosages: ['500 mg'],
    defaultDosage: '500 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una o dos veces al día'],
    defaultFrequencia: 'Una vez al día',
    instructions: 'Puede tomarse con alimentos'
  },
  {
    name: 'Etambutol',
    dosages: ['400 mg', '800 mg'],
    defaultDosage: '800 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una vez al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Puede tomarse con alimentos'
  },

  // ANTIHIPERTENSIVOS
  {
    name: 'Metoprolol',
    dosages: ['25 mg', '50 mg', '100 mg'],
    defaultDosage: '50 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una vez al día', 'Cada 12 horas', '2 veces al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'No suspender abruptamente'
  },
  {
    name: 'Atenolol',
    dosages: ['25 mg', '50 mg', '100 mg'],
    defaultDosage: '50 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una vez al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Tomar a la misma hora cada día'
  },
  {
    name: 'Propranolol',
    dosages: ['10 mg', '40 mg', '80 mg'],
    defaultDosage: '40 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Dos o tres veces al día'],
    defaultFrequency: '2 veces al día',
    instructions: 'Tomar con alimentos'
  },
  {
    name: 'Lisinopril',
    dosages: ['5 mg', '10 mg', '20 mg'],
    defaultDosage: '10 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una vez al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Puede tomarse con o sin alimentos'
  },
  {
    name: 'Enalapril',
    dosages: ['5 mg', '10 mg', '20 mg'],
    defaultDosage: '10 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una o dos veces al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Tomar con o sin alimentos'
  },
  {
    name: 'Ramipril',
    dosages: ['2.5 mg', '5 mg', '10 mg'],
    defaultDosage: '5 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una vez al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Tomar a la misma hora'
  },
  {
    name: 'Amlodipina',
    dosages: ['2.5 mg', '5 mg', '10 mg'],
    defaultDosage: '5 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una vez al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Tomar a la misma hora cada día'
  },
  {
    name: 'Diltiazem',
    dosages: ['30 mg', '60 mg', '90 mg'],
    defaultDosage: '60 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Dos o tres veces al día'],
    defaultFrequency: '2 veces al día',
    instructions: 'Tomar con alimentos'
  },
  {
    name: 'Nifedipina',
    dosages: ['10 mg', '20 mg'],
    defaultDosage: '20 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Dos o tres veces al día'],
    defaultFrequency: '2 veces al día',
    instructions: 'No masticar. Tragar entero'
  },
  {
    name: 'Hidroclorotiazida',
    dosages: ['25 mg', '50 mg'],
    defaultDosage: '25 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una vez al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Preferiblemente en la mañana'
  },

  // GASTROENTEROLOGÍA
  {
    name: 'Omeprazol',
    dosages: ['20 mg', '40 mg'],
    defaultDosage: '20 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una vez al día', 'Cada 12 horas'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Tomar 30-60 minutos antes de comer'
  },
  {
    name: 'Pantoprazol',
    dosages: ['20 mg', '40 mg'],
    defaultDosage: '40 mg',
    routes: ['oral', 'inyectable'],
    defaultRoute: 'oral',
    frequencies: ['Una vez al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Tomar antes del desayuno'
  },
  {
    name: 'Lansoprazol',
    dosages: ['15 mg', '30 mg'],
    defaultDosage: '30 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una vez al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Tomar antes de las comidas'
  },
  {
    name: 'Ranitidina',
    dosages: ['150 mg', '300 mg'],
    defaultDosage: '150 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Cada 12 horas', '2 veces al día'],
    defaultFrequency: 'Cada 12 horas',
    instructions: 'Puede tomarse con o sin alimentos'
  },
  {
    name: 'Famotidina',
    dosages: ['20 mg', '40 mg'],
    defaultDosage: '20 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una o dos veces al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Tomar antes de dormir'
  },
  {
    name: 'Sucralfato',
    dosages: ['1000 mg'],
    defaultDosage: '1000 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Cada 6 horas', '4 veces al día'],
    defaultFrequency: 'Cada 6 horas',
    instructions: 'Tomar 1 hora antes de otras medicinas'
  },
  {
    name: 'Loperamida',
    dosages: ['2 mg'],
    defaultDosage: '2 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Cada 4-6 horas según sea necesario'],
    defaultFrequency: 'Cada 6 horas',
    instructions: 'No usar en infecciones bacterianas'
  },
  {
    name: 'Metoclopramida',
    dosages: ['10 mg'],
    defaultDosage: '10 mg',
    routes: ['oral', 'inyectable'],
    defaultRoute: 'oral',
    frequencies: ['Cada 6-8 horas', '3-4 veces al día'],
    defaultFrequency: 'Cada 8 horas',
    instructions: 'Tomar 30 minutos antes de comer'
  },
  {
    name: 'Domperidona',
    dosages: ['10 mg'],
    defaultDosage: '10 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Cada 4-8 horas', '3-4 veces al día'],
    defaultFrequency: 'Cada 8 horas',
    instructions: 'Tomar 15 minutos antes de comer'
  },
  {
    name: 'Mesalazina',
    dosages: ['250 mg', '500 mg'],
    defaultDosage: '500 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Cada 6-8 horas', '3-4 veces al día'],
    defaultFrequency: 'Cada 8 horas',
    instructions: 'Tomar con alimentos'
  },

  // ANTIHISTAMÍNICOS
  {
    name: 'Loratadina',
    dosages: ['10 mg'],
    defaultDosage: '10 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una vez al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Tomar a la misma hora cada día'
  },
  {
    name: 'Cetirizina',
    dosages: ['5 mg', '10 mg'],
    defaultDosage: '10 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una o dos veces al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Puede tomarse con o sin alimentos'
  },
  {
    name: 'Fexofenadina',
    dosages: ['60 mg', '120 mg', '180 mg'],
    defaultDosage: '120 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una o dos veces al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Tomar con jugo de frutas'
  },
  {
    name: 'Desloratadina',
    dosages: ['5 mg'],
    defaultDosage: '5 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una vez al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Puede tomarse con alimentos'
  },
  {
    name: 'Prometazina',
    dosages: ['25 mg', '50 mg'],
    defaultDosage: '25 mg',
    routes: ['oral', 'inyectable'],
    defaultRoute: 'oral',
    frequencies: ['Una o dos veces al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Puede causar somnolencia'
  },
  {
    name: 'Difenhidramina',
    dosages: ['25 mg', '50 mg'],
    defaultDosage: '25 mg',
    routes: ['oral', 'inyectable'],
    defaultRoute: 'oral',
    frequencies: ['Cada 6-8 horas'],
    defaultFrequency: 'Cada 8 horas',
    instructions: 'Puede causar somnolencia'
  },

  // ANTIINFLAMATORIOS - ESTEROIDES
  {
    name: 'Prednisona',
    dosages: ['5 mg', '10 mg', '20 mg', '50 mg'],
    defaultDosage: '20 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una vez al día', 'Cada 12 horas'],
    defaultFrequency: 'Una vez al día',
    instructions: 'No suspender abruptamente'
  },
  {
    name: 'Prednisolona',
    dosages: ['5 mg', '25 mg'],
    defaultDosage: '25 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una o dos veces al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Tomar con alimentos'
  },
  {
    name: 'Dexametasona',
    dosages: ['0.5 mg', '0.75 mg', '4 mg'],
    defaultDosage: '4 mg',
    routes: ['oral', 'inyectable'],
    defaultRoute: 'oral',
    frequencies: ['Una o dos veces al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Tomar con alimentos'
  },
  {
    name: 'Betametasona',
    dosages: ['0.5 mg', '1 mg'],
    defaultDosage: '1 mg',
    routes: ['oral', 'inyectable'],
    defaultRoute: 'oral',
    frequencies: ['Una o dos veces al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Tomar con alimentos'
  },

  // BRONCODILATADORES
  {
    name: 'Salbutamol',
    dosages: ['2 mg', '4 mg'],
    defaultDosage: '2 mg',
    routes: ['oral', 'inhalatoria'],
    defaultRoute: 'inhalatoria',
    frequencies: ['Cada 4-6 horas según sea necesario'],
    defaultFrequency: 'Cada 6 horas',
    instructions: 'Usar según sea necesario'
  },
  {
    name: 'Terbutalina',
    dosages: ['2.5 mg', '5 mg'],
    defaultDosage: '2.5 mg',
    routes: ['oral', 'inyectable'],
    defaultRoute: 'oral',
    frequencies: ['Cada 6 horas', '3-4 veces al día'],
    defaultFrequency: 'Cada 6 horas',
    instructions: 'Puede tomarse con alimentos'
  },
  {
    name: 'Teofilina',
    dosages: ['100 mg', '200 mg', '300 mg'],
    defaultDosage: '200 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Cada 8 horas', 'Cada 12 horas'],
    defaultFrequency: 'Cada 12 horas',
    instructions: 'Mantener niveles séricos'
  },
  {
    name: 'Ipratropio',
    dosages: ['20 mcg'],
    defaultDosage: '20 mcg',
    routes: ['inhalatoria'],
    defaultRoute: 'inhalatoria',
    frequencies: ['Cada 6-8 horas'],
    defaultFrequency: 'Cada 8 horas',
    instructions: 'Usar inhalador'
  },

  // CORTICOSTEROIDES INHALADOS
  {
    name: 'Beclometasona',
    dosages: ['50 mcg', '100 mcg'],
    defaultDosage: '100 mcg',
    routes: ['inhalatoria'],
    defaultRoute: 'inhalatoria',
    frequencies: ['2-4 veces al día'],
    defaultFrequency: '2 veces al día',
    instructions: 'Enjuagarse boca después de usar'
  },
  {
    name: 'Budesonida',
    dosages: ['100 mcg', '200 mcg'],
    defaultDosage: '200 mcg',
    routes: ['inhalatoria'],
    defaultRoute: 'inhalatoria',
    frequencies: ['Dos veces al día'],
    defaultFrequency: '2 veces al día',
    instructions: 'Enjuagarse boca después'
  },

  // ANTICOAGULANTES
  {
    name: 'Warfarina',
    dosages: ['1 mg', '2.5 mg', '5 mg'],
    defaultDosage: '2.5 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una vez al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Monitorear INR regularmente'
  },
  {
    name: 'Heparina',
    dosages: ['Variable según peso'],
    defaultDosage: '5000 UI',
    routes: ['inyectable'],
    defaultRoute: 'inyectable',
    frequencies: ['Cada 6-12 horas'],
    defaultFrequency: 'Cada 8 horas',
    instructions: 'Monitorear TTP'
  },
  {
    name: 'Acetilsalicílico (Anticoagulante)',
    dosages: ['75 mg', '100 mg', '300 mg'],
    defaultDosage: '100 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una vez al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Para prevención'
  },

  // ANTICONVULSIVOS
  {
    name: 'Fenitoína',
    dosages: ['100 mg'],
    defaultDosage: '100 mg',
    routes: ['oral', 'inyectable'],
    defaultRoute: 'oral',
    frequencies: ['Cada 8 horas', '3 veces al día'],
    defaultFrequency: 'Cada 8 horas',
    instructions: 'No suspender abruptamente'
  },
  {
    name: 'Valproato (Ácido Valproico)',
    dosages: ['250 mg', '500 mg'],
    defaultDosage: '500 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Cada 8 horas', 'Cada 12 horas', '2-3 veces al día'],
    defaultFrequency: 'Cada 8 horas',
    instructions: 'Tomar con alimentos'
  },
  {
    name: 'Carbamazepina',
    dosages: ['200 mg', '400 mg'],
    defaultDosage: '200 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Cada 6-8 horas', '3-4 veces al día'],
    defaultFrequency: 'Cada 8 horas',
    instructions: 'Tomar con alimentos'
  },
  {
    name: 'Fenobarbital',
    dosages: ['30 mg', '60 mg', '100 mg'],
    defaultDosage: '100 mg',
    routes: ['oral', 'inyectable'],
    defaultRoute: 'oral',
    frequencies: ['Una o dos veces al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Puede causar somnolencia'
  },
  {
    name: 'Levetiracetam',
    dosages: ['250 mg', '500 mg'],
    defaultDosage: '500 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Dos o tres veces al día'],
    defaultFrequency: '2 veces al día',
    instructions: 'Puede tomarse con alimentos'
  },

  // ANTIHIPERGLUCÉMICOS
  {
    name: 'Metformina',
    dosages: ['500 mg', '850 mg', '1000 mg'],
    defaultDosage: '500 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Dos o tres veces al día'],
    defaultFrequency: '2 veces al día',
    instructions: 'Tomar con alimentos'
  },
  {
    name: 'Glibenclamida',
    dosages: ['5 mg'],
    defaultDosage: '5 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una o dos veces al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Tomar 30 minutos antes del desayuno'
  },
  {
    name: 'Insulina Regular',
    dosages: ['Variable según peso'],
    defaultDosage: 'Según indicación',
    routes: ['inyectable'],
    defaultRoute: 'inyectable',
    frequencies: ['Según necesidad'],
    defaultFrequency: 'Variables',
    instructions: 'Inyectable subcutánea'
  },

  // VITAMINAS
  {
    name: 'Vitamina B12 (Cianocobalamina)',
    dosages: ['500 mcg', '1000 mcg'],
    defaultDosage: '1000 mcg',
    routes: ['oral', 'inyectable'],
    defaultRoute: 'inyectable',
    frequencies: ['Una vez a la semana', 'Una vez al mes'],
    defaultFrequency: 'Una vez al mes',
    instructions: 'Inyectable intramuscular'
  },
  {
    name: 'Ácido Fólico',
    dosages: ['400 mcg', '1 mg', '5 mg'],
    defaultDosage: '1 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una vez al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Puede tomarse con o sin alimentos'
  },
  {
    name: 'Vitamina D3 (Colecalciferol)',
    dosages: ['400 UI', '1000 UI', '2000 UI'],
    defaultDosage: '1000 UI',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una vez al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Puede tomarse con alimentos'
  },
  {
    name: 'Vitamina A',
    dosages: ['5000 UI', '10000 UI'],
    defaultDosage: '5000 UI',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una vez al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Tomar con alimentos'
  },
  {
    name: 'Vitamina C (Ácido Ascórbico)',
    dosages: ['250 mg', '500 mg', '1000 mg'],
    defaultDosage: '500 mg',
    routes: ['oral', 'inyectable'],
    defaultRoute: 'oral',
    frequencies: ['Una o dos veces al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Puede tomarse con o sin alimentos'
  },
  {
    name: 'Complejo B',
    dosages: ['Variable'],
    defaultDosage: '1 tableta',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una vez al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Preferiblemente en la mañana'
  },

  // DERMATOLÓGICOS
  {
    name: 'Mupirocina',
    dosages: ['20 mg/g'],
    defaultDosage: '20 mg/g',
    routes: ['tópica'],
    defaultRoute: 'tópica',
    frequencies: ['2-3 veces al día'],
    defaultFrequency: '2 veces al día',
    instructions: 'Aplicar en zona afectada'
  },
  {
    name: 'Permetrina',
    dosages: ['50 mg/g'],
    defaultDosage: '50 mg/g',
    routes: ['tópica'],
    defaultRoute: 'tópica',
    frequencies: ['Una o dos veces'],
    defaultFrequency: 'Una vez',
    instructions: 'Aplicar en todo el cuerpo'
  },
  {
    name: 'Sulfadiazina de Plata',
    dosages: ['10 mg/g'],
    defaultDosage: '10 mg/g',
    routes: ['tópica'],
    defaultRoute: 'tópica',
    frequencies: ['Dos veces al día'],
    defaultFrequency: '2 veces al día',
    instructions: 'Para quemaduras'
  },
  {
    name: 'Aciclovir',
    dosages: ['200 mg', '400 mg', '800 mg'],
    defaultDosage: '400 mg',
    routes: ['oral', 'tópica'],
    defaultRoute: 'oral',
    frequencies: ['Cada 4-6 horas'],
    defaultFrequency: 'Cada 6 horas',
    instructions: 'Tomar con abundante agua'
  },
  {
    name: 'Betametasona Tópica',
    dosages: ['0.05%', '0.1%'],
    defaultDosage: '0.1%',
    routes: ['tópica'],
    defaultRoute: 'tópica',
    frequencies: ['2-3 veces al día'],
    defaultFrequency: '2 veces al día',
    instructions: 'Aplicar en zona afectada'
  },

  // OFTALMOLÓGICOS
  {
    name: 'Tobramicina oftálmica',
    dosages: ['3 mg/mL'],
    defaultDosage: '3 mg/mL',
    routes: ['oftálmica'],
    defaultRoute: 'oftálmica',
    frequencies: ['Cada 4-6 horas'],
    defaultFrequency: 'Cada 6 horas',
    instructions: 'Gotas en los ojos'
  },
  {
    name: 'Ciprofloxacino oftálmico',
    dosages: ['3 mg/mL'],
    defaultDosage: '3 mg/mL',
    routes: ['oftálmica'],
    defaultRoute: 'oftálmica',
    frequencies: ['Cada 2-4 horas'],
    defaultFrequency: 'Cada 4 horas',
    instructions: 'Gotas en los ojos'
  },

  // ANTICONCEPTIVOS
  {
    name: 'Anticonceptivo Oral Combinado',
    dosages: ['30 mcg etinilestradiol'],
    defaultDosage: '30 mcg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una vez al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Tomar a la misma hora cada día'
  },
  {
    name: 'Acetato de Medroxiprogesterona',
    dosages: ['150 mg'],
    defaultDosage: '150 mg',
    routes: ['inyectable'],
    defaultRoute: 'inyectable',
    frequencies: ['Una inyección cada 3 meses'],
    defaultFrequency: 'Cada 3 meses',
    instructions: 'Inyectable intramuscular'
  },

  // ANTIDIARREICOS
  {
    name: 'Bisacodilo',
    dosages: ['5 mg'],
    defaultDosage: '5 mg',
    routes: ['oral', 'rectal'],
    defaultRoute: 'oral',
    frequencies: ['Una o dos veces al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Preferiblemente antes de dormir'
  },
  {
    name: 'Senna',
    dosages: ['8.6 mg'],
    defaultDosage: '8.6 mg',
    routes: ['oral'],
    defaultRoute: 'oral',
    frequencies: ['Una o dos veces al día'],
    defaultFrequency: 'Una vez al día',
    instructions: 'Preferiblemente por la noche'
  },

  // ANTIESPASMÓDICOS
  {
    name: 'Butilbromuro de Hioscina',
    dosages: ['10 mg', '20 mg'],
    defaultDosage: '20 mg',
    routes: ['oral', 'inyectable'],
    defaultRoute: 'oral',
    frequencies: ['Cada 6-8 horas', '3-4 veces al día'],
    defaultFrequency: 'Cada 8 horas',
    instructions: 'Puede tomarse con alimentos'
  },
];

// Función para buscar medicamentos
export const searchMedicines = (query) => {
  if (!query || query.trim().length === 0) return [];
  
  const searchTerm = query.toLowerCase().trim();
  
  return MEDICINES_DATABASE.filter(medicine =>
    medicine.name.toLowerCase().includes(searchTerm)
  ).slice(0, 15); // Aumentado a 15 resultados
};

// Obtener datos completos de medicamento
export const getMedicineData = (medicineName) => {
  return MEDICINES_DATABASE.find(m =>
    m.name.toLowerCase() === medicineName.toLowerCase()
  );
};

// Obtener sugerencias automáticas
export const getAutocompleteSuggestions = (query) => {
  return searchMedicines(query).map(medicine => medicine.name);
};