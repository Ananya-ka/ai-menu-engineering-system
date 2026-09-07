import os
import sys
import re
import time
import sqlite3
import numpy as np
import pandas as pd
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Ensure workspace root is in sys.path
WORKSPACE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if WORKSPACE_ROOT not in sys.path:
    sys.path.insert(0, WORKSPACE_ROOT)

load_dotenv(override=True)

from backend.schemas import (
    ChatRequest,
    ChatResponse,
    SimulationRequest,
    SimulationResponse,
    OverviewMetrics,
    MenuItem
)
from config import LOW_MARGIN_THRESHOLD, LONG_PREP_THRESHOLD, TOP_K

app = FastAPI(
    title="AI Menu Engineering & Pricing Intelligence API",
    description="Backend services for Menu Analytics, Elasticity Regression, and RAG Insights",
    version="1.0.0"
)

# Enable CORS for React frontend (default Vite port 5173 and 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_merged_data() -> pd.DataFrame:
    menu_path = os.path.join(WORKSPACE_ROOT, "data/processed/menu_metrics.csv")
    pricing_path = os.path.join(WORKSPACE_ROOT, "data/processed/pricing_metrics.csv")
    
    if not os.path.exists(menu_path) or not os.path.exists(pricing_path):
        raise HTTPException(status_code=500, detail="Data files not found. Run ingestion pipelines first.")
        
    df_menu = pd.read_csv(menu_path)
    df_pricing = pd.read_csv(pricing_path)
    
    # Clean up column names
    if "COGS" in df_menu.columns:
        df_menu["cogs"] = df_menu["COGS"]
        
    df_merged = pd.merge(df_menu, df_pricing, on="item_id", suffixes=("", "_pr"))
    
    # Calculate BCG Matrix Quadrant
    # High Popularity threshold = 60th percentile of units sold
    # High Profitability threshold = median profit
    pop_thresh = df_merged["units_sold_last_month"].quantile(0.6)
    prof_thresh = df_merged["profit"].median()
    
    def assign_quadrant(row):
        high_pop = row["units_sold_last_month"] >= pop_thresh
        high_prof = row["profit"] >= prof_thresh
        if high_pop and high_prof:
            return "Stars"
        elif high_pop and not high_prof:
            return "Plowhorses"
        elif not high_pop and high_prof:
            return "Puzzles"
        else:
            return "Dogs"
            
    df_merged["quadrant"] = df_merged.apply(assign_quadrant, axis=1)
    return df_merged

@app.get("/api/health")
def health_check():
    has_openai = bool(os.environ.get("OPENAI_API_KEY", "").strip())
    return {
        "status": "healthy",
        "openai_configured": has_openai,
        "config": {
            "low_margin_threshold": LOW_MARGIN_THRESHOLD,
            "long_prep_threshold": LONG_PREP_THRESHOLD,
            "top_k": TOP_K
        }
    }

@app.get("/api/overview", response_model=OverviewMetrics)
def get_overview():
    df = get_merged_data()
    
    high_prep_count = int((df["prep_time_minutes"] >= LONG_PREP_THRESHOLD).sum())
    pop_thresh = df["units_sold_last_month"].quantile(0.6)
    low_margin_count = int(
        ((df["units_sold_last_month"] >= pop_thresh) & (df["profit_margin_percent"] < LOW_MARGIN_THRESHOLD)).sum()
    )
    
    return OverviewMetrics(
        total_items=len(df),
        total_categories=int(df["category"].nunique()),
        avg_price=float(df["price"].mean()),
        total_revenue=float(df["revenue"].sum()),
        total_profit=float(df["profit"].sum()),
        avg_profit_margin=float(df["profit_margin_percent"].mean()),
        total_monthly_profit_lift=float(df["monthly_profit_lift"].sum()) if "monthly_profit_lift" in df.columns else 0.0,
        high_prep_bottlenecks_count=high_prep_count,
        low_margin_high_sales_count=low_margin_count,
        categories=sorted(df["category"].unique().tolist())
    )

@app.get("/api/items", response_model=List[MenuItem])
def get_items(
    category: Optional[str] = None,
    quadrant: Optional[str] = None,
    search: Optional[str] = None
):
    df = get_merged_data()
    
    if category and category != "All":
        df = df[df["category"].str.lower() == category.lower()]
        
    if quadrant and quadrant != "All":
        df = df[df["quadrant"].str.lower() == quadrant.lower()]
        
    if search:
        s = search.lower()
        df = df[df["item_name"].str.lower().str.contains(s)]
        
    items = []
    for _, row in df.iterrows():
        items.append(
            MenuItem(
                item_id=int(row["item_id"]),
                item_name=str(row["item_name"]),
                category=str(row["category"]),
                price=float(row["price"]),
                prep_time_minutes=float(row["prep_time_minutes"]),
                units_sold_last_month=float(row["units_sold_last_month"]),
                profit_margin_percent=float(row["profit_margin_percent"]),
                cogs=float(row.get("cogs", row.get("COGS", 0))),
                revenue=float(row["revenue"]),
                profit=float(row["profit"]),
                menu_class=str(row.get("menu_class", "")),
                quadrant=str(row["quadrant"]),
                price_elasticity=float(row["price_elasticity"]) if pd.notnull(row.get("price_elasticity")) else None,
                optimal_price=float(row["optimal_price"]) if pd.notnull(row.get("optimal_price")) else None,
                monthly_profit_lift=float(row["monthly_profit_lift"]) if pd.notnull(row.get("monthly_profit_lift")) else None,
                pricing_strategy=str(row["pricing_strategy"]) if pd.notnull(row.get("pricing_strategy")) else None,
                pricing_recommendation=str(row["pricing_recommendation"]) if pd.notnull(row.get("pricing_recommendation")) else None,
                sales_trend_label=str(row["sales_trend_label"]) if pd.notnull(row.get("sales_trend_label")) else None,
                price_volatility_pct=float(row["price_volatility_pct"]) if pd.notnull(row.get("price_volatility_pct")) else None
            )
        )
    return items

@app.get("/api/matrix")
def get_matrix_data():
    df = get_merged_data()
    pop_thresh = float(df["units_sold_last_month"].quantile(0.6))
    prof_thresh = float(df["profit"].median())
    
    records = []
    for _, row in df.iterrows():
        records.append({
            "item_id": int(row["item_id"]),
            "item_name": str(row["item_name"]),
            "category": str(row["category"]),
            "units_sold": float(row["units_sold_last_month"]),
            "profit": float(row["profit"]),
            "profit_margin": float(row["profit_margin_percent"]),
            "price": float(row["price"]),
            "quadrant": str(row["quadrant"]),
            "prep_time": float(row["prep_time_minutes"]),
            "optimal_price": float(row.get("optimal_price", row["price"])),
            "monthly_profit_lift": float(row.get("monthly_profit_lift", 0))
        })
        
    return {
        "thresholds": {
            "popularity": pop_thresh,
            "profitability": prof_thresh
        },
        "items": records,
        "quadrant_counts": {
            "Stars": int((df["quadrant"] == "Stars").sum()),
            "Plowhorses": int((df["quadrant"] == "Plowhorses").sum()),
            "Puzzles": int((df["quadrant"] == "Puzzles").sum()),
            "Dogs": int((df["quadrant"] == "Dogs").sum())
        }
    }

@app.get("/api/items/{item_id}/history")
def get_item_history(item_id: int):
    df = get_merged_data()
    item_rows = df[df["item_id"] == item_id]
    if item_rows.empty:
        raise HTTPException(status_code=404, detail="Item not found")
        
    item = item_rows.iloc[0]
    db_path = os.path.join(WORKSPACE_ROOT, "pos.db")
    
    if not os.path.exists(db_path):
        raise HTTPException(status_code=500, detail="Database file pos.db not found")
        
    conn = sqlite3.connect(db_path)
    query = """
    SELECT week, price, units_sold, weekly_revenue, weekly_profit
    FROM historical_sales
    WHERE item_id = ?
    ORDER BY week ASC
    """
    df_hist = pd.read_sql(query, conn, params=(item_id,))
    conn.close()
    
    alpha = float(item["regression_intercept"])
    beta = float(item["regression_slope"])
    
    # Generate regression fitted line points
    min_p = float(df_hist["price"].min()) if not df_hist.empty else float(item["price"]) * 0.8
    max_p = float(df_hist["price"].max()) if not df_hist.empty else float(item["price"]) * 1.2
    
    price_grid = np.linspace(min_p, max_p, 30)
    fitted_demand = alpha + beta * price_grid
    
    regression_line = [
        {"price": round(float(p), 2), "fitted_demand": max(0.0, round(float(d), 2))}
        for p, d in zip(price_grid, fitted_demand)
    ]
    
    return {
        "item_id": item_id,
        "item_name": str(item["item_name"]),
        "category": str(item["category"]),
        "cogs": float(item.get("cogs", item.get("COGS", 0))),
        "current_price": float(item["price"]),
        "optimal_price": float(item["optimal_price"]),
        "price_elasticity": float(item["price_elasticity"]),
        "monthly_profit_lift": float(item["monthly_profit_lift"]),
        "pricing_strategy": str(item["pricing_strategy"]),
        "pricing_recommendation": str(item["pricing_recommendation"]),
        "price_volatility_pct": float(item["price_volatility_pct"]),
        "sales_trend_label": str(item["sales_trend_label"]),
        "regression": {
            "intercept": alpha,
            "slope": beta,
            "formula": f"Q = {alpha:.1f} - {abs(beta):.2f} * P"
        },
        "history": df_hist.to_dict(orient="records"),
        "regression_line": regression_line
    }

@app.post("/api/simulate", response_model=SimulationResponse)
def simulate_price(req: SimulationRequest):
    df = get_merged_data()
    item_rows = df[df["item_id"] == req.item_id]
    if item_rows.empty:
        raise HTTPException(status_code=404, detail="Item not found")
        
    item = item_rows.iloc[0]
    alpha = float(item["regression_intercept"])
    beta = float(item["regression_slope"])
    cogs = float(item.get("cogs", item.get("COGS", 0)))
    current_p = float(item["price"])
    
    # Current estimated weekly performance
    current_units = max(0.0, alpha + beta * current_p)
    current_rev = current_units * current_p
    current_prof = current_units * (current_p - cogs)
    
    # Simulated performance
    sim_p = req.new_price
    sim_units = max(0.0, alpha + beta * sim_p)
    sim_rev = sim_units * sim_p
    sim_prof = sim_units * (sim_p - cogs)
    
    profit_delta = sim_prof - current_prof
    units_delta_pct = ((sim_units - current_units) / current_units * 100) if current_units > 0 else 0.0
    revenue_delta_pct = ((sim_rev - current_rev) / current_rev * 100) if current_rev > 0 else 0.0
    profit_delta_pct = ((sim_prof - current_prof) / current_prof * 100) if current_prof > 0 else 0.0
    
    return SimulationResponse(
        item_id=req.item_id,
        item_name=str(item["item_name"]),
        category=str(item["category"]),
        current_price=round(current_p, 2),
        simulated_price=round(sim_p, 2),
        cogs=round(cogs, 2),
        current_units=round(current_units, 1),
        simulated_units=round(sim_units, 1),
        current_revenue=round(current_rev, 2),
        simulated_revenue=round(sim_rev, 2),
        current_profit=round(current_prof, 2),
        simulated_profit=round(sim_prof, 2),
        profit_delta=round(profit_delta, 2),
        units_delta_pct=round(units_delta_pct, 2),
        revenue_delta_pct=round(revenue_delta_pct, 2),
        profit_delta_pct=round(profit_delta_pct, 2),
        elasticity=round(float(item["price_elasticity"]), 2)
    )

@app.post("/api/chat", response_model=ChatResponse)
def chat_with_analyst(req: ChatRequest):
    query_raw = req.query.strip()
    if not query_raw:
        raise HTTPException(status_code=400, detail="Query cannot be empty")
        
    start_time = time.time()
    q_lower = query_raw.lower()
    
    # 1. Handle Conversational Greetings & Casual Inputs
    greetings = {"hey", "hello", "hi", "hey bro", "hey there", "yo", "sup", "howdy", "good morning", "good evening", "good afternoon", "help", "who are you", "what can you do"}
    # Check exact match or short greeting prefix
    clean_words = set(re.findall(r'\b\w+\b', q_lower))
    is_greeting_only = (
        q_lower in greetings or 
        (len(clean_words) <= 3 and any(w in {"hey", "hello", "hi", "yo", "sup", "howdy"} for w in clean_words) and not any(w in {"menu", "profit", "price", "margin", "prep", "item", "dish", "dog", "star", "plowhorse", "puzzle", "cost"} for w in clean_words))
    )

    if is_greeting_only:
        greeting_text = (
            "Hey there! 👋 I am your **AI Menu Engineering Analyst**.\n\n"
            "I'm grounded in your restaurant's live POS transactional records, demand elasticity curves, and BCG menu matrix. Here are some questions you can ask me:\n\n"
            "- 🏆 **'Which menu items are most profitable?'** — see top profit drivers & margins\n"
            "- 🐕 **'What are my dog items?'** — identify low-volume, low-margin dishes\n"
            "- ⏱️ **'Which dishes have long prep times?'** — diagnose kitchen bottlenecks\n"
            "- 📈 **'What are the optimal pricing recommendations?'** — explore price elasticity & profit lift\n"
            "- 🍕 Or ask about specific dishes like **'How is Chicken Alfredo performing?'**"
        )
        return ChatResponse(
            answer=greeting_text,
            items=[],
            sources=[],
            latency=round(time.time() - start_time, 2)
        )

    # Load live menu data for analysis
    df = get_merged_data()
    menu_items_db = df.to_dict(orient="records")

    # 2. Check for Specific Item Name Mentioned in Query
    matched_items = []
    for item in menu_items_db:
        name_lower = str(item["item_name"]).lower()
        if name_lower in q_lower or any(word in q_lower for word in name_lower.split() if len(word) > 3 and word not in {"with", "and", "the", "platter", "steak"}):
            matched_items.append(item)

    # 3. Check for Category Match
    matched_category = None
    all_categories = {str(c).lower(): str(c) for c in df["category"].unique()}
    for cat_lower, cat_orig in all_categories.items():
        if cat_lower in q_lower or (cat_lower.replace("_", " ") in q_lower):
            matched_category = cat_orig
            break

    # 4. Domain Relevance Check
    domain_keywords = {
        "menu", "dish", "food", "item", "items", "price", "prices", "pricing", "cost", "costs", "cogs", 
        "profit", "profits", "profitable", "profitability", "margin", "margins", "sale", "sales", "sold", "unit", "units", 
        "revenue", "volume", "prep", "preparation", "time", "slow", "fast", "bottleneck", "bottlenecks", "kitchen", 
        "elastic", "elasticity", "sensitive", "sensitivity", "optimal", "strategy", "lift", 
        "dog", "dogs", "star", "stars", "plowhorse", "plowhorses", "puzzle", "puzzles", 
        "bcg", "matrix", "quadrant", "appetizer", "appetizers", "main", "mains", "dessert", "desserts",
        "beverage", "beverages", "drink", "drinks", "order", "orders", "restaurant", "pos", "transaction", "transactions",
        "simulate", "recommendation", "recommendations", "increase", "decrease", "performance"
    }
    
    is_domain_relevant = (
        bool(matched_items) or 
        bool(matched_category) or 
        any(k in q_lower for k in domain_keywords)
    )

    if not is_domain_relevant:
        return ChatResponse(
            answer="irrelevant question asked",
            items=[],
            sources=[],
            latency=round(time.time() - start_time, 2)
        )

    # 5. Intent Detection & Smart Item Retrieval
    selected_items = []
    intro = ""
    
    if matched_items:
        selected_items = matched_items[:4]
        names_str = ", ".join(f"**{it['item_name']}**" for it in selected_items)
        intro = f"📊 **Menu Performance & Pricing Breakdown for {names_str}:**\n\n"
        for it in selected_items:
            elasticity_str = f"{it['price_elasticity']:.2f}" if it.get('price_elasticity') is not None else "N/A"
            optimal_str = f"${it['optimal_price']:.2f}" if it.get('optimal_price') is not None else "N/A"
            lift_str = f"+${it['monthly_profit_lift']:.2f}/mo" if it.get('monthly_profit_lift') is not None else "N/A"
            intro += (
                f"- **{it['item_name']}** ({it['category']}): Currently priced at **${it['price']:.2f}** with a **{it['profit_margin_percent']:.1f}%** profit margin "
                f"(Total profit: **${it['profit']:.2f}** from {int(it['units_sold_last_month'])} orders). "
                f"Prep time is **{int(it['prep_time_minutes'])} mins**. "
                f"Demand elasticity is **{elasticity_str}** with an optimal recommended price of **{optimal_str}** (Potential lift: **{lift_str}**).\n"
            )
            if it['prep_time_minutes'] >= 12:
                intro += f"  ⚠️ *Operational Note: Prep time ({int(it['prep_time_minutes'])}m) exceeds 12-minute kitchen rush benchmark.*\n"

    elif matched_category:
        selected_items = [it for it in menu_items_db if it.get("category") == matched_category][:4]
        intro = f"🍽️ **Category Analysis: {matched_category}**\nHere is the performance and pricing breakdown for dishes in the **{matched_category}** category."

    elif "dog" in q_lower:
        selected_items = [it for it in menu_items_db if it.get("quadrant") == "Dogs"][:4]
        intro = "🐕 **BCG Dogs Analysis (Low Sales Volume & Low Profitability):**\nThese items underperform across both customer demand and profit margins. Consider price testing, recipe cost reformulation, or replacing them with higher-margin seasonal offerings."

    elif "star" in q_lower:
        selected_items = [it for it in menu_items_db if it.get("quadrant") == "Stars"][:4]
        intro = "⭐ **BCG Stars Analysis (High Sales Volume & High Profitability):**\nThese are your flagship dishes generating the bulk of restaurant revenue and profit. Maintain strict recipe consistency, feature prominently on the menu layout, and protect ingredient quality."

    elif "plowhorse" in q_lower or ("high sale" in q_lower and "low margin" in q_lower) or "low margin" in q_lower:
        selected_items = [it for it in menu_items_db if it.get("quadrant") == "Plowhorses"][:4]
        intro = "🐎 **BCG Plowhorses Analysis (High Sales Volume & Low Margin):**\nThese dishes are customer favorites but yield tight profit margins. Recommended strategies include incremental price increases, portion engineering, or reducing expensive side portions."

    elif "puzzle" in q_lower or ("low sale" in q_lower and "high margin" in q_lower) or "high margin" in q_lower:
        selected_items = [it for it in menu_items_db if it.get("quadrant") == "Puzzles"][:4]
        intro = "🧩 **BCG Puzzles Analysis (Low Sales Volume & High Margin):**\nThese items yield high profit per plate but suffer from low order frequency. Consider server upselling contests, bundling with popular drinks, or repositioning them to prime menu real estate."

    elif "most profitable" in q_lower or "highest profit" in q_lower or "top profit" in q_lower or "profit" in q_lower:
        selected_items = sorted(menu_items_db, key=lambda x: x["profit"], reverse=True)[:4]
        intro = "🏆 **Top Profit Drivers Breakdown:**\nHere are the top-performing menu items ranked by total monthly profit contribution grounded in POS transactional records."

    elif "prep" in q_lower or "bottleneck" in q_lower or "slow" in q_lower or "time" in q_lower:
        selected_items = sorted(menu_items_db, key=lambda x: x["prep_time_minutes"], reverse=True)[:4]
        intro = "⏱️ **Operational & Kitchen Bottlenecks Analysis:**\nMenu items with extended preparation times that create kitchen line delays during peak dining rush hours."

    elif "elastic" in q_lower or "price sensitive" in q_lower or "sensitivity" in q_lower or "optimal" in q_lower or "pricing" in q_lower:
        selected_items = sorted(menu_items_db, key=lambda x: abs(x.get("price_elasticity") or 0), reverse=True)[:4]
        intro = "📉 **Demand Elasticity & Pricing Optimization Analysis:**\nItems where econometric regression models suggest optimal price adjustments to maximize net monthly gross profit."

    else:
        selected_items = menu_items_db[:3]
        intro = f"📊 **Menu Performance & Pricing Insights for '{req.query}':**\nPOS metrics, linear regression demand curves, and pricing recommendations for matching items."

    # Build structured items
    structured_items = []
    sources = []
    for it in selected_items:
        structured_items.append({
            "item_id": int(it["item_id"]),
            "item_name": str(it["item_name"]),
            "category": str(it["category"]),
            "price": float(it["price"]),
            "profit": float(it["profit"]),
            "profit_margin": float(it["profit_margin_percent"]),
            "units_sold": float(it["units_sold_last_month"]),
            "prep_time": float(it["prep_time_minutes"]),
            "optimal_price": float(it["optimal_price"]) if it.get("optimal_price") is not None else None,
            "price_elasticity": float(it["price_elasticity"]) if it.get("price_elasticity") is not None else None,
            "pricing_strategy": str(it.get("pricing_strategy", "")),
            "monthly_profit_lift": float(it["monthly_profit_lift"]) if it.get("monthly_profit_lift") is not None else None,
            "quadrant": str(it.get("quadrant", "Dogs"))
        })
        sources.append({"item_name": it["item_name"], "source": "pos_sql"})

    return ChatResponse(
        answer=intro,
        items=structured_items,
        sources=sources,
        latency=round(time.time() - start_time, 2)
    )


