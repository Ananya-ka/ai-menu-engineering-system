#!/usr/bin/env python
# coding: utf-8

# In[1]:


import pandas as pd
import sqlite3


# In[2]:


menu_df = pd.read_csv("restaurant_menu.csv")
sales_df = pd.read_csv("menu_sales_data.csv")

menu_df.head() 


# In[3]:


sales_df.head()


# In[4]:


conn = sqlite3.connect("pos.db")


# In[5]:


set(menu_df["item_id"]) - set(sales_df["item_id"])


# In[6]:


menu_df.to_sql("restaurant_menu", conn, if_exists="replace", index=False)
sales_df.to_sql("menu_sales", conn, if_exists="replace", index=False)

print("Data loaded into SQLite")


# In[7]:


pd.read_sql("SELECT name FROM sqlite_master WHERE type='table';", conn)


# In[8]:


query = """
SELECT
    m.item_id,
    m.item_name,
    m.category,
    m.price,
    m.prep_time_minutes,
    s.units_sold_last_month,
    s.profit_margin_percent,
    s.COGS
FROM restaurant_menu m
JOIN menu_sales s
ON m.item_id = s.item_id
"""
df = pd.read_sql(query, conn)
df.head()



# In[9]:


query = """
SELECT
  m.item_name,
  m.price * s.units_sold_last_month AS revenue
FROM restaurant_menu m
JOIN menu_sales s
ON m.item_id = s.item_id
ORDER BY revenue DESC
"""
pd.read_sql(query, conn)



# In[10]:


df["revenue"] = df["price"] * df["units_sold_last_month"]
df["profit"] = df["revenue"] * (df["profit_margin_percent"] / 100)


# In[11]:


df[["item_name", "revenue", "profit"]].sort_values("profit", ascending=False)


# In[12]:


df.to_csv("data/processed/menu_metrics.csv", index=False)


# In[13]:


query = """
SELECT
  m.item_name,
  ROUND(
    (m.price * s.units_sold_last_month)
    * (s.profit_margin_percent / 100.0), 2
  ) AS profit
FROM restaurant_menu m
JOIN menu_sales s
ON m.item_id = s.item_id
ORDER BY profit DESC
"""
pd.read_sql(query, conn)


# In[14]:


query = """
SELECT
  m.item_name,
  s.units_sold_last_month AS popularity,
  s.profit_margin_percent AS margin
FROM restaurant_menu m
JOIN menu_sales s
ON m.item_id = s.item_id
ORDER BY popularity DESC
"""
pd.read_sql(query, conn)


# In[ ]:





# In[ ]:




