from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ChatRequest(BaseModel):
    query: str

class SourceItem(BaseModel):
    item_name: str
    source: str

class ChatItemDetail(BaseModel):
    item_id: int
    item_name: str
    category: str
    price: float
    profit: float
    profit_margin: float
    units_sold: float
    prep_time: float
    optimal_price: Optional[float] = None
    price_elasticity: Optional[float] = None
    pricing_strategy: Optional[str] = None
    monthly_profit_lift: Optional[float] = None
    quadrant: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    items: List[ChatItemDetail] = []
    sources: List[SourceItem] = []
    latency: float

class SimulationRequest(BaseModel):
    item_id: int
    new_price: float

class SimulationResponse(BaseModel):
    item_id: int
    item_name: str
    category: str
    current_price: float
    simulated_price: float
    cogs: float
    current_units: float
    simulated_units: float
    current_revenue: float
    simulated_revenue: float
    current_profit: float
    simulated_profit: float
    profit_delta: float
    units_delta_pct: float
    revenue_delta_pct: float
    profit_delta_pct: float
    elasticity: float

class OverviewMetrics(BaseModel):
    total_items: int
    total_categories: int
    avg_price: float
    total_revenue: float
    total_profit: float
    avg_profit_margin: float
    total_monthly_profit_lift: float
    high_prep_bottlenecks_count: int
    low_margin_high_sales_count: int
    categories: List[str]

class MenuItem(BaseModel):
    item_id: int
    item_name: str
    category: str
    price: float
    prep_time_minutes: float
    units_sold_last_month: float
    profit_margin_percent: float
    cogs: float
    revenue: float
    profit: float
    menu_class: str
    quadrant: str  # 'Stars', 'Plowhorses', 'Puzzles', 'Dogs'
    price_elasticity: Optional[float] = None
    optimal_price: Optional[float] = None
    monthly_profit_lift: Optional[float] = None
    pricing_strategy: Optional[str] = None
    pricing_recommendation: Optional[str] = None
    sales_trend_label: Optional[str] = None
    price_volatility_pct: Optional[float] = None
