# Note: Tool definitions for the LLM, plus the dispatcher that actually calls
# the FastAPI endpoints. Each tool has a name, a description, and typed JSON
# Schema parameters — this is what lets the model decide which API call fits
# the user's request.

import json
import os

import httpx

API_BASE_URL = os.getenv("INVENTORY_API_URL", "http://localhost:8000")

# Note: Tool schemas in OpenAI function-calling format. They mirror the
# inventory REST endpoints one-to-one.
TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "get_inventory",
            "description": "List all products in inventory with their id, "
                           "name, quantity, and unit.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "add_product",
            "description": "Add a brand new product to the inventory. Do not "
                           "use this for restocking an existing product.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Product name"},
                    "quantity": {"type": "integer", "minimum": 0,
                                 "description": "Starting stock"},
                    "unit": {"type": "string",
                             "description": "Unit of measure, e.g. bag, carton, bottle"},
                },
                "required": ["name", "quantity", "unit"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "adjust_stock",
            "description": "Adjust the stock of an existing product. Use a "
                           "positive delta for incoming stock (received a "
                           "delivery) and a negative delta for outgoing stock "
                           "(sold or used).",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_id": {"type": "integer",
                                   "description": "The product's id from get_inventory"},
                    "delta": {"type": "integer",
                              "description": "Positive = incoming, negative = outgoing"},
                },
                "required": ["product_id", "delta"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_product",
            "description": "Delete an existing product from the inventory. "
                           "Use get_inventory first if you need to identify "
                           "the product id. Only use this when the user "
                           "clearly asks to remove/delete a product record.",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_id": {"type": "integer",
                                   "description": "The product's id from get_inventory"},
                },
                "required": ["product_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_low_stock",
            "description": "List products whose quantity is below the "
                           "low-stock threshold (default 10).",
            "parameters": {
                "type": "object",
                "properties": {
                    "threshold": {"type": "integer", "minimum": 0,
                                  "description": "Optional custom threshold"},
                },
                "required": [],
            },
        },
    },
]


# Note: One small function per tool. Each makes an HTTP call to the API and
# returns the JSON response as a string for the LLM to read.

def get_inventory() -> str:
    response = httpx.get(f"{API_BASE_URL}/inventory")
    response.raise_for_status()
    return json.dumps(response.json())


def add_product(name: str, quantity: int, unit: str) -> str:
    response = httpx.post(
        f"{API_BASE_URL}/inventory",
        json={"name": name, "quantity": quantity, "unit": unit},
    )
    response.raise_for_status()
    return json.dumps(response.json())


def adjust_stock(product_id: int, delta: int) -> str:
    response = httpx.patch(
        f"{API_BASE_URL}/inventory/{product_id}",
        json={"delta": delta},
    )
    response.raise_for_status()
    return json.dumps(response.json())


def delete_product(product_id: int) -> str:
    response = httpx.delete(f"{API_BASE_URL}/inventory/{product_id}")
    response.raise_for_status()
    return json.dumps(response.json())


def get_low_stock(threshold: int | None = None) -> str:
    params = {"threshold": threshold} if threshold is not None else {}
    response = httpx.get(f"{API_BASE_URL}/inventory/alerts", params=params)
    response.raise_for_status()
    return json.dumps(response.json())


TOOL_REGISTRY = {
    "get_inventory": get_inventory,
    "add_product": add_product,
    "adjust_stock": adjust_stock,
    "delete_product": delete_product,
    "get_low_stock": get_low_stock,
}


def run_tool(name: str, arguments: dict) -> str:
    # Note: Errors are returned as strings instead of raised, so the LLM sees
    # what went wrong (e.g. "duplicate name") and can recover in the next
    # loop iteration instead of crashing the agent.
    if name not in TOOL_REGISTRY:
        return f"Error: unknown tool '{name}'."
    try:
        return TOOL_REGISTRY[name](**arguments)
    except httpx.HTTPStatusError as exc:
        detail = exc.response.json().get("detail", exc.response.text)
        return f"API error ({exc.response.status_code}): {detail}"
    except httpx.ConnectError:
        return ("Error: the inventory API is not running. "
                "Start it with: uvicorn api.app:app --reload")
    except Exception as exc:
        return f"Error running tool '{name}': {exc}"
