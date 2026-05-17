// ─── Enums & Literal Types ────────────────────────────────────

export type UserRole = 'client' | 'agent';
export type Currency = 'USD' | 'BOB';
export type TransactionType = 'venta' | 'alquiler' | 'anticretico';
export type DocumentStatus = 'saneado' | 'advertencia';
export type CommissionType = 'porcentaje' | 'fijo';
export type PaymentMethod = 'efectivo' | 'credito_bancario' | 'fondos_propios';
export type DocumentContext = 'corretaje' | 'compromiso' | 'final';

// ─── Core Models ──────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  properties_closed?: number;
  avg_close_days?: number;
  zone?: string;
}

export interface Property {
  id: string;
  owner_id: string;
  agent_id: string | null;
  title: string;
  description: string;
  price: number;
  currency: Currency;
  type: TransactionType;
  has_titulo: boolean;
  has_folio: boolean;
  has_impuestos: boolean;
  status_documents: DocumentStatus;
  stage_crm1: number;
  initial_message: string;
  commission_type: CommissionType | null;
  proposed_commission: number | null;
  client_accepted_commission: boolean;
  corretaje_contract_filename: string | null;
  is_agent_signed_crm1: boolean;
  is_client_signed_crm1: boolean;
  published_to_map: boolean;
  lat?: number;
  lng?: number;
}

export interface LeadCRM2 {
  id: string;
  property_id: string;
  buyer_id: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_email: string;
  agent_id: string;
  stage_crm2: number;
  offer_price: number;
  payment_method: PaymentMethod;
  reservation_amount: number | null;
  compromiso_contract_filename: string | null;
  is_agent_signed_crm2_s2: boolean;
  is_buyer_signed_crm2_s2: boolean;
  final_contract_filename: string | null;
  notary_office_number: string | null;
  is_agent_signed_crm2_s3: boolean;
  is_buyer_signed_crm2_s3: boolean;
  is_owner_signed_crm2_s3: boolean;
}

// ─── Request Types ────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreatePropertyRequest {
  title: string;
  description: string;
  price: number;
  currency: Currency;
  type: TransactionType;
  has_titulo: boolean;
  has_folio: boolean;
  has_impuestos: boolean;
  initial_message?: string;
}

export interface AssignAgentRequest {
  agent_id: string;
}

export interface UpdatePropertyStageRequest {
  stage_crm1?: number;
  commission_type?: CommissionType;
  proposed_commission?: number;
  client_accepted_commission?: boolean;
  corretaje_contract_filename?: string;
  is_agent_signed_crm1?: boolean;
  is_client_signed_crm1?: boolean;
  published_to_map?: boolean;
}

export interface CreateLeadRequest {
  property_id: string;
  buyer_id: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_email: string;
  offer_price: number;
  payment_method: PaymentMethod;
}

export interface UpdateLeadStageRequest {
  stage_crm2?: number;
  reservation_amount?: number;
  compromiso_contract_filename?: string;
  is_agent_signed_crm2_s2?: boolean;
  is_buyer_signed_crm2_s2?: boolean;
  final_contract_filename?: string;
  notary_office_number?: string;
  is_agent_signed_crm2_s3?: boolean;
  is_buyer_signed_crm2_s3?: boolean;
  is_owner_signed_crm2_s3?: boolean;
}

export interface AnalyzeDocumentRequest {
  filename: string;
  context: DocumentContext;
  transaction_type: TransactionType;
}

// ─── Response Types ───────────────────────────────────────────

export interface DocumentClause {
  text: string;
  type: 'safe' | 'dangerous';
  tooltip: string;
}

export interface AnalyzeDocumentResponse {
  filename: string;
  score: number;
  clauses: DocumentClause[];
  summary: string;
}

// ─── Marketing Types ─────────────────────────────────────────

export type SocialPlatform = 'FACEBOOK' | 'INSTAGRAM';

export interface MarketingContent {
  title: string;
  short_description: string;
  long_description: string;
  hashtags: string[];
  cta: string;
  reel_script: string;
}

export interface MarketingCampaign {
  id: string;
  property_id: string;
  content: MarketingContent;
}

export interface SocialPostRecord {
  id: string;
  property_id: string;
  platform: SocialPlatform;
  status: 'published' | 'simulated';
  content_title: string;
}

export interface PublishContentRequest {
  platforms: SocialPlatform[];
  content: MarketingContent;
}

export interface PropertyAnalytics {
  property_id: string;
  views: number;
  clicks: number;
  saves: number;
  messages: number;
  engagement_score: number;
  posts: SocialPostRecord[];
}

// ─── CRM Stage Labels ────────────────────────────────────────

export const CRM1_STAGES: Record<number, string> = {
  0: 'Sin Agente',
  1: 'Oferta Recibida',
  2: 'Negociación Comisión',
  3: 'Contrato Corretaje',
  4: 'En Mercado',
  5: 'Concluida/Vendida',
};

export const CRM2_STAGES: Record<number, string> = {
  1: 'Lead Inicial',
  2: 'Contrato Compromiso',
  3: 'Cierre Legal',
  4: 'Finalizado con Éxito',
};

export const TRANSACTION_LABELS: Record<TransactionType, string> = {
  venta: 'Venta',
  alquiler: 'Alquiler',
  anticretico: 'Anticrético',
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  efectivo: 'Efectivo',
  credito_bancario: 'Crédito Bancario',
  fondos_propios: 'Fondos Propios',
};

// ─── Buyer CRM Intelligence Types ─────────────────────────────

export type InteractionType = 'VIEW' | 'CLICK' | 'FAVORITE' | 'MESSAGE' | 'VISIT_REQUEST';
export type ClassificationType = 'HOT_LEAD' | 'WARM_LEAD' | 'COLD_LEAD';
export type PipelineStage = 'CONTACT' | 'VISIT' | 'INTEREST' | 'COMMITMENT_SIGNATURE' | 'PAYMENT' | 'COMPLETED';

export interface BuyerPreferences {
  id: string;
  buyer_id: string;
  preferred_zones: string[];
  budget_min: number;
  budget_max: number;
  property_type: TransactionType | null;
  bedrooms_min: number;
  bedrooms_max: number;
  operation_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface BuyerInteraction {
  id: string;
  buyer_id: string;
  property_id: string;
  interaction_type: InteractionType;
  timestamp: string;
  buyer_name?: string;
  property_title?: string;
}

export interface SavedPropertyRecord {
  id: string;
  buyer_id: string;
  property_id: string;
  saved_at: string;
}

export interface LeadStageHistory {
  id: string;
  lead_id: string;
  from_stage: string;
  to_stage: string;
  changed_at: string;
}

export interface LeadClassification {
  lead_id: string;
  buyer_id: string;
  score: number;
  classification: ClassificationType;
  breakdown: Record<string, number>;
  classified_at: string;
}

export interface EnrichedLead extends LeadCRM2 {
  pipeline_stage: PipelineStage;
  classification: LeadClassification | null;
  preferences: BuyerPreferences | null;
}

export interface DashboardData {
  total_leads: number;
  hot_leads_count: number;
  warm_leads_count: number;
  cold_leads_count: number;
  avg_score: number;
  classifications: LeadClassification[];
  recent_interactions: BuyerInteraction[];
  pipeline_summary: Record<PipelineStage, number>;
  leads: EnrichedLead[];
}

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  CONTACT: 'Contacto',
  VISIT: 'Visita',
  INTEREST: 'Interés',
  COMMITMENT_SIGNATURE: 'Compromiso',
  PAYMENT: 'Pago',
  COMPLETED: 'Completado',
};

export const PIPELINE_STAGES_ORDER: PipelineStage[] = [
  'CONTACT', 'VISIT', 'INTEREST', 'COMMITMENT_SIGNATURE', 'PAYMENT', 'COMPLETED',
];

export const CLASSIFICATION_LABELS: Record<ClassificationType, string> = {
  HOT_LEAD: '🔥 Caliente',
  WARM_LEAD: '🟡 Tibio',
  COLD_LEAD: '🔵 Frío',
};

export const INTERACTION_LABELS: Record<InteractionType, string> = {
  VIEW: '👁️ Vista',
  CLICK: '🖱️ Click',
  FAVORITE: '❤️ Favorito',
  MESSAGE: '💬 Mensaje',
  VISIT_REQUEST: '📅 Visita',
};
