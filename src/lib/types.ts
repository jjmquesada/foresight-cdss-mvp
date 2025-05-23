// Type definitions for Foresight CDSS

export interface Patient {
  id: string;
  name?: string;
  firstName: string;
  lastName: string;
  gender?: string;
  dateOfBirth?: string;
  race?: string;
  maritalStatus?: string;
  language?: string;
  povertyPercentage?: number;
  photo?: string;
  primaryDiagnosis?: string;
  diagnosis?: string;
  nextAppointment?: string;
  reason?: string; // Patient-level general reason
  alerts?: ComplexCaseAlert[];
}

export interface Treatment {
  drug: string;
  status: string;
  rationale: string;
}

export interface Admission {
  id: string;
  patientId: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  reason?: string; // Admission-specific reason
  transcript?: string;
  soapNote?: string;
  treatments?: Treatment[];
  priorAuthJustification?: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface Diagnosis {
  patientId: string;
  admissionId: string;
  code?: string;
  description?: string;
}

export interface LabResult {
  patientId: string;
  admissionId: string;
  name: string;
  value: number | string;
  units?: string;
  dateTime?: string;
  referenceRange?: string;
  flag?: string;
}

export interface ComplexCaseAlert {
  id: string;
  patientId: string;
  msg?: string;
  date?: string;
  type?: "autoimmune" | "inflammatory" | "oncology";
  severity: "low" | "medium" | "high" | string;
  triggeringFactors?: string[];
  suggestedActions?: string[];
  createdAt?: string;
  acknowledged?: boolean;
  acknowledgedAt?: string;
  confidence?: number;
  likelihood?: number; // Scale of 1-5
  conditionType?: string;
}

export interface ClinicalSource {
  type: "patient_data" | "guideline" | "clinical_trial" | "research";
  id: string;
  title: string;
  content: string;
  relevanceScore?: number;
  accessTime: string;
}

export interface DiagnosticStep {
  id: string;
  description: string;
  query: string;
  completed: boolean;
  sources: ClinicalSource[];
  findings: string;
}

export interface DiagnosticPlan {
  steps: DiagnosticStep[];
  rationale: string;
}

export interface DifferentialDiagnosis {
  name: string;
  likelihood: string;
  keyFactors: string;
}

export interface ClinicalTrial {
  id: string;
  title: string;
  phase: string;
  location: string;
  contact: string;
  eligibility: string;
}

export interface DiagnosticResult {
  diagnosisName: string;
  diagnosisCode?: string;
  confidence: number;
  supportingEvidence: string[];
  differentialDiagnoses: DifferentialDiagnosis[];
  recommendedTests: string[];
  recommendedTreatments: string[];
  clinicalTrialMatches: ClinicalTrial[];
}

export interface PriorAuthorization {
  patientInformation: {
    name: string;
    dateOfBirth: string;
    insuranceId: string;
    gender: string;
  };
  providerInformation: {
    name: string;
    npi: string;
    facility: string;
    contactPhone: string;
    contactEmail: string;
  };
  serviceRequest: {
    diagnosis: string;
    diagnosisCode: string;
    requestedService: string;
    serviceCode: string;
    startDate: string;
    duration: string;
    frequency: string;
  };
  clinicalJustification: string;
  supportingDocumentation: string[];
}

export interface SpecialistReferral {
  date: string;
  referringProvider: {
    name: string;
    npi: string;
    facility: string;
    contactPhone: string;
    contactEmail: string;
  };
  specialist: {
    type: string;
    facility: string;
  };
  patientInformation: {
    name: string;
    dateOfBirth: string;
    gender: string;
    contactPhone: string;
    insurance: string;
  };
  referralReason: {
    diagnosis: string;
    diagnosisCode: string;
    reasonForReferral: string;
  };
  clinicalInformation: {
    historyOfPresentIllness: string;
    relevantPastMedicalHistory: string[];
    currentMedications: string[];
    allergies: string[];
    physicalExamination: string;
    recentLabResults: {
      name: string;
      value: number;
      units: string;
      date: string;
      flag: "H" | "L" | "N";
    }[];
  };
  requestedEvaluation: string[];
}

export interface CopilotSuggestion {
  id: string;
  type: "question" | "test" | "medication" | "guideline" | "alert";
  content: string;
  context: string;
  relevanceScore: number;
  createdAt: string;
  dismissed: boolean;
  actioned: boolean;
}

export interface Consultation {
  dateTime: string; // ISO string
  reason?: string;
}

// New type for the wrapper around admission details
export interface AdmissionDetailsWrapper {
  admission: Admission;
  diagnoses: Diagnosis[];
  labResults: LabResult[];
  // Treatments are typically part of the Admission object itself now as per `Admission` type above.
  // If a specific tab needs treatments at this wrapper level, it can be added, but prefer it on Admission.
}

export interface PatientDataPayload {
  patient: Patient | null;
  admissions: Array<{
    admission: Admission;
    diagnoses: Diagnosis[];
    labResults: LabResult[];
  }>;
}
