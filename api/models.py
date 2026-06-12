# Note: Pydantic models validate every request body before our route code
# runs. Bad input (missing fields, wrong types, negative quantities) is
# rejected automatically with a 422 and a descriptive message.

from pydantic import BaseModel, Field, field_validator


class Product(BaseModel):
    id: int
    name: str
    quantity: int
    unit: str


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, description="Product name, must be unique")
    quantity: int = Field(ge=0, description="Starting stock, must be zero or more")
    unit: str = Field(min_length=1, description="Unit of measure, e.g. bag, carton")

    # Note: Strip surrounding whitespace so "  " can't sneak past min_length.
    @field_validator("name", "unit")
    @classmethod
    def strip_and_require_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        return value


class StockAdjust(BaseModel):
    delta: int = Field(description="Positive = incoming stock, negative = outgoing")

    @field_validator("delta")
    @classmethod
    def reject_zero(cls, value: int) -> int:
        if value == 0:
            raise ValueError("delta must not be zero")
        return value


class AlertsResponse(BaseModel):
    threshold: int
    products: list[Product]


# Note: Models for the optional /agent/chat extension. `history` is the raw
# OpenAI-style message list; the frontend echoes it back each turn so the API
# stays stateless.
class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    history: list[dict] | None = None


class ToolTraceEvent(BaseModel):
    tool: str
    arguments: dict
    result: str


class ChatResponse(BaseModel):
    reply: str
    tool_trace: list[ToolTraceEvent]
    history: list[dict]
