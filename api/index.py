from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from mangum import Mangum
import uuid
import random
import os
import requests as _requests
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from openai import OpenAI
import pypdf
import docx
from dotenv import load_dotenv

# Load .env file if present
load_dotenv()

# ─── FastAPI App ────────────────────────────────────────────────
app = FastAPI(title="PropTech-Flow API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Pydantic Models ───────────────────────────────────────────

class User(BaseModel):
    id: str
    name: str
    email: str
    password: str
    role: Literal["client", "agent"]
    avatar_url: str = ""
    properties_closed: int = 0
    avg_close_days: int = 0
    zone: str = ""

class Property(BaseModel):
    id: str
    owner_id: str
    agent_id: Optional[str] = None
    title: str
    description: str
    price: float
    currency: Literal["USD", "BOB"]
    type: Literal["venta", "alquiler", "anticretico"]
    has_titulo: bool = False
    has_folio: bool = False
    has_impuestos: bool = False
    status_documents: Literal["saneado", "advertencia"] = "advertencia"
    stage_crm1: int = 0
    initial_message: str = ""
    commission_type: Optional[Literal["porcentaje", "fijo"]] = None
    proposed_commission: Optional[float] = None
    client_accepted_commission: bool = False
    corretaje_status: Optional[Literal["pending", "accepted", "counteroffer"]] = None
    corretaje_exclusivity_months: Optional[int] = None
    corretaje_counteroffer_data: Optional[dict] = None
    corretaje_contract_filename: Optional[str] = None
    corretaje_contract_content: Optional[str] = None
    is_agent_signed_crm1: bool = False
    is_client_signed_crm1: bool = False
    published_to_map: bool = False

class LeadCRM2(BaseModel):
    id: str
    property_id: str
    buyer_id: str
    buyer_name: str
    buyer_phone: str
    buyer_email: str
    agent_id: str
    stage_crm2: int = 1
    # Stage 2: Interés
    buyer_showed_interest: bool = False
    reservation_amount: Optional[float] = None
    agent_confirmed_reservation_payment: bool = False
    buyer_confirmed_reservation_payment: bool = False
    # Stage 3: Contrato
    contract_filename: Optional[str] = None
    contract_analysis_data: Optional[dict] = None
    is_agent_signed: bool = False
    is_buyer_signed: bool = False
    # Stage 4: Pago
    agent_confirmed_final_payment: bool = False
    buyer_confirmed_final_payment: bool = False

# ─── Request Schemas ──────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str

class CreatePropertyRequest(BaseModel):
    title: str
    description: str
    price: float
    currency: Literal["USD", "BOB"]
    type: Literal["venta", "alquiler", "anticretico"]
    has_titulo: bool = False
    has_folio: bool = False
    has_impuestos: bool = False
    initial_message: str = ""

class AssignAgentRequest(BaseModel):
    agent_id: str

class UpdatePropertyStageRequest(BaseModel):
    stage_crm1: Optional[int] = None
    commission_type: Optional[Literal["porcentaje", "fijo"]] = None
    proposed_commission: Optional[float] = None
    client_accepted_commission: Optional[bool] = None
    corretaje_status: Optional[Literal["pending", "accepted", "counteroffer"]] = None
    corretaje_exclusivity_months: Optional[int] = None
    corretaje_counteroffer_data: Optional[dict] = None
    corretaje_contract_filename: Optional[str] = None
    corretaje_contract_content: Optional[str] = None
    is_agent_signed_crm1: Optional[bool] = None
    is_client_signed_crm1: Optional[bool] = None
    published_to_map: Optional[bool] = None

class CreateLeadRequest(BaseModel):
    property_id: str
    buyer_id: str
    buyer_name: str
    buyer_phone: str
    buyer_email: str

class UpdateLeadStageRequest(BaseModel):
    stage_crm2: Optional[int] = None
    buyer_showed_interest: Optional[bool] = None
    reservation_amount: Optional[float] = None
    agent_confirmed_reservation_payment: Optional[bool] = None
    buyer_confirmed_reservation_payment: Optional[bool] = None
    contract_filename: Optional[str] = None
    contract_analysis_data: Optional[dict] = None
    is_agent_signed: Optional[bool] = None
    is_buyer_signed: Optional[bool] = None
    agent_confirmed_final_payment: Optional[bool] = None
    buyer_confirmed_final_payment: Optional[bool] = None

class AnalyzeDocumentRequest(BaseModel):
    filename: str
    context: Literal["corretaje", "compromiso", "final"]
    transaction_type: Literal["venta", "alquiler", "anticretico"] = "venta"

class MarketingContent(BaseModel):
    title: str
    short_description: str
    long_description: str
    hashtags: list[str]
    cta: str
    reel_script: str

class PublishContentRequest(BaseModel):
    platforms: list[Literal["FACEBOOK", "INSTAGRAM"]]
    content: MarketingContent

# ─── Buyer CRM Models ─────────────────────────────────────────

PIPELINE_STAGES = ["CONTACT", "VISIT", "INTEREST", "COMMITMENT_SIGNATURE", "PAYMENT", "COMPLETED"]
INTERACTION_TYPES = ["VIEW", "CLICK", "FAVORITE", "MESSAGE", "VISIT_REQUEST"]
CLASSIFICATION_TYPES = ["HOT_LEAD", "WARM_LEAD", "COLD_LEAD"]

class BuyerPreferences(BaseModel):
    id: str
    buyer_id: str
    preferred_zones: List[str] = []
    budget_min: float = 0
    budget_max: float = 0
    property_type: Optional[Literal["venta", "alquiler", "anticretico"]] = None
    bedrooms_min: int = 0
    bedrooms_max: int = 0
    operation_type: Optional[str] = None
    created_at: str = ""
    updated_at: str = ""

class BuyerInteraction(BaseModel):
    id: str
    buyer_id: str
    property_id: str
    interaction_type: Literal["VIEW", "CLICK", "FAVORITE", "MESSAGE", "VISIT_REQUEST"]
    timestamp: str

class SavedProperty(BaseModel):
    id: str
    buyer_id: str
    property_id: str
    saved_at: str

class LeadStageHistory(BaseModel):
    id: str
    lead_id: str
    from_stage: str
    to_stage: str
    changed_at: str

class LeadClassification(BaseModel):
    lead_id: str
    buyer_id: str
    score: int = 0
    classification: Literal["HOT_LEAD", "WARM_LEAD", "COLD_LEAD"] = "COLD_LEAD"
    breakdown: dict = {}
    classified_at: str = ""

# ─── Buyer CRM Request Schemas ────────────────────────────────

class CreateBuyerPreferencesRequest(BaseModel):
    preferred_zones: List[str] = []
    budget_min: float = 0
    budget_max: float = 0
    property_type: Optional[Literal["venta", "alquiler", "anticretico"]] = None
    bedrooms_min: int = 0
    bedrooms_max: int = 0
    operation_type: Optional[str] = None

class UpdateBuyerPreferencesRequest(BaseModel):
    preferred_zones: Optional[List[str]] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    property_type: Optional[Literal["venta", "alquiler", "anticretico"]] = None
    bedrooms_min: Optional[int] = None
    bedrooms_max: Optional[int] = None
    operation_type: Optional[str] = None

class TrackInteractionRequest(BaseModel):
    property_id: str
    interaction_type: Literal["VIEW", "CLICK", "FAVORITE", "MESSAGE", "VISIT_REQUEST"]

class UpdatePipelineStageRequest(BaseModel):
    stage: Literal["CONTACT", "VISIT", "INTEREST", "COMMITMENT_SIGNATURE", "PAYMENT", "COMPLETED"]

# ─── In-Memory Database ──────────────────────────────────────

users_db: dict[str, User] = {
    "u1": User(id="u1", name="María López", email="maria@client.com", password="1234", role="client"),
    "u2": User(id="u2", name="Carlos Mendoza", email="carlos@client.com", password="1234", role="client"),
    "u3": User(id="u3", name="Ana Gutiérrez", email="ana@agent.com", password="1234", role="agent",
               properties_closed=23, avg_close_days=45, zone="Zona Sur, La Paz"),
    "u4": User(id="u4", name="Pedro Ramírez", email="pedro@agent.com", password="1234", role="agent",
               properties_closed=18, avg_close_days=38, zone="Zona Central, Cochabamba"),
    "u5": User(id="u5", name="Lucía Fernández", email="lucia@agent.com", password="1234", role="agent",
               properties_closed=31, avg_close_days=30, zone="Equipetrol, Santa Cruz"),
}

properties_db: dict[str, Property] = {
    "p1": Property(
        id="p1", owner_id="u1", agent_id="u3", title="Departamento Calacoto Premium",
        description="Hermoso departamento de 3 dormitorios con vista panorámica a la cordillera. Acabados de primera, cocina empotrada y parqueo doble.",
        price=185000, currency="USD", type="venta",
        has_titulo=True, has_folio=True, has_impuestos=True, status_documents="saneado",
        stage_crm1=4, is_agent_signed_crm1=True, is_client_signed_crm1=True, published_to_map=True,
    ),
    "p2": Property(
        id="p2", owner_id="u1", agent_id=None, title="Casa Sopocachi Colonial",
        description="Casa colonial restaurada de 4 ambientes con patio interior y terraza. Ideal para vivienda o comercio en zona privilegiada.",
        price=240000, currency="USD", type="venta",
        has_titulo=True, has_folio=True, has_impuestos=False, status_documents="advertencia",
        stage_crm1=0,
    ),
    "p3": Property(
        id="p3", owner_id="u2", agent_id="u4", title="Oficina Miraflores Centro",
        description="Oficina comercial de 120m² en edificio empresarial moderno. Incluye sala de reuniones, recepción y 3 ambientes privados.",
        price=1200, currency="USD", type="alquiler",
        has_titulo=True, has_folio=True, has_impuestos=True, status_documents="saneado",
        stage_crm1=4, is_agent_signed_crm1=True, is_client_signed_crm1=True, published_to_map=True,
    ),
    "p4": Property(
        id="p4", owner_id="u2", agent_id="u5", title="Penthouse Equipetrol Lujo",
        description="Espectacular penthouse de 200m² con piscina privada, jacuzzi y terraza panorámica. El inmueble más exclusivo de la zona.",
        price=45000, currency="USD", type="anticretico",
        has_titulo=True, has_folio=True, has_impuestos=True, status_documents="saneado",
        stage_crm1=4, is_agent_signed_crm1=True, is_client_signed_crm1=True, published_to_map=True,
    ),
}

leads_db: dict[str, LeadCRM2] = {
    "l1": LeadCRM2(id="l1", property_id="p1", buyer_id="u1", buyer_name="María López",
                  buyer_phone="+591 71234567", buyer_email="maria@client.com", agent_id="u3",
                  stage_crm2=1),
    "l2": LeadCRM2(id="l2", property_id="p1", buyer_id="u2", buyer_name="Carlos Mendoza",
                  buyer_phone="+591 76543210", buyer_email="carlos@client.com", agent_id="u3",
                  stage_crm2=2, buyer_showed_interest=True, reservation_amount=5000),
    "l3": LeadCRM2(id="l3", property_id="p3", buyer_id="u1", buyer_name="María López",
                  buyer_phone="+591 71234567", buyer_email="maria@client.com", agent_id="u4",
                  stage_crm2=1),
    "l4": LeadCRM2(id="l4", property_id="p4", buyer_id="u2", buyer_name="Carlos Mendoza",
                  buyer_phone="+591 76543210", buyer_email="carlos@client.com", agent_id="u5",
                  stage_crm2=1),
}
marketing_campaigns_db: dict[str, dict] = {}

# ─── Social Posts — persiste en archivo JSON para sobrevivir reinicios ────
import json as _json_persist

_POSTS_FILE = os.path.join(os.path.dirname(__file__), "social_posts.json")

def _load_social_posts() -> dict:
    try:
        with open(_POSTS_FILE, "r", encoding="utf-8") as f:
            return _json_persist.load(f)
    except Exception:
        return {}

def _save_social_posts() -> None:
    try:
        with open(_POSTS_FILE, "w", encoding="utf-8") as f:
            _json_persist.dump(social_posts_db, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving posts: {e}")

social_posts_db: dict[str, dict] = _load_social_posts()

# ─── Buyer CRM In-Memory Stores ──────────────────────────────

_now = datetime.utcnow()
_ts = lambda days_ago=0: (_now - timedelta(days=days_ago)).isoformat()

buyer_preferences_db: dict[str, BuyerPreferences] = {
    "u1": BuyerPreferences(id="bp1", buyer_id="u1", preferred_zones=["Calacoto", "Sopocachi", "Zona Sur"],
                           budget_min=100000, budget_max=200000, property_type="venta",
                           bedrooms_min=2, bedrooms_max=4, operation_type="compra",
                           created_at=_ts(30), updated_at=_ts(2)),
    "u2": BuyerPreferences(id="bp2", buyer_id="u2", preferred_zones=["Equipetrol", "Miraflores"],
                           budget_min=30000, budget_max=50000, property_type="anticretico",
                           bedrooms_min=1, bedrooms_max=3, operation_type="anticretico",
                           created_at=_ts(15), updated_at=_ts(5)),
}

buyer_interactions_db: dict[str, list] = {
    "u1": [
        BuyerInteraction(id="bi1", buyer_id="u1", property_id="p1", interaction_type="VIEW", timestamp=_ts(10)),
        BuyerInteraction(id="bi2", buyer_id="u1", property_id="p1", interaction_type="VIEW", timestamp=_ts(8)),
        BuyerInteraction(id="bi3", buyer_id="u1", property_id="p1", interaction_type="CLICK", timestamp=_ts(7)),
        BuyerInteraction(id="bi4", buyer_id="u1", property_id="p1", interaction_type="FAVORITE", timestamp=_ts(6)),
        BuyerInteraction(id="bi5", buyer_id="u1", property_id="p1", interaction_type="MESSAGE", timestamp=_ts(5)),
        BuyerInteraction(id="bi6", buyer_id="u1", property_id="p1", interaction_type="VISIT_REQUEST", timestamp=_ts(4)),
        BuyerInteraction(id="bi7", buyer_id="u1", property_id="p3", interaction_type="VIEW", timestamp=_ts(3)),
        BuyerInteraction(id="bi8", buyer_id="u1", property_id="p3", interaction_type="CLICK", timestamp=_ts(2)),
        BuyerInteraction(id="bi9", buyer_id="u1", property_id="p3", interaction_type="MESSAGE", timestamp=_ts(1)),
    ],
    "u2": [
        BuyerInteraction(id="bi10", buyer_id="u2", property_id="p4", interaction_type="VIEW", timestamp=_ts(12)),
        BuyerInteraction(id="bi11", buyer_id="u2", property_id="p4", interaction_type="VIEW", timestamp=_ts(9)),
        BuyerInteraction(id="bi12", buyer_id="u2", property_id="p4", interaction_type="CLICK", timestamp=_ts(7)),
        BuyerInteraction(id="bi13", buyer_id="u2", property_id="p1", interaction_type="VIEW", timestamp=_ts(5)),
        BuyerInteraction(id="bi14", buyer_id="u2", property_id="p1", interaction_type="CLICK", timestamp=_ts(3)),
    ],
}

saved_properties_db: dict[str, list] = {
    "u1": [
        SavedProperty(id="sp1", buyer_id="u1", property_id="p1", saved_at=_ts(6)),
        SavedProperty(id="sp2", buyer_id="u1", property_id="p3", saved_at=_ts(2)),
    ],
    "u2": [
        SavedProperty(id="sp3", buyer_id="u2", property_id="p4", saved_at=_ts(7)),
    ],
}

lead_stage_history_db: dict[str, list] = {
    "l1": [LeadStageHistory(id="lsh1", lead_id="l1", from_stage="CONTACT", to_stage="CONTACT", changed_at=_ts(10))],
    "l2": [
        LeadStageHistory(id="lsh2", lead_id="l2", from_stage="CONTACT", to_stage="CONTACT", changed_at=_ts(8)),
        LeadStageHistory(id="lsh3", lead_id="l2", from_stage="CONTACT", to_stage="VISIT", changed_at=_ts(5)),
    ],
    "l3": [LeadStageHistory(id="lsh4", lead_id="l3", from_stage="CONTACT", to_stage="CONTACT", changed_at=_ts(3))],
    "l4": [LeadStageHistory(id="lsh5", lead_id="l4", from_stage="CONTACT", to_stage="CONTACT", changed_at=_ts(12))],
}

lead_pipeline_stages_db: dict[str, str] = {
    "l1": "INTEREST",
    "l2": "VISIT",
    "l3": "CONTACT",
    "l4": "CONTACT",
}

lead_classifications_db: dict[str, LeadClassification] = {}


def calc_status_documents(p: Property) -> Literal["saneado", "advertencia"]:
    return "saneado" if (p.has_titulo and p.has_folio and p.has_impuestos) else "advertencia"


# ─── API Endpoints ────────────────────────────────────────────

@app.post("/api/auth/login")
def login(req: LoginRequest):
    for user in users_db.values():
        if user.email == req.email and user.password == req.password:
            return {"user": user.model_dump(exclude={"password"})}
    raise HTTPException(status_code=401, detail="Credenciales inválidas")


@app.get("/api/properties")
def get_properties(
    owner_id: Optional[str] = None,
    agent_id: Optional[str] = None,
    published_to_map: Optional[bool] = None,
    stage_crm1: Optional[int] = None,
    type: Optional[str] = None,
):
    results = list(properties_db.values())
    if owner_id:
        results = [p for p in results if p.owner_id == owner_id]
    if agent_id:
        results = [p for p in results if p.agent_id == agent_id]
    if published_to_map is not None:
        results = [p for p in results if p.published_to_map == published_to_map]
    if stage_crm1 is not None:
        results = [p for p in results if p.stage_crm1 == stage_crm1]
    if type:
        results = [p for p in results if p.type == type]
    return [p.model_dump() for p in results]


@app.get("/api/properties/{property_id}")
def get_property(property_id: str):
    if property_id not in properties_db:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    return properties_db[property_id].model_dump()


@app.post("/api/properties")
def create_property(req: CreatePropertyRequest, owner_id: str = ""):
    pid = f"p{uuid.uuid4().hex[:8]}"
    prop = Property(
        id=pid,
        owner_id=owner_id,
        title=req.title,
        description=req.description,
        price=req.price,
        currency=req.currency,
        type=req.type,
        has_titulo=req.has_titulo,
        has_folio=req.has_folio,
        has_impuestos=req.has_impuestos,
        initial_message=req.initial_message,
        stage_crm1=0,
    )
    prop.status_documents = calc_status_documents(prop)
    properties_db[pid] = prop
    return prop.model_dump()


@app.post("/api/properties/{property_id}/assign-agent")
def assign_agent(property_id: str, req: AssignAgentRequest):
    if property_id not in properties_db:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    if req.agent_id not in users_db:
        raise HTTPException(status_code=404, detail="Agente no encontrado")
    prop = properties_db[property_id]
    prop.agent_id = req.agent_id
    prop.stage_crm1 = 1
    properties_db[property_id] = prop
    return prop.model_dump()


@app.put("/api/properties/{property_id}/update-stage")
def update_property_stage(property_id: str, req: UpdatePropertyStageRequest):
    if property_id not in properties_db:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    prop = properties_db[property_id]
    update_data = req.model_dump(exclude_none=True)
    for key, value in update_data.items():
        setattr(prop, key, value)
    prop.status_documents = calc_status_documents(prop)
    properties_db[property_id] = prop
    return prop.model_dump()


@app.get("/api/agents")
def get_agents():
    agents = [u for u in users_db.values() if u.role == "agent"]
    return [a.model_dump(exclude={"password"}) for a in agents]


@app.get("/api/leads-crm2")
def get_leads(
    buyer_id: Optional[str] = None,
    agent_id: Optional[str] = None,
    property_id: Optional[str] = None,
):
    results = list(leads_db.values())
    if buyer_id:
        results = [l for l in results if l.buyer_id == buyer_id]
    if agent_id:
        results = [l for l in results if l.agent_id == agent_id]
    if property_id:
        results = [l for l in results if l.property_id == property_id]
    return [l.model_dump() for l in results]


@app.post("/api/leads-crm2")
def create_lead(req: CreateLeadRequest):
    if req.property_id not in properties_db:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    prop = properties_db[req.property_id]
    if not prop.agent_id:
        raise HTTPException(status_code=400, detail="La propiedad no tiene agente asignado")
    lid = f"l{uuid.uuid4().hex[:8]}"
    lead = LeadCRM2(
        id=lid,
        property_id=req.property_id,
        buyer_id=req.buyer_id,
        buyer_name=req.buyer_name,
        buyer_phone=req.buyer_phone,
        buyer_email=req.buyer_email,
        agent_id=prop.agent_id,
        stage_crm2=1,
    )
    leads_db[lid] = lead
    return lead.model_dump()


@app.put("/api/leads-crm2/{lead_id}/update-stage")
def update_lead_stage(lead_id: str, req: UpdateLeadStageRequest):
    if lead_id not in leads_db:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    lead = leads_db[lead_id]
    update_data = req.model_dump(exclude_none=True)
    for key, value in update_data.items():
        setattr(lead, key, value)

    # Auto-advance stage logic
    if lead.buyer_showed_interest and lead.stage_crm2 == 1:
        lead.stage_crm2 = 2
    if (lead.agent_confirmed_reservation_payment and
            lead.buyer_confirmed_reservation_payment and
            lead.stage_crm2 == 2):
        lead.stage_crm2 = 3
    if lead.is_agent_signed and lead.is_buyer_signed and lead.stage_crm2 == 3:
        lead.stage_crm2 = 4
    if (lead.agent_confirmed_final_payment and
            lead.buyer_confirmed_final_payment and
            lead.stage_crm2 == 4):
        lead.stage_crm2 = 5

    # Auto-archive trigger: when CRM2 reaches stage 5
    if lead.stage_crm2 == 5:
        prop_id = lead.property_id
        if prop_id in properties_db:
            prop = properties_db[prop_id]
            prop.stage_crm1 = 5
            prop.published_to_map = False
            properties_db[prop_id] = prop

    leads_db[lead_id] = lead
    return lead.model_dump()


class GenerateCorretajeContractRequest(BaseModel):
    property_id: str
    owner_name: str

@app.post("/api/ai/generate-contract")
async def generate_corretaje_contract(req: GenerateCorretajeContractRequest):
    import json
    if req.property_id not in properties_db:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    
    prop = properties_db[req.property_id]
    today = datetime.utcnow().strftime("%d de %B de %Y")
    commission_text = (
        f"{prop.proposed_commission}% del precio de {prop.type} final"
        if prop.commission_type == "porcentaje"
        else f"${prop.proposed_commission:,.0f} USD (Monto Fijo)"
    ) if prop.proposed_commission else "A convenir"
    exclusivity = f"{prop.corretaje_exclusivity_months} meses" if prop.corretaje_exclusivity_months else "A convenir"

    prompt = f"""
    Eres un abogado especialista en derecho inmobiliario de Bolivia.
    Redacta un CONTRATO DE CORRETAJE INMOBILIARIO formal y completo en español, adaptado a la legislación boliviana.
    
    Datos del contrato:
    - Propietario: {req.owner_name}
    - Inmueble: {prop.title}
    - Descripción: {prop.description}
    - Precio de oferta: {prop.price:,.0f} {prop.currency}
    - Tipo de operación: {prop.type.upper()}
    - Comisión pactada: {commission_text}
    - Exclusividad: {exclusivity}
    - Fecha: {today}, Cochabamba, Bolivia
    - Corredor: PROPTECH-FLOW S.R.L.
    
    Estructura obligatoria del contrato (cada cláusula numerada en MAYÚSCULAS):
    PRIMERA: (LAS PARTES) - Identificar propietario y corredor
    SEGUNDA: (DEL OBJETO) - Inmueble y tipo de operación
    TERCERA: (PRECIO DE OFERTA) - Precio base acordado
    CUARTA: (COMISIÓN Y HONORARIOS) - Monto y condiciones de pago
    QUINTA: (EXCLUSIVIDAD) - Duración y condiciones
    SEXTA: (OBLIGACIONES DEL CORREDOR) - Servicios que provee PropTech-Flow
    SÉPTIMA: (OBLIGACIONES DEL PROPIETARIO) - Compromisos del propietario
    OCTAVA: (RESOLUCIÓN DEL CONTRATO) - Causales de resolución
    NOVENA: (CONFORMIDAD DIGITAL) - Aceptación digital en plataforma
    
    Usa lenguaje formal y jurídico boliviano. NO incluyas firmas ni campos de firma. NO uses markdown. Solo texto plano.
    """

    api_key = os.environ.get("OPENAI_API_KEY")
    if api_key:
        try:
            oai_client = OpenAI(api_key=api_key)
            response = oai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "Eres un abogado boliviano experto en contratos inmobiliarios. Redacta en texto plano, sin markdown."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=2000,
            )
            content = response.choices[0].message.content
            prop.corretaje_contract_content = content
            properties_db[req.property_id] = prop
            return {"content": content}
        except Exception as e:
            print(f"OpenAI Error: {e}")

    # Fallback hardcoded si falla OpenAI
    fallback = f"""CONTRATO DE CORRETAJE INMOBILIARIO
Cochabamba, Bolivia — {today}

PRIMERA: (LAS PARTES)
Intervienen en el presente contrato: {req.owner_name}, mayor de edad, hábil por derecho, en adelante EL/LA PROPIETARIO/A; y PROPTECH-FLOW S.R.L., representada por su agente autorizado, en adelante EL CORREDOR.

SEGUNDA: (DEL OBJETO DEL CONTRATO)
EL/LA PROPIETARIO/A declara ser titular legítimo del inmueble denominado "{prop.title}" y otorga a EL CORREDOR mandato exclusivo para su {prop.type}.

TERCERA: (PRECIO DE OFERTA)
Las partes acuerdan un precio base de {prop.price:,.0f} {prop.currency}. Cualquier modificación deberá ser aprobada por escrito.

CUARTA: (COMISIÓN Y HONORARIOS)
En caso de concretarse la operación, EL/LA PROPIETARIO/A cancelará por concepto de honorarios: {commission_text}.

QUINTA: (EXCLUSIVIDAD)
El presente contrato tiene carácter de exclusividad por un período de {exclusivity}.

SEXTA: (CONFORMIDAD DIGITAL)
Las partes aceptan digitalmente el presente documento a través de la plataforma PropTech-Flow."""
    prop.corretaje_contract_content = fallback
    properties_db[req.property_id] = prop
    return {"content": fallback}


@app.post("/api/ai/analyze-document")

async def analyze_document(
    file: UploadFile = File(...),
    context: str = Form(...),
    transaction_type: str = Form(...),
    property_id: Optional[str] = Form(None)
):
    import io
    import json
    
    text_content = ""
    try:
        content = await file.read()
        if file.filename.endswith('.pdf'):
            pdf_reader = pypdf.PdfReader(io.BytesIO(content))
            text_content = "\n".join(page.extract_text() for page in pdf_reader.pages if page.extract_text())
        elif file.filename.endswith('.docx'):
            doc = docx.Document(io.BytesIO(content))
            text_content = "\n".join(para.text for para in doc.paragraphs)
        else:
            text_content = content.decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error extracting text: {e}")
        text_content = "Error de extracción."

    prop_context = "Sin datos de propiedad."
    if property_id and property_id in properties_db:
        prop = properties_db[property_id]
        prop_context = f"Precio: {prop.price} {prop.currency}, Tipo: {prop.type}, Título: {prop.title}"

    api_key = os.environ.get("OPENAI_API_KEY")
    if api_key:
        client = OpenAI(api_key=api_key)
        prompt = f"""
        Actúa como un abogado auditor de contratos inmobiliarios en Bolivia.
        Analiza el siguiente contrato ({context}) para una transacción de {transaction_type}.
        Datos de la propiedad para contrastar: {prop_context}
        Texto del contrato:
        {text_content[:6000]}

        Devuelve un JSON estrictamente con esta estructura:
        {{
            "score": [número del 0 al 100 de seguridad general],
            "summary": "[resumen general del análisis]",
            "clauses": [
                {{
                    "text": "[texto de la cláusula extraída]",
                    "type": "safe" o "dangerous",
                    "tooltip": "[explicación de por qué es segura o peligrosa, señalando si los datos como precio/m2 no coinciden con la propiedad]"
                }}
            ]
        }}
        """
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a legal AI assistant. Output valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                response_format={ "type": "json_object" }
            )
            result = json.loads(response.choices[0].message.content)
            result["filename"] = file.filename
            result["text_content"] = text_content
            return result
        except Exception as e:
            print(f"OpenAI API Error: {e}")

    # Fallback si falla OpenAI o no hay API KEY
    score = 85
    clauses = [
        {"text": "CLÁUSULA DE FALLBACK", "type": "safe", "tooltip": "Modo de simulación activado."}
    ]
    return {
        "filename": file.filename,
        "score": score,
        "clauses": clauses,
        "text_content": text_content,
        "summary": "Análisis simulado (OpenAI no configurado o falló)."
    }


# ─── Buyer CRM: Lead Scoring Service ─────────────────────────

def calculate_lead_score(buyer_id: str) -> dict:
    """Heuristic AI lead scoring based on engagement metrics."""
    interactions = buyer_interactions_db.get(buyer_id, [])
    saved = saved_properties_db.get(buyer_id, [])
    prefs = buyer_preferences_db.get(buyer_id)

    # Count interaction types
    views = sum(1 for i in interactions if i.interaction_type == "VIEW")
    clicks = sum(1 for i in interactions if i.interaction_type == "CLICK")
    favorites = sum(1 for i in interactions if i.interaction_type == "FAVORITE")
    messages = sum(1 for i in interactions if i.interaction_type == "MESSAGE")
    visit_requests = sum(1 for i in interactions if i.interaction_type == "VISIT_REQUEST")

    # Repeated views on same property
    property_views: dict[str, int] = {}
    for i in interactions:
        if i.interaction_type == "VIEW":
            property_views[i.property_id] = property_views.get(i.property_id, 0) + 1
    repeat_views = sum(1 for v in property_views.values() if v > 1)

    # Engagement recency (days since last interaction)
    recency_score = 0
    if interactions:
        try:
            last = max(datetime.fromisoformat(i.timestamp) for i in interactions)
            days_ago = (datetime.utcnow() - last).days
            recency_score = max(0, 10 - days_ago) * 10  # 0-100
        except Exception:
            recency_score = 0

    # Preference completeness
    pref_score = 0
    if prefs:
        fields = [prefs.preferred_zones, prefs.budget_max > 0, prefs.property_type, prefs.bedrooms_max > 0]
        pref_score = sum(1 for f in fields if f) * 25  # 0-100

    # Weighted scoring
    breakdown = {
        "views": min(views * 5, 100),
        "repeat_views": min(repeat_views * 20, 100),
        "clicks": min(clicks * 10, 100),
        "messages": min(messages * 15, 100),
        "visit_requests": min(visit_requests * 25, 100),
        "favorites": min(favorites * 15, 100),
        "saved_properties": min(len(saved) * 20, 100),
        "preference_completeness": pref_score,
        "engagement_recency": recency_score,
    }

    weights = {
        "views": 0.08, "repeat_views": 0.15, "clicks": 0.08,
        "messages": 0.15, "visit_requests": 0.20, "favorites": 0.08,
        "saved_properties": 0.08, "preference_completeness": 0.08, "engagement_recency": 0.10,
    }

    total = sum(breakdown[k] * weights[k] for k in weights)
    score = min(int(total), 100)

    if score >= 70:
        classification = "HOT_LEAD"
    elif score >= 40:
        classification = "WARM_LEAD"
    else:
        classification = "COLD_LEAD"

    return {"score": score, "classification": classification, "breakdown": breakdown}


# ─── Buyer CRM Endpoints ─────────────────────────────────────

@app.get("/api/buyers/{buyer_id}/preferences")
def get_buyer_preferences(buyer_id: str):
    if buyer_id not in buyer_preferences_db:
        return {"buyer_id": buyer_id, "preferences": None}
    return buyer_preferences_db[buyer_id].model_dump()


@app.post("/api/buyers/{buyer_id}/preferences")
def create_buyer_preferences(buyer_id: str, req: CreateBuyerPreferencesRequest):
    now = datetime.utcnow().isoformat()
    bp = BuyerPreferences(
        id=f"bp{uuid.uuid4().hex[:8]}", buyer_id=buyer_id,
        **req.model_dump(), created_at=now, updated_at=now,
    )
    buyer_preferences_db[buyer_id] = bp
    return bp.model_dump()


@app.patch("/api/buyers/{buyer_id}/preferences")
def update_buyer_preferences(buyer_id: str, req: UpdateBuyerPreferencesRequest):
    if buyer_id not in buyer_preferences_db:
        raise HTTPException(status_code=404, detail="Preferencias no encontradas")
    bp = buyer_preferences_db[buyer_id]
    for key, value in req.model_dump(exclude_none=True).items():
        setattr(bp, key, value)
    bp.updated_at = datetime.utcnow().isoformat()
    buyer_preferences_db[buyer_id] = bp
    return bp.model_dump()


@app.post("/api/buyers/{buyer_id}/interactions")
def track_interaction(buyer_id: str, req: TrackInteractionRequest):
    if req.property_id not in properties_db:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    interaction = BuyerInteraction(
        id=f"bi{uuid.uuid4().hex[:8]}", buyer_id=buyer_id,
        property_id=req.property_id, interaction_type=req.interaction_type,
        timestamp=datetime.utcnow().isoformat(),
    )
    if buyer_id not in buyer_interactions_db:
        buyer_interactions_db[buyer_id] = []
    buyer_interactions_db[buyer_id].append(interaction)
    return interaction.model_dump()


@app.get("/api/buyers/{buyer_id}/interactions")
def get_buyer_interactions(buyer_id: str):
    interactions = buyer_interactions_db.get(buyer_id, [])
    return [i.model_dump() for i in interactions]


@app.post("/api/buyers/{buyer_id}/saved-properties")
def save_property(buyer_id: str, property_id: str):
    if property_id not in properties_db:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    sp = SavedProperty(
        id=f"sp{uuid.uuid4().hex[:8]}", buyer_id=buyer_id,
        property_id=property_id, saved_at=datetime.utcnow().isoformat(),
    )
    if buyer_id not in saved_properties_db:
        saved_properties_db[buyer_id] = []
    saved_properties_db[buyer_id].append(sp)
    return sp.model_dump()


@app.get("/api/buyers/{buyer_id}/saved-properties")
def get_saved_properties(buyer_id: str):
    saved = saved_properties_db.get(buyer_id, [])
    return [s.model_dump() for s in saved]


@app.delete("/api/buyers/{buyer_id}/saved-properties/{property_id}")
def remove_saved_property(buyer_id: str, property_id: str):
    if buyer_id in saved_properties_db:
        saved_properties_db[buyer_id] = [s for s in saved_properties_db[buyer_id] if s.property_id != property_id]
    return {"status": "removed"}


@app.patch("/api/agents/leads/{lead_id}/stage")
def update_pipeline_stage(lead_id: str, req: UpdatePipelineStageRequest):
    if lead_id not in leads_db:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    old_stage = lead_pipeline_stages_db.get(lead_id, "CONTACT")
    lead_pipeline_stages_db[lead_id] = req.stage
    # Record history
    history = LeadStageHistory(
        id=f"lsh{uuid.uuid4().hex[:8]}", lead_id=lead_id,
        from_stage=old_stage, to_stage=req.stage,
        changed_at=datetime.utcnow().isoformat(),
    )
    if lead_id not in lead_stage_history_db:
        lead_stage_history_db[lead_id] = []
    lead_stage_history_db[lead_id].append(history)
    return {"lead_id": lead_id, "stage": req.stage, "history": history.model_dump()}


@app.get("/api/agents/leads/pipeline")
def get_pipeline(agent_id: Optional[str] = None):
    agent_leads = list(leads_db.values())
    if agent_id:
        agent_leads = [l for l in agent_leads if l.agent_id == agent_id]

    pipeline: dict[str, list] = {stage: [] for stage in PIPELINE_STAGES}
    for lead in agent_leads:
        stage = lead_pipeline_stages_db.get(lead.id, "CONTACT")
        classification = lead_classifications_db.get(lead.id)
        lead_data = lead.model_dump()
        lead_data["pipeline_stage"] = stage
        lead_data["classification"] = classification.model_dump() if classification else None
        lead_data["preferences"] = buyer_preferences_db.get(lead.buyer_id, None)
        if lead_data["preferences"]:
            lead_data["preferences"] = lead_data["preferences"].model_dump()
        pipeline[stage].append(lead_data)
    return pipeline


@app.post("/api/agents/leads/{lead_id}/classify")
def classify_lead(lead_id: str):
    if lead_id not in leads_db:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    lead = leads_db[lead_id]
    result = calculate_lead_score(lead.buyer_id)
    classification = LeadClassification(
        lead_id=lead_id, buyer_id=lead.buyer_id,
        score=result["score"], classification=result["classification"],
        breakdown=result["breakdown"], classified_at=datetime.utcnow().isoformat(),
    )
    lead_classifications_db[lead_id] = classification
    return classification.model_dump()


@app.get("/api/agents/{agent_id}/dashboard")
def get_agent_dashboard(agent_id: str):
    agent_leads = [l for l in leads_db.values() if l.agent_id == agent_id]
    lead_ids = [l.id for l in agent_leads]

    # Auto-classify any unclassified leads
    for lead in agent_leads:
        if lead.id not in lead_classifications_db:
            result = calculate_lead_score(lead.buyer_id)
            lead_classifications_db[lead.id] = LeadClassification(
                lead_id=lead.id, buyer_id=lead.buyer_id,
                score=result["score"], classification=result["classification"],
                breakdown=result["breakdown"], classified_at=datetime.utcnow().isoformat(),
            )

    classifications = [lead_classifications_db[lid].model_dump() for lid in lead_ids if lid in lead_classifications_db]
    hot_leads = [c for c in classifications if c["classification"] == "HOT_LEAD"]
    warm_leads = [c for c in classifications if c["classification"] == "WARM_LEAD"]
    avg_score = int(sum(c["score"] for c in classifications) / max(len(classifications), 1))

    # Recent interactions from all buyers of this agent's leads
    buyer_ids = list(set(l.buyer_id for l in agent_leads))
    all_interactions = []
    for bid in buyer_ids:
        for inter in buyer_interactions_db.get(bid, []):
            d = inter.model_dump()
            d["buyer_name"] = next((u.name for u in users_db.values() if u.id == bid), bid)
            prop = properties_db.get(inter.property_id)
            d["property_title"] = prop.title if prop else inter.property_id
            all_interactions.append(d)
    all_interactions.sort(key=lambda x: x["timestamp"], reverse=True)

    # Pipeline summary
    pipeline_summary = {stage: 0 for stage in PIPELINE_STAGES}
    for lead in agent_leads:
        stage = lead_pipeline_stages_db.get(lead.id, "CONTACT")
        pipeline_summary[stage] += 1

    # Build enriched leads list
    enriched_leads = []
    for lead in agent_leads:
        ld = lead.model_dump()
        ld["pipeline_stage"] = lead_pipeline_stages_db.get(lead.id, "CONTACT")
        ld["classification"] = lead_classifications_db.get(lead.id)
        if ld["classification"]:
            ld["classification"] = ld["classification"].model_dump()
        ld["preferences"] = buyer_preferences_db.get(lead.buyer_id)
        if ld["preferences"]:
            ld["preferences"] = ld["preferences"].model_dump()
        enriched_leads.append(ld)

    return {
        "total_leads": len(agent_leads),
        "hot_leads_count": len(hot_leads),
        "warm_leads_count": len(warm_leads),
        "cold_leads_count": len(classifications) - len(hot_leads) - len(warm_leads),
        "avg_score": avg_score,
        "classifications": classifications,
        "recent_interactions": all_interactions[:15],
        "pipeline_summary": pipeline_summary,
        "leads": enriched_leads,
    }


# ─── Marketing Helpers ────────────────────────────────────────

def generate_marketing_content(prop: Property) -> MarketingContent:
    import json as _json
    type_map = {"venta": "Venta", "alquiler": "Alquiler", "anticretico": "Anticrético"}
    type_label = type_map[prop.type]
    price_str = f"USD {prop.price:,.0f}" if prop.currency == "USD" else f"BOB {prop.price:,.0f}"
    doc_note = "Documentos saneados" if prop.status_documents == "saneado" else "Consultar documentación"

    api_key = os.environ.get("OPENAI_API_KEY")
    if api_key:
        try:
            oai_client = OpenAI(api_key=api_key)
            prompt = f"""Eres un experto en marketing inmobiliario para el mercado boliviano.
Genera contenido de redes sociales para esta propiedad y devuelve SOLO un JSON con estas claves exactas:
- title: titulo atractivo maximo 80 caracteres
- short_description: descripcion corta impactante maximo 120 caracteres
- long_description: descripcion larga con emojis maximo 400 caracteres destacando precio y documentacion
- hashtags: lista de 6 hashtags relevantes para Bolivia
- cta: llamada a la accion urgente maximo 80 caracteres
- reel_script: script de reel de 30 segundos con 4 escenas y timecodes

PROPIEDAD:
Nombre: {prop.title}
Descripcion: {prop.description}
Operacion: {type_label}
Precio: {price_str}
Documentacion: {doc_note}

Responde UNICAMENTE con el JSON, sin markdown ni texto adicional."""

            response = oai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "Eres un experto en marketing inmobiliario boliviano. Respondes solo con JSON valido, sin markdown."},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=1000,
            )
            raw = response.choices[0].message.content.strip()
            # Limpia markdown si el modelo lo incluye pese a la instruccion
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            data = _json.loads(raw)

            # reel_script puede llegar como string o como lista de escenas
            reel_raw = data.get("reel_script", "")
            if isinstance(reel_raw, list):
                reel_script = "\n\n".join(
                    f"[{s.get('timecode', '')}] {s.get('scene', s.get('description', str(s)))}"
                    for s in reel_raw
                )
            else:
                reel_script = str(reel_raw)

            return MarketingContent(
                title=data.get("title", prop.title),
                short_description=data.get("short_description", ""),
                long_description=data.get("long_description", ""),
                hashtags=[str(h) for h in data.get("hashtags", [])],
                cta=data.get("cta", ""),
                reel_script=reel_script,
            )
        except Exception as e:
            print(f"OpenAI marketing error: {e}")

    # Fallback si OpenAI no esta disponible
    hashtags = [
        f"#{prop.type.capitalize()}Bolivia", "#InmuebleBolivia", "#PropTechFlow",
        "#BienesRaices", "#Inmuebles",
        "#PropiedadSaneada" if prop.status_documents == "saneado" else "#OportunidadInmobiliaria",
    ]
    title_map = {
        "venta": f"¡{prop.title} – Tu nuevo hogar te espera!",
        "alquiler": f"{prop.title} – Disponible para alquiler inmediato",
        "anticretico": f"{prop.title} – Oportunidad única en anticrético",
    }
    return MarketingContent(
        title=title_map[prop.type],
        short_description=f"{prop.description[:120]}... Precio: {price_str} | {type_label}.",
        long_description=(
            f"🏠 {prop.title}\n\n{prop.description}\n\n"
            f"💰 {price_str} | 📋 {type_label} | 📄 {doc_note}\n\n"
            f"Contáctanos y agenda tu visita. #PropTechFlow"
        ),
        hashtags=hashtags,
        cta="📩 ¡Escríbenos ahora y agenda tu visita!",
        reel_script=(
            f"[ESCENA 1 – 0:00-0:05] Fachada. Texto: \"{prop.title}\"\n\n"
            f"[ESCENA 2 – 0:05-0:15] Interior.\nVoz: \"{prop.description[:80]}...\"\n\n"
            f"[ESCENA 3 – 0:15-0:22] Acabados. Texto: \"{price_str} | {type_label}\"\n\n"
            f"[ESCENA 4 – 0:22-0:28] Panorámica.\nVoz: \"¡Contáctanos hoy!\"\n\n"
            f"[CIERRE – 0:28-0:30] Logo PropTech-Flow."
        ),
    )


def generate_mock_analytics(property_id: str, posts: list) -> dict:
    views = sum(p.get("demo_views", 0) for p in posts)
    clicks = sum(p.get("demo_clicks", 0) for p in posts)
    likes = sum(p.get("demo_likes", 0) for p in posts)
    comments = sum(p.get("demo_comments", 0) for p in posts)
    raw_score = (likes * 2 + comments * 4 + clicks) / max(views + 1, 1) * 10
    return {
        "property_id": property_id,
        "views": views,
        "clicks": clicks,
        "likes": likes,
        "comments": comments,
        "shares": 0,
        "saves": 0,
        "messages": comments,
        "engagement_score": round(min(raw_score, 9.9), 1),
        "posts": posts,
        "source": "no_data",
    }


# ─── Meta Graph API Helpers ───────────────────────────────────

_META_API = "https://graph.facebook.com/v19.0"


def _post_to_facebook(text: str) -> Optional[str]:
    """Posts to a Facebook Page. Returns the post_id on success, None if not configured or failed."""
    token = os.getenv("META_ACCESS_TOKEN", "")
    page_id = os.getenv("META_PAGE_ID", "")
    if not token or not page_id:
        return None

    image_url = os.getenv("META_DEFAULT_IMAGE_URL", "")

    # Intento 1: post con imagen
    if image_url:
        try:
            resp = _requests.post(
                f"{_META_API}/{page_id}/photos",
                data={"caption": text, "url": image_url, "access_token": token},
                timeout=20,
            )
            if resp.ok:
                body = resp.json()
                return body.get("post_id") or body.get("id")
        except Exception:
            pass

    # Intento 2: post solo texto (fallback)
    try:
        resp = _requests.post(
            f"{_META_API}/{page_id}/feed",
            data={"message": text, "access_token": token},
            timeout=15,
        )
        if resp.ok:
            return resp.json().get("id")
    except Exception:
        pass

    return None


def _post_to_instagram(caption: str) -> Optional[str]:
    """Posts to an Instagram Business account (2-step flow). Returns media_id on success, None otherwise."""
    token = os.getenv("META_ACCESS_TOKEN", "")
    ig_user_id = os.getenv("META_IG_USER_ID", "")
    image_url = os.getenv("META_DEFAULT_IMAGE_URL", "")
    if not token or not ig_user_id or not image_url:
        return None
    try:
        # Step 1: create media container
        r1 = _requests.post(
            f"{_META_API}/{ig_user_id}/media",
            data={"image_url": image_url, "caption": caption[:2200], "access_token": token},
            timeout=15,
        )
        r1.raise_for_status()
        container_id = r1.json().get("id")
        if not container_id:
            return None
        # Step 2: publish container
        r2 = _requests.post(
            f"{_META_API}/{ig_user_id}/media_publish",
            data={"creation_id": container_id, "access_token": token},
            timeout=15,
        )
        r2.raise_for_status()
        return r2.json().get("id")
    except Exception:
        return None


def _fetch_real_insights(posts: list, property_id: str) -> Optional[dict]:
    """Fetches real engagement from Meta Graph API.
    Reactions/comments/shares are immediate. Views/clicks need ~15 min to populate."""
    token = os.getenv("META_ACCESS_TOKEN", "")
    if not token:
        return None
    real_posts = [p for p in posts if p.get("meta_post_id")]
    if not real_posts:
        return None

    total_views = 0
    total_clicks = 0
    total_likes = 0
    total_comments = 0
    total_shares = 0

    for post in real_posts:
        mid = post["meta_post_id"]
        try:
            if post["platform"] == "FACEBOOK":
                # Reacciones, comentarios y compartidos — disponibles inmediatamente
                resp = _requests.get(
                    f"{_META_API}/{mid}",
                    params={
                        "fields": "reactions.summary(true),comments.summary(true),shares",
                        "access_token": token,
                    },
                    timeout=10,
                )
                if resp.ok:
                    data = resp.json()
                    total_likes += data.get("reactions", {}).get("summary", {}).get("total_count", 0)
                    total_comments += data.get("comments", {}).get("summary", {}).get("total_count", 0)
                    total_shares += data.get("shares", {}).get("count", 0)

                # Impresiones y clics — disponibles ~15 min después de publicar
                resp2 = _requests.get(
                    f"{_META_API}/{mid}/insights",
                    params={"metric": "post_impressions,post_clicks", "period": "lifetime", "access_token": token},
                    timeout=10,
                )
                if resp2.ok:
                    for item in resp2.json().get("data", []):
                        values = item.get("values", [{}])
                        val = values[-1].get("value", 0) if values else 0
                        if item["name"] == "post_impressions":
                            total_views += val
                        elif item["name"] == "post_clicks":
                            total_clicks += val

            elif post["platform"] == "INSTAGRAM":
                resp = _requests.get(
                    f"{_META_API}/{mid}",
                    params={
                        "fields": "like_count,comments_count",
                        "access_token": token,
                    },
                    timeout=10,
                )
                if resp.ok:
                    data = resp.json()
                    total_likes += data.get("like_count", 0)
                    total_comments += data.get("comments_count", 0)

                resp2 = _requests.get(
                    f"{_META_API}/{mid}/insights",
                    params={"metric": "impressions,saves", "access_token": token},
                    timeout=10,
                )
                if resp2.ok:
                    for item in resp2.json().get("data", []):
                        values = item.get("values", [{}])
                        val = values[-1].get("value", 0) if values else 0
                        if item["name"] == "impressions":
                            total_views += val

        except Exception:
            continue

    # Si no hay ningún dato real aún, retorna None para usar el mock
    if total_likes == 0 and total_comments == 0 and total_shares == 0 and total_views == 0:
        return None

    raw_score = (total_likes * 2 + total_comments * 4 + total_shares * 6 + total_clicks) / max(total_views + 1, 1) * 10
    return {
        "property_id": property_id,
        "views": total_views,
        "clicks": total_clicks,
        "likes": total_likes,
        "comments": total_comments,
        "shares": total_shares,
        "saves": 0,
        "messages": total_comments,
        "engagement_score": round(min(raw_score, 9.9), 1),
        "posts": posts,
        "source": "meta_api",
    }


# ─── Debug Endpoint (temporal) ────────────────────────────────

@app.get("/api/debug/meta")
def debug_meta():
    token = os.getenv("META_ACCESS_TOKEN", "")
    page_id = os.getenv("META_PAGE_ID", "")
    ig_user_id = os.getenv("META_IG_USER_ID", "")
    image_url = os.getenv("META_DEFAULT_IMAGE_URL", "")
    result = {
        "META_ACCESS_TOKEN": f"{token[:10]}...{token[-5:]}" if len(token) > 15 else ("VACÍO" if not token else token),
        "META_PAGE_ID": page_id or "VACÍO",
        "META_IG_USER_ID": ig_user_id or "VACÍO",
        "ids_son_iguales": page_id == ig_user_id,
        "META_DEFAULT_IMAGE_URL": image_url or "VACÍO",
        "tokens_configurados": bool(token and page_id),
    }
    if token and page_id:
        # Test página de Facebook
        try:
            resp = _requests.get(
                f"{_META_API}/{page_id}",
                params={"fields": "name,id", "access_token": token},
                timeout=10,
            )
            result["facebook_page_test"] = resp.json()
        except Exception as e:
            result["facebook_page_test"] = f"ERROR: {e}"

        # Test permisos del token
        try:
            resp = _requests.get(
                f"{_META_API}/me/permissions",
                params={"access_token": token},
                timeout=10,
            )
            perms = resp.json().get("data", [])
            result["permisos"] = [p["permission"] for p in perms if p.get("status") == "granted"]
        except Exception as e:
            result["permisos"] = f"ERROR: {e}"

        # Test publicación en Facebook (texto simple, sin imagen)
        try:
            resp = _requests.post(
                f"{_META_API}/{page_id}/feed",
                data={"message": "[TEST PropTechFlow] Verificando conexión.", "access_token": token},
                timeout=15,
            )
            result["facebook_post_test"] = resp.json()
        except Exception as e:
            result["facebook_post_test"] = f"ERROR: {e}"

        # Test Instagram: obtener cuenta vinculada
        try:
            resp = _requests.get(
                f"{_META_API}/{page_id}",
                params={"fields": "instagram_business_account", "access_token": token},
                timeout=10,
            )
            result["instagram_vinculado"] = resp.json()
        except Exception as e:
            result["instagram_vinculado"] = f"ERROR: {e}"
    return result


@app.get("/api/debug/analytics/{property_id}")
def debug_analytics(property_id: str):
    """Returns raw Meta API responses for all posts of a property — use to diagnose why metrics show 0."""
    token = os.getenv("META_ACCESS_TOKEN", "")
    page_id = os.getenv("META_PAGE_ID", "")
    result = {
        "property_id": property_id,
        "token_configured": bool(token),
        "posts_in_db": [],
        "meta_responses": [],
    }
    posts = [
        {**v, "id": k}
        for k, v in social_posts_db.items()
        if v.get("property_id") == property_id
    ]
    result["posts_in_db"] = posts

    if not token:
        result["error"] = "META_ACCESS_TOKEN no configurado"
        return result

    for post in posts:
        mid = post.get("meta_post_id")
        platform = post.get("platform")
        entry = {"meta_post_id": mid, "platform": platform, "reactions_raw": None, "insights_raw": None, "error": None}
        if not mid:
            entry["error"] = "No meta_post_id stored"
            result["meta_responses"].append(entry)
            continue
        try:
            if platform == "FACEBOOK":
                r = _requests.get(
                    f"{_META_API}/{mid}",
                    params={"fields": "id,reactions.summary(true),comments.summary(true),shares", "access_token": token},
                    timeout=10,
                )
                entry["reactions_raw"] = {"status": r.status_code, "body": r.json()}
                r2 = _requests.get(
                    f"{_META_API}/{mid}/insights",
                    params={"metric": "post_impressions,post_clicks", "period": "lifetime", "access_token": token},
                    timeout=10,
                )
                entry["insights_raw"] = {"status": r2.status_code, "body": r2.json()}
                # Also try as page post via page ID (in case mid is photo id, not post id)
                if page_id and "_" not in str(mid):
                    r3 = _requests.get(
                        f"{_META_API}/{page_id}_{mid}",
                        params={"fields": "id,reactions.summary(true),comments.summary(true),shares", "access_token": token},
                        timeout=10,
                    )
                    entry["with_page_prefix"] = {"status": r3.status_code, "body": r3.json()}
            elif platform == "INSTAGRAM":
                r = _requests.get(
                    f"{_META_API}/{mid}",
                    params={"fields": "id,like_count,comments_count", "access_token": token},
                    timeout=10,
                )
                entry["reactions_raw"] = {"status": r.status_code, "body": r.json()}
        except Exception as e:
            entry["error"] = str(e)
        result["meta_responses"].append(entry)
    return result


@app.get("/api/debug/openai")
def debug_openai():
    import json as _json
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        return {"error": "OPENAI_API_KEY no configurado"}
    prop = list(properties_db.values())[0]
    type_map = {"venta": "Venta", "alquiler": "Alquiler", "anticretico": "Anticrético"}
    type_label = type_map[prop.type]
    price_str = f"USD {prop.price:,.0f}" if prop.currency == "USD" else f"BOB {prop.price:,.0f}"
    doc_note = "Documentos saneados" if prop.status_documents == "saneado" else "Consultar documentacion"
    prompt = f"""Devuelve SOLO un JSON con estas claves: title, short_description, long_description, hashtags (lista), cta, reel_script.
PROPIEDAD: {prop.title}, {type_label}, {price_str}, {doc_note}. Descripcion: {prop.description}"""
    try:
        oai = OpenAI(api_key=api_key)
        r = oai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Responde solo con JSON valido, sin markdown."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=800,
        )
        raw = r.choices[0].message.content.strip()
        try:
            data = _json.loads(raw)
            return {"status": "ok", "key_prefix": api_key[:10], "parsed": True, "title": data.get("title")}
        except Exception as parse_err:
            return {"status": "parse_error", "detail": str(parse_err), "raw_preview": raw[:300]}
    except Exception as e:
        return {"status": "api_error", "detail": str(e)}


# ─── Marketing Endpoints ──────────────────────────────────────

@app.post("/api/properties/{property_id}/generate-marketing")
def generate_marketing(property_id: str):
    if property_id not in properties_db:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    prop = properties_db[property_id]
    content = generate_marketing_content(prop)
    cid = f"mc{uuid.uuid4().hex[:8]}"
    campaign = {"id": cid, "property_id": property_id, "content": content.model_dump()}
    marketing_campaigns_db[cid] = campaign
    return campaign


@app.post("/api/properties/{property_id}/publish")
def publish_property(property_id: str, req: PublishContentRequest):
    if property_id not in properties_db:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")

    full_text = (
        f"{req.content.long_description}\n\n"
        f"{' '.join(req.content.hashtags)}\n\n"
        f"{req.content.cta}"
    )

    posts = []
    for platform in req.platforms:
        pid = f"sp{uuid.uuid4().hex[:8]}"
        meta_post_id: Optional[str] = None

        if platform == "FACEBOOK":
            meta_post_id = _post_to_facebook(full_text)
        elif platform == "INSTAGRAM":
            meta_post_id = _post_to_instagram(full_text)

        post = {
            "id": pid,
            "property_id": property_id,
            "platform": platform,
            "status": "published" if meta_post_id else "simulated",
            "content_title": req.content.title,
            "meta_post_id": meta_post_id,
            "demo_views": 1,
            "demo_clicks": 1,
            "demo_likes": 1,
            "demo_comments": 1,
        }
        social_posts_db[pid] = post
        posts.append(post)

    _save_social_posts()
    return {"published": len(posts), "posts": posts}


@app.get("/api/properties/{property_id}/analytics")
def get_property_analytics(property_id: str):
    if property_id not in properties_db:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    posts = [p for p in social_posts_db.values() if p["property_id"] == property_id]
    return _fetch_real_insights(posts, property_id) or generate_mock_analytics(property_id, posts)


@app.get("/api/owners/properties/{property_id}/analytics")
def get_owner_property_analytics(property_id: str, owner_id: str = ""):
    if property_id not in properties_db:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    prop = properties_db[property_id]
    if owner_id and prop.owner_id != owner_id:
        raise HTTPException(status_code=403, detail="No autorizado para ver esta propiedad")
    posts = [p for p in social_posts_db.values() if p["property_id"] == property_id]
    return _fetch_real_insights(posts, property_id) or generate_mock_analytics(property_id, posts)


# ─── Vercel Serverless Handler ────────────────────────────────
handler = Mangum(app)
