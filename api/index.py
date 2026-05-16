from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Literal
from mangum import Mangum
import uuid

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
    corretaje_contract_filename: Optional[str] = None
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
    offer_price: float = 0
    payment_method: Literal["efectivo", "credito_bancario", "fondos_propios"] = "efectivo"
    reservation_amount: Optional[float] = None
    compromiso_contract_filename: Optional[str] = None
    is_agent_signed_crm2_s2: bool = False
    is_buyer_signed_crm2_s2: bool = False
    final_contract_filename: Optional[str] = None
    notary_office_number: Optional[str] = None
    is_agent_signed_crm2_s3: bool = False
    is_buyer_signed_crm2_s3: bool = False
    is_owner_signed_crm2_s3: bool = False

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
    corretaje_contract_filename: Optional[str] = None
    is_agent_signed_crm1: Optional[bool] = None
    is_client_signed_crm1: Optional[bool] = None
    published_to_map: Optional[bool] = None

class CreateLeadRequest(BaseModel):
    property_id: str
    buyer_id: str
    buyer_name: str
    buyer_phone: str
    buyer_email: str
    offer_price: float
    payment_method: Literal["efectivo", "credito_bancario", "fondos_propios"]

class UpdateLeadStageRequest(BaseModel):
    stage_crm2: Optional[int] = None
    reservation_amount: Optional[float] = None
    compromiso_contract_filename: Optional[str] = None
    is_agent_signed_crm2_s2: Optional[bool] = None
    is_buyer_signed_crm2_s2: Optional[bool] = None
    final_contract_filename: Optional[str] = None
    notary_office_number: Optional[str] = None
    is_agent_signed_crm2_s3: Optional[bool] = None
    is_buyer_signed_crm2_s3: Optional[bool] = None
    is_owner_signed_crm2_s3: Optional[bool] = None

class AnalyzeDocumentRequest(BaseModel):
    filename: str
    context: Literal["corretaje", "compromiso", "final"]
    transaction_type: Literal["venta", "alquiler", "anticretico"] = "venta"

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

leads_db: dict[str, LeadCRM2] = {}


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
        offer_price=req.offer_price,
        payment_method=req.payment_method,
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

    # Auto-archive trigger: when CRM2 reaches stage 4
    if lead.stage_crm2 == 4:
        prop_id = lead.property_id
        if prop_id in properties_db:
            prop = properties_db[prop_id]
            prop.stage_crm1 = 5
            prop.published_to_map = False
            properties_db[prop_id] = prop

    leads_db[lead_id] = lead
    return lead.model_dump()


@app.post("/api/ai/analyze-document")
def analyze_document(req: AnalyzeDocumentRequest):
    """Simulated AI document analysis. Returns pre-scripted results based on context and transaction type."""

    if req.transaction_type == "anticretico":
        clauses = [
            {
                "text": "CLÁUSULA SÉPTIMA – DEVOLUCIÓN DEL CAPITAL ANTICRÉTICO: El propietario se compromete a restituir la totalidad del capital anticrético entregado por el inquilino, en la misma moneda pactada (USD), al momento de la finalización del plazo contractual y la entrega física del inmueble libre de deudas, gravámenes y ocupantes.",
                "type": "safe",
                "tooltip": "Cláusula Estándar Segura que protege tus fondos. Cumple con el Art. 1227 del Código Civil Boliviano."
            },
            {
                "text": "CLÁUSULA DÉCIMA – CONDICIÓN DE DEVOLUCIÓN: El propietario no devolverá el capital anticrético al vencer el plazo si no ha consolidado un nuevo inquilino sustituto para el inmueble, quedando el capital retenido como garantía hasta que se concrete dicha sustitución sin plazo definido.",
                "type": "dangerous",
                "tooltip": "Alerta Legal: Cláusula abusiva que vulnera el Art. 1227 del Código Civil Boliviano. El dinero de la garantía anticrética debe devolverse de manera mandatoria al vencer el plazo forzoso, independientemente de que exista o no un nuevo inquilino."
            },
            {
                "text": "CLÁUSULA TERCERA – PLAZO Y VIGENCIA: El presente contrato de anticrético tiene una vigencia de veinticuatro (24) meses calendario computables a partir de la fecha de suscripción del presente documento, pudiendo ser renovado por acuerdo mutuo de las partes con treinta (30) días de anticipación.",
                "type": "safe",
                "tooltip": "Cláusula estándar con plazo definido y condiciones de renovación claras."
            },
        ]
        score = 72
    elif req.context == "corretaje":
        clauses = [
            {
                "text": "CLÁUSULA PRIMERA – OBJETO DEL CONTRATO: Por el presente contrato de corretaje inmobiliario, el PROPIETARIO otorga al AGENTE INMOBILIARIO la facultad exclusiva para intermediar en la operación de venta/alquiler del inmueble descrito en la cláusula segunda, conforme a las condiciones económicas y plazos establecidos en el presente documento.",
                "type": "safe",
                "tooltip": "Cláusula estándar que define el alcance del mandato de intermediación."
            },
            {
                "text": "CLÁUSULA QUINTA – COMISIÓN DEL AGENTE: La comisión pactada será del porcentaje acordado sobre el precio final de la transacción, pagadera al momento de la firma del contrato definitivo de transferencia. En caso de desistimiento del propietario, la comisión será igualmente exigible.",
                "type": "safe",
                "tooltip": "Cláusula válida que protege la labor del agente inmobiliario conforme al Código de Comercio."
            },
            {
                "text": "CLÁUSULA OCTAVA – EXCLUSIVIDAD IRREVOCABLE: El propietario no podrá rescindir el presente contrato bajo ninguna circunstancia durante los primeros doce (12) meses, incluso si encuentra un comprador por cuenta propia, debiendo pagar la comisión íntegra al agente.",
                "type": "dangerous",
                "tooltip": "Alerta Legal: Cláusula de exclusividad excesiva. El Código de Comercio permite la rescisión con preaviso razonable. Una cláusula irrevocable por 12 meses puede ser considerada abusiva."
            },
        ]
        score = 85
    elif req.context == "compromiso":
        clauses = [
            {
                "text": "CLÁUSULA SEGUNDA – RESERVA Y ARRAS: El COMPRADOR entrega en este acto la suma pactada como arras confirmatorias, la cual será imputada al precio total de la operación. En caso de desistimiento del comprador, dicha suma quedará en poder del vendedor como indemnización compensatoria.",
                "type": "safe",
                "tooltip": "Cláusula estándar de arras confirmatorias conforme al Art. 537 del Código Civil."
            },
            {
                "text": "CLÁUSULA CUARTA – PLAZO PARA ESCRITURACIÓN: Las partes se comprometen a suscribir la escritura pública de transferencia en un plazo no mayor a sesenta (60) días calendario a partir de la firma del presente documento.",
                "type": "safe",
                "tooltip": "Plazo razonable y claro para la formalización de la compraventa."
            },
            {
                "text": "CLÁUSULA SEXTA – PENALIDAD: En caso de incumplimiento por parte del VENDEDOR, éste deberá devolver el doble de las arras recibidas conforme a ley.",
                "type": "safe",
                "tooltip": "Penalidad equilibrada que protege a ambas partes según la normativa civil boliviana."
            },
        ]
        score = 95
    else:  # final
        clauses = [
            {
                "text": "CLÁUSULA PRIMERA – TRANSFERENCIA DE DOMINIO: Por el presente contrato, el VENDEDOR transfiere a favor del COMPRADOR la propiedad y dominio pleno del inmueble objeto del presente instrumento, libre de todo gravamen, hipoteca, embargo, anotación preventiva o limitación alguna.",
                "type": "safe",
                "tooltip": "Cláusula fundamental de transferencia de dominio. Verifica que coincida con el Folio Real actualizado."
            },
            {
                "text": "CLÁUSULA TERCERA – PRECIO Y FORMA DE PAGO: El precio total de la transferencia es el monto acordado, pagadero en la forma y plazos convenidos entre las partes, quedando constancia del pago total con la firma de este instrumento.",
                "type": "safe",
                "tooltip": "Cláusula estándar. Asegúrate de que los montos coincidan con lo pactado en el contrato de compromiso."
            },
            {
                "text": "CLÁUSULA QUINTA – SANEAMIENTO Y EVICCIÓN: El VENDEDOR garantiza el saneamiento de la propiedad transferida y responde por evicción conforme a los artículos 614 a 623 del Código Civil Boliviano.",
                "type": "safe",
                "tooltip": "Protección legal completa para el comprador frente a defectos de titularidad."
            },
        ]
        score = 91

    return {
        "filename": req.filename,
        "score": score,
        "clauses": clauses,
        "summary": f"Análisis completado. Score de seguridad: {score}%. Se encontraron {len([c for c in clauses if c['type'] == 'dangerous'])} cláusula(s) de riesgo.",
    }


# ─── Vercel Serverless Handler ────────────────────────────────
handler = Mangum(app)
