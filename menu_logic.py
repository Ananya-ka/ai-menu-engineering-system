#!/usr/bin/env python
# coding: utf-8

# In[1]:


import pandas as pd

df = pd.read_csv("data/processed/menu_metrics.csv")
df.head()


# In[2]:


HIGH_SALES_THRESHOLD = df["units_sold_last_month"].quantile(0.6)
LOW_MARGIN_THRESHOLD = 50     # percent
LONG_PREP_THRESHOLD = 12      # minutes



# In[3]:


df.sort_values("profit", ascending=False).head(3)[
    ["item_name", "profit"]
]


# In[4]:


df[
    (df["units_sold_last_month"] >= HIGH_SALES_THRESHOLD) &
    (df["profit_margin_percent"] < LOW_MARGIN_THRESHOLD)
][["item_name", "units_sold_last_month", "profit_margin_percent"]]


# In[5]:


df[df["prep_time_minutes"] >= LONG_PREP_THRESHOLD][
    ["item_name", "prep_time_minutes"]
].sort_values("prep_time_minutes", ascending=False)


# In[6]:


df["popularity_tier"] = df["units_sold_last_month"].apply(
    lambda x: "High" if x >= HIGH_SALES_THRESHOLD else "Low"
)

df["profitability_tier"] = df["profit"].apply(
    lambda x: "High" if x >= df["profit"].median() else "Low"
)

df["menu_class"] = df["popularity_tier"] + "-" + df["profitability_tier"]


# In[7]:


df[["item_name", "menu_class"]].head()


# In[9]:


df.to_csv("data/processed/menu_metrics.csv", index=True)


# In[ ]:




