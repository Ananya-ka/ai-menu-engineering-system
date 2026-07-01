import os
import sqlite3
import numpy as np
import pandas as pd

# Connect to database
conn = sqlite3.connect("pos.db")

# Load base menu metrics to obtain COGS and current price
df_menu = pd.read_csv("data/processed/menu_metrics.csv")

pricing_metrics = []

for _, row in df_menu.iterrows():
    item_id = int(row["item_id"])
    item_name = row["item_name"]
    category = row["category"]
    price_curr = row["price"]
    cogs = row["COGS"]
    
    # 1. SQL Query to fetch time-series data
    query = f"""
    SELECT week, price, units_sold 
    FROM historical_sales 
    WHERE item_id = {item_id}
    ORDER BY week ASC
    """
    df_history = pd.read_sql(query, conn)
    
    # 2. Derive SQL features (volatility and trend)
    # Price volatility = standard deviation of price / mean price
    price_std = df_history["price"].std()
    price_mean = df_history["price"].mean()
    price_volatility = (price_std / price_mean) if price_mean > 0 else 0
    
    # Sales trend = slope of units_sold against week for the last 12 weeks
    df_last_12 = df_history.tail(12)
    x_t = df_last_12["week"].values
    y_t = df_last_12["units_sold"].values
    slope_t = np.polyfit(x_t, y_t, 1)[0] if len(x_t) > 1 else 0
    
    if slope_t > 0.2:
        trend_label = "Increasing"
    elif slope_t < -0.2:
        trend_label = "Decreasing"
    else:
        trend_label = "Stable"
        
    # 3. Regression Modeling: Units Sold = alpha + beta * Price
    x = df_history["price"].values
    y = df_history["units_sold"].values
    
    # Run manual linear regression
    mean_x = np.mean(x)
    mean_y = np.mean(y)
    num = np.sum((x - mean_x) * (y - mean_y))
    den = np.sum((x - mean_x) ** 2)
    
    beta = num / den if den != 0 else 0.0
    
    # Apply economic constraint: demand slope must be negative
    if beta >= 0 or np.isnan(beta):
        # Default elasticity of -1.5 at means: Q = a + beta*P => beta = -1.5 * Q_mean / P_mean
        beta = -1.5 * mean_y / mean_x
        
    alpha = mean_y - beta * mean_x
    
    # 4. Compute Price Elasticity (at average price and units sold)
    elasticity = -beta * (price_mean / mean_y) if mean_y > 0 else 0.0
    
    # 5. Profit Maximization Optimization
    # Profit = (Price - COGS) * (alpha + beta * Price)
    # dProfit/dPrice = beta * Price + alpha + beta * (Price - COGS) = 2 * beta * Price + alpha - beta * COGS = 0
    # P_opt = (beta * COGS - alpha) / (2 * beta)
    if beta != 0:
        price_opt = (beta * cogs - alpha) / (2.0 * beta)
    else:
        price_opt = price_curr
        
    # Apply business bounds: optimal price between COGS+$0.50 and current price * 1.4
    price_opt = max(cogs + 0.50, min(price_opt, price_curr * 1.4))
    price_opt = round(price_opt, 2)
    
    # 6. Estimate Profit Lift
    # Expected demand at optimal vs current
    q_opt = max(1.0, alpha + beta * price_opt)
    q_curr = max(1.0, alpha + beta * price_curr)
    
    profit_opt = (price_opt - cogs) * q_opt
    profit_curr = (price_curr - cogs) * q_curr
    
    weekly_lift = max(0.0, profit_opt - profit_curr)
    monthly_lift = round(weekly_lift * 4.0, 2)
    
    # Pricing recommendation summary
    if price_opt > price_curr + 0.10:
        recommendation = "Recommending price increase to capture additional margin."
        strategy = "Increase Price"
    elif price_opt < price_curr - 0.10:
        recommendation = "Recommending price discount to drive volume and capture aggregate profit."
        strategy = "Decrease Price"
    else:
        recommendation = "Current price is optimal; maintain pricing."
        strategy = "Maintain Price"
        
    pricing_metrics.append({
        "item_id": item_id,
        "item_name": item_name,
        "regression_slope": round(beta, 4),
        "regression_intercept": round(alpha, 2),
        "price_elasticity": round(elasticity, 2),
        "optimal_price": price_opt,
        "monthly_profit_lift": monthly_lift,
        "price_volatility_pct": round(price_volatility * 100, 2),
        "sales_trend_label": trend_label,
        "pricing_strategy": strategy,
        "pricing_recommendation": recommendation
    })

pricing_df = pd.DataFrame(pricing_metrics)

# Save metrics
pricing_df.to_csv("data/processed/pricing_metrics.csv", index=False)
print("Trained pricing model and saved: data/processed/pricing_metrics.csv")

# Save table to SQLite database for future analysis
pricing_df.to_sql("pricing_metrics", conn, if_exists="replace", index=False)
print("Loaded pricing_metrics into pos.db SQLite table")

# Clean up connections
conn.close()
