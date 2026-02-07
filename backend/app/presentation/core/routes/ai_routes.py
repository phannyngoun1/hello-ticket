"""
AI routes: form suggestions, text improvement, marker detection.
Requires OPENAI_API_KEY in environment for LLM/Vision features.
"""
import base64
import json
import os
from typing import Any, Dict, List, Literal, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, Field

from app.presentation.core.dependencies.auth_dependencies import (
    get_current_active_user_from_request,
)
from app.domain.shared.authenticated_user import AuthenticatedUser

router = APIRouter(prefix="/ai", tags=["ai"])

# Form types and their field hints for AI (field name -> short label/description)
FORM_SCHEMAS: Dict[str, Dict[str, str]] = {
    "customer": {
        "name": "Full name",
        "email": "Email address",
        "phone": "Phone number",
        "business_name": "Business or company name",
        "notes": "Notes or comments",
    },
    "venue": {
        "name": "Venue name",
        "description": "Venue description",
        "venue_type": "Type of venue",
        "street_address": "Street address",
        "city": "City",
        "state_province": "State or province",
        "postal_code": "Postal code",
        "country": "Country",
        "phone": "Phone",
        "email": "Email",
        "website": "Website URL",
        "parking_info": "Parking information",
        "accessibility": "Accessibility info",
        "amenities": "Comma-separated amenities",
        "opening_hours": "Opening hours",
    },
    "event": {
        "title": "Event title",
        "start_dt": "Start date and time (ISO format)",
        "duration_minutes": "Duration in minutes",
        "venue_id": "Venue ID",
        "layout_id": "Layout ID",
        "status": "Event status",
        "configuration_type": "Seat setup or ticket import",
    },
    "organizer": {
        "name": "Organizer name",
        "email": "Email",
        "phone": "Phone",
        "website": "Website",
        "description": "Description",
        "street_address": "Street address",
        "city": "City",
        "state_province": "State or province",
        "postal_code": "Postal code",
        "country": "Country",
    },
    "user": {
        "firstName": "First name",
        "lastName": "Last name",
        "username": "Username",
        "email": "Email address",
    },
    "group": {
        "name": "Group name",
        "description": "Group description",
    },
}


def get_openai_api_key() -> Optional[str]:
    """Return OPENAI_API_KEY from environment (no default)."""
    return os.getenv("OPENAI_API_KEY") or None


def _require_openai() -> str:
    key = get_openai_api_key()
    if not key or not key.strip():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI features are not configured. Set OPENAI_API_KEY in environment.",
        )
    return key


def _get_openai_client():
    """Return OpenAI client. Raises 503 if openai package is not installed."""
    _require_openai()
    try:
        from openai import OpenAI
    except ImportError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI features are not available. Install the openai package in your backend environment: pip install openai",
        ) from e
    return OpenAI(api_key=get_openai_api_key())


class AIHealthResponse(BaseModel):
    """AI module health / configuration status."""

    status: str = Field(description="Overall status")
    ai_configured: bool = Field(description="Whether LLM API key is set")
    message: str = Field(description="Human-readable message")


class ImproveTextRequest(BaseModel):
    """Request body for improve-text."""

    text: str = Field(..., description="Text to improve")
    mode: Literal["grammar", "clarity", "tone", "default"] = Field(
        default="default",
        description="Improvement mode",
    )


class ImproveTextResponse(BaseModel):
    """Response for improve-text."""

    improvedText: str = Field(..., description="Improved text")


class FormSuggestRequest(BaseModel):
    """Request body for form-suggest."""

    formType: str = Field(
        ...,
        description="Form type: customer, venue, event, organizer, user, group",
    )
    currentValues: Dict[str, str] = Field(
        default_factory=dict,
        description="Current form values (field name -> value)",
    )
    fieldHints: Optional[Dict[str, str]] = Field(
        default=None,
        description="Optional hints per field for context",
    )


class FormSuggestResponse(BaseModel):
    """Response for form-suggest."""

    suggestedValues: Dict[str, str] = Field(
        default_factory=dict,
        description="Suggested values (field name -> value)",
    )


@router.get("/health", response_model=AIHealthResponse)
async def ai_health():
    """
    Check AI module configuration.
    Does not expose the API key; only reports whether it is set.
    """
    key = get_openai_api_key()
    configured = bool(key and key.strip())
    return AIHealthResponse(
        status="ok",
        ai_configured=configured,
        message="AI module is configured and ready"
        if configured
        else "Set OPENAI_API_KEY to enable AI features",
    )


@router.post("/improve-text", response_model=ImproveTextResponse)
async def improve_text(
    body: ImproveTextRequest,
    current_user: AuthenticatedUser = Depends(get_current_active_user_from_request),
):
    """Improve the given text (grammar, clarity, or tone)."""
    try:
        client = _get_openai_client()
        mode_instruction = {
            "grammar": "Fix grammar and spelling only. Keep the same meaning and tone.",
            "clarity": "Make the text clearer and more readable. Keep it concise.",
            "tone": "Adjust the tone to be professional and polite. Keep the same meaning.",
            "default": "Improve grammar, clarity, and flow. Keep the same meaning and length similar.",
        }.get(body.mode, "Improve grammar, clarity, and flow. Keep the same meaning.")
        prompt = f"{mode_instruction}\n\nText:\n{body.text}"
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful editor. Return only the improved text, no explanation."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=2000,
        )
        content = response.choices[0].message.content
        improved = (content or "").strip() or body.text
        return ImproveTextResponse(improvedText=improved)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service error: {str(e)}",
        ) from e


@router.post("/form-suggest", response_model=FormSuggestResponse)
async def form_suggest(
    body: FormSuggestRequest,
    current_user: AuthenticatedUser = Depends(get_current_active_user_from_request),
):
    """Suggest form field values based on form type and current values."""
    form_type = (body.formType or "").strip().lower()
    if form_type not in FORM_SCHEMAS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown formType. Allowed: {list(FORM_SCHEMAS.keys())}",
        )
    schema = FORM_SCHEMAS[form_type]
    try:
        client = _get_openai_client()
        filled = {k: v for k, v in (body.currentValues or {}).items() if v}
        hints = body.fieldHints or {}
        context = "\n".join(
            [f"- {schema.get(k, k)}: {v}" for k, v in filled.items()]
            + [f"- Hint for {schema.get(k, k)}: {v}" for k, v in hints.items() if v]
        ) or "No context yet."
        prompt = f"""Form type: {form_type}.
Current values or hints:
{context}

Suggest values for the form fields. Return a JSON object with field names as keys and suggested string values.
Only include fields you can reasonably suggest. Use empty string for optional fields you leave blank.
Field names must match exactly: {list(schema.keys())}.
Return only valid JSON, no markdown or explanation."""
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that suggests form values. Reply with a single JSON object only."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=1500,
        )
        content = (response.choices[0].message.content or "").strip()
        # Strip markdown code block if present
        if content.startswith("```"):
            lines = content.split("\n")
            content = "\n".join(
                line for line in lines
                if not line.strip().startswith("```")
            )
        try:
            suggested: Dict[str, Any] = json.loads(content)
        except json.JSONDecodeError:
            suggested = {}
        # Sanitize: only string values and only known keys
        result = {}
        for key in schema:
            if key in suggested and suggested[key] is not None:
                result[key] = str(suggested[key]).strip()
        return FormSuggestResponse(suggestedValues=result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service error: {str(e)}",
        ) from e


# --- Detect markers (section regions from floor plan image) ---


class SuggestedShape(BaseModel):
    """Suggested shape for a section (normalized 0-100)."""

    type: Literal["rectangle", "ellipse", "polygon"] = "rectangle"
    x: float = Field(description="Center or reference x (0-100)")
    y: float = Field(description="Center or reference y (0-100)")
    width: float = Field(description="Width as percentage of image (0-100)")
    height: float = Field(description="Height as percentage of image (0-100)")
    points: Optional[List[float]] = Field(default=None, description="For polygon: flat [x,y,...] as 0-100")


class SuggestedSection(BaseModel):
    """Suggested section from vision."""

    name: str = Field(description="Section name (e.g. Section A)")
    shape: SuggestedShape = Field(description="Shape and position")


class DetectMarkersResponse(BaseModel):
    """Response for detect-markers."""

    sections: List[SuggestedSection] = Field(default_factory=list, description="Suggested section regions")


class SuggestedSeat(BaseModel):
    """Suggested seat position from vision (normalized 0-100)."""

    row: str = Field(default="1", description="Row label (e.g. A, 1)")
    seat_number: str = Field(description="Seat number or label (e.g. 1, A1)")
    x: float = Field(description="Center x as percentage of image (0-100)")
    y: float = Field(description="Center y as percentage of image (0-100)")
    width: float = Field(default=2.0, description="Width as percentage (0-100)")
    height: float = Field(default=2.0, description="Height as percentage (0-100)")


class DetectSeatsResponse(BaseModel):
    """Response for detect-seats."""

    seats: List[SuggestedSeat] = Field(default_factory=list, description="Suggested seat positions")


@router.post("/detect-markers", response_model=DetectMarkersResponse)
async def detect_markers(
    file: UploadFile = File(..., description="Floor plan image (PNG/JPEG)"),
    current_user: AuthenticatedUser = Depends(get_current_active_user_from_request),
):
    """Analyze a floor plan image and suggest section regions (rectangles) for the seat designer."""
    # OpenAI vision API supports only: png, jpeg, gif, webp (no SVG)
    ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"}
    content_type = (file.content_type or "").strip().lower()
    if not content_type or not content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image (e.g. image/png, image/jpeg)",
        )
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image format not supported for AI detection. Use PNG, JPEG, GIF, or WebP (SVG is not supported).",
        )
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image size must be under 10MB",
        )
    try:
        client = _get_openai_client()
        b64 = base64.standard_b64encode(content).decode("ascii")
        mime = file.content_type or "image/png"
        data_uri = f"data:{mime};base64,{b64}"

        prompt = """Look at this venue floor plan image. Identify distinct seating sections (e.g. orchestra, balcony, section A, B, C).
For each section, give a rectangle that roughly bounds that section. Use normalized coordinates:
- x, y = center of the rectangle as percentage of image width/height (0-100).
- width, height = rectangle size as percentage of image width/height (0-100).
Return a JSON object with a single key "sections" which is an array of objects. Each object has:
- "name": string (section name, e.g. "Section A", "Orchestra")
- "shape": { "type": "rectangle", "x": number, "y": number, "width": number, "height": number }
Return only valid JSON, no markdown or explanation."""

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": data_uri},
                        },
                    ],
                }
            ],
            max_tokens=2000,
        )
        raw = (response.choices[0].message.content or "").strip()
        if raw.startswith("```"):
            lines = raw.split("\n")
            raw = "\n".join(line for line in lines if not line.strip().startswith("```"))
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            return DetectMarkersResponse(sections=[])
        sections_in = data.get("sections") or []
        sections_out: List[SuggestedSection] = []
        for s in sections_in:
            if not isinstance(s, dict):
                continue
            name = s.get("name") or "Section"
            shape_in = s.get("shape") or {}
            shape_type = shape_in.get("type") or "rectangle"
            x = float(shape_in.get("x", 50))
            y = float(shape_in.get("y", 50))
            width = float(shape_in.get("width", 10))
            height = float(shape_in.get("height", 10))
            shape = SuggestedShape(type=shape_type, x=x, y=y, width=width, height=height)
            sections_out.append(SuggestedSection(name=name, shape=shape))
        return DetectMarkersResponse(sections=sections_out)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service error: {str(e)}",
        ) from e


ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"}


@router.post("/detect-seats", response_model=DetectSeatsResponse)
async def detect_seats(
    file: UploadFile = File(..., description="Floor plan or section image (PNG/JPEG)"),
    section_name: Optional[str] = Form(None, description="Optional section name for context"),
    current_user: AuthenticatedUser = Depends(get_current_active_user_from_request),
):
    """Analyze an image and suggest individual seat positions (for seat-level design)."""
    content_type = (file.content_type or "").strip().lower()
    if not content_type or not content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image (e.g. image/png, image/jpeg)",
        )
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image format not supported for AI detection. Use PNG, JPEG, GIF, or WebP (SVG is not supported).",
        )
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image size must be under 10MB",
        )
    try:
        client = _get_openai_client()
        b64 = base64.standard_b64encode(content).decode("ascii")
        mime = file.content_type or "image/png"
        data_uri = f"data:{mime};base64,{b64}"

        section_context = (
            f" This image shows the seating area for section: {section_name}."
            if section_name
            else " This is a floor plan or section image showing seating."
        )
        prompt = f"""Look at this venue floor plan or section image.{section_context}
Identify individual seat positions (chairs, seats). For each seat, give:
- row: string (row label, e.g. A, 1, Row 1)
- seat_number: string (seat number or label, e.g. 1, 2, A1)
- x, y: center of the seat as percentage of image width/height (0-100)
- width, height: seat size as percentage of image (0-100), typically small (e.g. 1-4)

Return a JSON object with a single key "seats" which is an array of objects. Each object has:
- "row": string
- "seat_number": string
- "x": number
- "y": number
- "width": number (optional, default 2)
- "height": number (optional, default 2)
Return only valid JSON, no markdown or explanation."""

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": data_uri}},
                    ],
                }
            ],
            max_tokens=4000,
        )
        raw = (response.choices[0].message.content or "").strip()
        if raw.startswith("```"):
            lines = raw.split("\n")
            raw = "\n".join(line for line in lines if not line.strip().startswith("```"))
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            return DetectSeatsResponse(seats=[])
        seats_in = data.get("seats") or []
        seats_out: List[SuggestedSeat] = []
        for s in seats_in:
            if not isinstance(s, dict):
                continue
            row = str(s.get("row") or "1").strip() or "1"
            seat_number = str(s.get("seat_number") or s.get("seatNumber") or "1").strip() or "1"
            x = float(s.get("x", 50))
            y = float(s.get("y", 50))
            width = float(s.get("width", 2))
            height = float(s.get("height", 2))
            seats_out.append(
                SuggestedSeat(row=row, seat_number=seat_number, x=x, y=y, width=width, height=height)
            )
        return DetectSeatsResponse(seats=seats_out)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service error: {str(e)}",
        ) from e
