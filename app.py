import os
import time
import sqlite3
import numpy as np
import pandas as pd
import streamlit as st
import altair as alt
from dotenv import load_dotenv

# Load env variables
load_dotenv(override=True)

# Check for API key
if "OPENAI_API_KEY" not in os.environ or not os.environ["OPENAI_API_KEY"].strip():
    st.error("🔑 `OPENAI_API_KEY` not found in environment variables. Please check your `.env` file.")
    st.stop()

from rag_pipeline import answer_with_llm
from config import LOW_MARGIN_THRESHOLD, LONG_PREP_THRESHOLD, TOP_K

# Page configuration
st.set_page_config(
    page_title="AI Menu Engineering & Pricing Intelligence Analyst",
    page_icon="🍽️",
    layout="wide"
)

# Custom CSS for polished design styling
st.markdown("""
<style>
    .metric-card {
        background-color: #f9f9fb;
        padding: 15px;
        border-radius: 8px;
        border: 1px solid #e1e4e8;
        margin-bottom: 10px;
    }
    .metric-card h4 {
        margin: 0 0 5px 0;
        color: #1f2328;
    }
    .recommendation-card {
        padding: 15px;
        border-radius: 4px;
        margin-top: 15px;
    }
</style>
""", unsafe_allow_html=True)

# App layout split into Sidebar and Main content
with st.sidebar:
    st.image("https://img.icons8.com/color/96/restaurant-menu.png", width=80)
    st.title("System Overview")
    st.markdown("---")
    
    # Load quick metrics from computed data
    try:
        df_menu = pd.read_csv("data/processed/menu_metrics.csv")
        total_items = len(df_menu)
        categories = df_menu["category"].nunique()
        avg_price = df_menu["price"].mean()
        
        st.markdown("### 📊 Menu Statistics")
        col1, col2 = st.columns(2)
        with col1:
            st.metric("Total Items", total_items)
        with col2:
            st.metric("Categories", categories)
        st.metric("Avg Item Price", f"${avg_price:.2f}")
    except Exception:
        st.warning("⚠️ Could not load database stats.")

    st.markdown("---")
    st.markdown("### ⚙️ System Configuration")
    st.markdown(f"**Low Margin Threshold:** `{LOW_MARGIN_THRESHOLD}%`")
    st.markdown(f"**Long Prep Threshold:** `{LONG_PREP_THRESHOLD} mins`")
    st.markdown(f"**Retriever Top-K:** `{TOP_K}`")
    st.caption("Configured in `config.py`")

st.title("🍽️ AI Menu Engineering & Pricing Intelligence")
st.markdown("##### End-to-end pricing analytics, demand elasticity regression modeling, and RAG business insights.")

# Tab setup
tab_chat, tab_pricing = st.tabs(["💬 AI Analyst Chat", "📈 Pricing Intelligence Dashboard"])

# ----------------- TAB 1: RAG CHAT INTERFACE -----------------
with tab_chat:
    st.markdown("### 💬 Ask the Menu Engineering AI")
    st.caption("Ask questions about item profits, margins, preparation times, optimal prices, or price elasticities.")
    
    query = st.text_input(
        "Ask a business question about the menu:",
        placeholder="e.g., Which menu items are most price sensitive?",
        key="menu_query"
    )

    if st.button("Analyze Query", type="primary") and query.strip():
        with st.spinner("🔍 Reviewing POS logs and calculating metrics..."):
            start_time = time.time()
            try:
                result = answer_with_llm(query)
                latency = time.time() - start_time
                
                st.markdown("---")
                
                # Answer Section
                st.subheader("📊 Analyst Response")
                st.info(result["answer"])
                
                # Sources Section
                st.subheader("📌 Referenced Menu Items")
                if result.get("sources"):
                    cols = st.columns(min(len(result["sources"]), 3))
                    for idx, source in enumerate(result["sources"]):
                        col_idx = idx % 3
                        with cols[col_idx]:
                            st.markdown(
                                f"""
                                <div class="metric-card">
                                    <h4>🍕 {source['item_name']}</h4>
                                    <p style='margin:0; font-size: 0.85em; color: gray;'>Source: <code>{source['source']}</code></p>
                                </div>
                                """, 
                                unsafe_allow_html=True
                            )
                else:
                    st.write("No specific items cited as source.")
                    
                # Performance stats
                st.caption(f"⚡ Analysis computed in **{latency:.2f} seconds** using FAISS + GPT-4o-mini")
                
            except Exception as e:
                st.error(f"❌ An error occurred during analysis: {e}")

# ----------------- TAB 2: PRICING DASHBOARD -----------------
with tab_pricing:
    st.markdown("### 📈 Demand Elasticity & Optimal Pricing Analytics")
    st.caption("Perform SQL-derived temporal analysis and visualize regression demand curves for each menu item.")
    
    try:
        # Load merged metrics
        df_menu = pd.read_csv("data/processed/menu_metrics.csv")
        df_pricing = pd.read_csv("data/processed/pricing_metrics.csv")
        df_merged = pd.merge(df_menu, df_pricing, on="item_id", suffixes=("", "_pr"))
        
        # Dropdown selection
        item_list = df_merged["item_name"].tolist()
        selected_item_name = st.selectbox("Select a menu item to analyze:", item_list)
        
        selected_row = df_merged[df_merged["item_name"] == selected_item_name].iloc[0]
        item_id = int(selected_row["item_id"])
        category = selected_row["category"]
        cogs = selected_row["COGS"]
        price_curr = selected_row["price"]
        price_opt = selected_row["optimal_price"]
        elasticity = selected_row["price_elasticity"]
        profit_lift = selected_row["monthly_profit_lift"]
        strategy = selected_row["pricing_strategy"]
        recommendation = selected_row["pricing_recommendation"]
        volatility = selected_row["price_volatility_pct"]
        trend = selected_row["sales_trend_label"]
        alpha = selected_row["regression_intercept"]
        beta = selected_row["regression_slope"]
        
        # SQL query to fetch time-series pricing history
        conn = sqlite3.connect("pos.db")
        query_history = f"""
        SELECT week, price, units_sold, weekly_revenue, weekly_profit 
        FROM historical_sales 
        WHERE item_id = {item_id}
        ORDER BY week ASC
        """
        df_history = pd.read_sql(query_history, conn)
        conn.close()
        
        # Display Metrics Cards
        st.markdown("#### 🔑 Pricing Indicators")
        col_price, col_opt, col_elasticity, col_lift = st.columns(4)
        with col_price:
            st.metric("Current Price", f"${price_curr:.2f}")
        with col_opt:
            st.metric("Recommended Optimal Price", f"${price_opt:.2f}", delta=f"{price_opt - price_curr:+.2f}")
        with col_elasticity:
            st.metric("Price Elasticity (E)", f"-{elasticity:.2f}")
        with col_lift:
            st.metric("Est. Monthly Profit Lift", f"${profit_lift:.2f}", delta=f"+${profit_lift:.2f}" if profit_lift > 0 else None)
            
        # Time-Series line chart of Price & Units Sold
        st.markdown("#### 📅 52-Week Pricing & Sales Volume History")
        
        # Prepare charts
        chart_data = df_history[["week", "price", "units_sold"]].copy()
        
        # 1. Price Line Chart
        price_chart = alt.Chart(chart_data).mark_line(color="#1f77b4", strokeWidth=2).encode(
            x=alt.X("week:Q", title="Week of Year", scale=alt.Scale(zero=False)),
            y=alt.Y("price:Q", title="Price ($)", scale=alt.Scale(zero=False)),
            tooltip=["week", "price"]
        ).properties(title="Weekly Price Trend", height=200)
        
        # 2. Units Sold Area Chart
        sales_chart = alt.Chart(chart_data).mark_area(color="#2ca02c", opacity=0.4).encode(
            x=alt.X("week:Q", title="Week of Year", scale=alt.Scale(zero=False)),
            y=alt.Y("units_sold:Q", title="Units Sold", scale=alt.Scale(zero=False)),
            tooltip=["week", "units_sold"]
        ).properties(title="Weekly Units Sold Trend", height=200)
        
        col_line1, col_line2 = st.columns(2)
        with col_line1:
            st.altair_chart(price_chart, use_container_width=True)
        with col_line2:
            st.altair_chart(sales_chart, use_container_width=True)
            
        # Regression Demand Curve Scatter Plot
        st.markdown("#### 🔬 Demand Curve & Regression Analysis")
        col_reg, col_rec = st.columns([3, 2])
        
        with col_reg:
            # Generate fitted line points
            price_range = np.linspace(df_history["price"].min(), df_history["price"].max(), 100)
            demand_fit = alpha + beta * price_range
            df_fit = pd.DataFrame({"Price": price_range, "Fitted Demand": demand_fit})
            
            scatter = alt.Chart(df_history).mark_circle(size=60, color="#1f77b4").encode(
                x=alt.X("price:Q", title="Price ($)", scale=alt.Scale(zero=False)),
                y=alt.Y("units_sold:Q", title="Weekly Units Sold", scale=alt.Scale(zero=False)),
                tooltip=["week", "price", "units_sold"]
            )
            
            line = alt.Chart(df_fit).mark_line(color="#d62728", strokeWidth=2.5).encode(
                x="Price:Q",
                y="Fitted Demand:Q"
            )
            
            reg_chart = (scatter + line).properties(
                title=f"Demand Curve (Q = {alpha:.1f} - {abs(beta):.2f} * Price)",
                height=300
            )
            st.altair_chart(reg_chart, use_container_width=True)
            
        with col_rec:
            st.markdown("##### 📌 Pricing Recommendation & Diagnostics")
            
            # Recommendation status alert
            if strategy == "Increase Price":
                st.success(f"📈 **Action: {strategy}**")
                theme_color = "#2e7d32"
                bg_color = "#f0f7f4"
            elif strategy == "Decrease Price":
                st.warning(f"📉 **Action: {strategy}**")
                theme_color = "#f57c00"
                bg_color = "#fffde7"
            else:
                st.info(f"⚖️ **Action: {strategy}**")
                theme_color = "#0288d1"
                bg_color = "#e3f2fd"
                
            st.markdown(
                f"""
                <div class="recommendation-card" style="border-left: 5px solid {theme_color}; background-color: {bg_color};">
                    <p style="margin:0; font-size:1.05em; line-height:1.4; color: #1f2328;">{recommendation}</p>
                </div>
                """,
                unsafe_allow_html=True
            )
            
            st.markdown("---")
            st.markdown("##### 📊 SQL-Derived Diagnostics")
            st.markdown(f"**Price Volatility Index:** `{volatility}%` *(Standard deviation of price relative to mean)*")
            st.markdown(f"**Recent Sales Trend:** `{trend}` *(Fitted slope over the last 12 weeks)*")
            st.markdown(f"**Cost of Goods Sold (COGS):** `${cogs:.2f}`")
            st.markdown(f"**Base Menu Category:** `{category}`")
            
    except Exception as e:
        st.error(f"⚠️ Error rendering dashboard details: {e}")
        st.info("Please make sure the simulation and training steps are complete.")
