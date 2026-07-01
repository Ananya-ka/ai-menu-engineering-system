import os
import sqlite3
import numpy as np
import pandas as pd

# Set random seed for reproducibility
np.random.seed(42)

# Load data
menu_df = pd.read_csv("restaurant_menu.csv")
sales_df = pd.read_csv("menu_sales_data.csv")

# Merge data to get base price, COGS, and monthly units
df = pd.merge(menu_df, sales_df[["item_id", "units_sold_last_month", "COGS"]], on="item_id")

history_records = []

# Define categories and elasticities
# Assign a deterministic elasticity factor for each item using its item_id
def get_elasticity(item_id, category):
    # Deterministic pseudo-randomness based on item_id
    noise = ((item_id * 17) % 10) / 20.0  # value in [0, 0.45]
    if category == "Main_Courses":
        return 0.7 + noise  # 0.7 to 1.15
    elif category == "Appetizers":
        return 1.3 + noise  # 1.3 to 1.75
    elif category == "Desserts":
        return 1.1 + noise  # 1.1 to 1.55
    elif category == "Beverages":
        return 2.0 + noise  # 2.0 to 2.45
    else:  # Sides
        return 1.4 + noise  # 1.4 to 1.85

for _, row in df.iterrows():
    item_id = int(row["item_id"])
    category = row["category"]
    price_base = row["price"]
    cogs = row["COGS"]
    monthly_units = row["units_sold_last_month"]
    
    # Estimate base weekly sales
    q_base_weekly = max(5, monthly_units / 4.0)
    
    elasticity = get_elasticity(item_id, category)
    
    for week in range(1, 53):
        # 1. Simulate weekly price variation (+/- 12% max)
        # Seasonal price changes (e.g. promotions every 8 weeks) + random fluctuation
        seasonal_price = 0.06 * np.sin(2 * np.pi * week / 8.0)
        random_price = 0.03 * np.random.normal()
        price_w = price_base * (1.0 + seasonal_price + random_price)
        price_w = max(cogs + 0.50, round(price_w, 2))  # Ensure price is at least COGS + $0.50
        
        # 2. Calculate demand based on price change and elasticity
        price_ratio = (price_w - price_base) / price_base
        q_demanded = q_base_weekly * (1.0 - elasticity * price_ratio)
        
        # 3. Add seasonality
        # Beverages sell 30% more in summer (weeks 22-34)
        # Main courses sell 15% more in winter (weeks 1-10, 44-52)
        season_mult = 1.0
        if category == "Beverages" and (22 <= week <= 34):
            season_mult = 1.3
        elif category == "Main_Courses" and (week <= 10 or week >= 44):
            season_mult = 1.15
            
        # 4. Add random volume fluctuation (std = 15% of base weekly units)
        random_demand = np.random.normal(0, 0.15 * q_base_weekly)
        
        units_w = (q_demanded * season_mult) + random_demand
        units_w = max(1, int(round(units_w)))
        
        revenue_w = round(price_w * units_w, 2)
        profit_w = round((price_w - cogs) * units_w, 2)
        
        history_records.append({
            "item_id": item_id,
            "week": week,
            "price": price_w,
            "units_sold": units_w,
            "weekly_revenue": revenue_w,
            "weekly_profit": profit_w
        })

history_df = pd.DataFrame(history_records)

# Save processed CSV file
os.makedirs("data/processed", exist_ok=True)
history_df.to_csv("data/processed/historical_sales.csv", index=False)
print("Generated simulated history: data/processed/historical_sales.csv")

# Save to SQLite database
conn = sqlite3.connect("pos.db")
history_df.to_sql("historical_sales", conn, if_exists="replace", index=False)
print("Loaded historical_sales into pos.db SQLite table")

# Clean up connections
conn.close()
