#!/usr/bin/env python
# coding: utf-8

# In[8]:


import pandas as pd

df_menu = pd.read_csv("data/processed/menu_metrics.csv")
df_pricing = pd.read_csv("data/processed/pricing_metrics.csv")
df = pd.merge(df_menu, df_pricing, on="item_id", suffixes=("", "_pr"))


# In[9]:


from langchain_core.documents import Document

documents = []

for _, row in df.iterrows():
    content = (
        f"Menu item '{row['item_name']}' is in category '{row['category']}'. "
        f"It is priced at {row['price']}. "
        f"It sold {row['units_sold_last_month']} units last month. "
        f"Profit margin is {row['profit_margin_percent']}%. "
        f"Total profit generated was {round(row['profit'], 2)}. "
        f"Average preparation time is {row['prep_time_minutes']} minutes. "
        f"Menu classification is {row['menu_class']}. "
        f"This item has a calculated demand price elasticity of {row['price_elasticity']} (volatility: {row['price_volatility_pct']}%, sales trend: {row['sales_trend_label']}). "
        f"The profit-optimizing price is recommended to be {row['optimal_price']} (suggested action: {row['pricing_strategy']}), "
        f"which is estimated to increase monthly profits by ${row['monthly_profit_lift']}. "
        f"Analyst recommendation: {row['pricing_recommendation']}"
    )

    metadata = {
        "item_id": row["item_id"],
        "item_name": row["item_name"],
        "category": row["category"],
        "price": row["price"],
        "units_sold": row["units_sold_last_month"],
        "profit_margin": row["profit_margin_percent"],
        "profit": round(row["profit"], 2),
        "prep_time": row["prep_time_minutes"],
        "menu_class": row["menu_class"],
        "price_elasticity": row["price_elasticity"],
        "optimal_price": row["optimal_price"],
        "monthly_profit_lift": row["monthly_profit_lift"],
        "pricing_strategy": row["pricing_strategy"],
        "sales_trend": row["sales_trend_label"],
        "source": "pos_sql"
    }

    documents.append(
        Document(page_content=content, metadata=metadata)
    )

len(documents)



# In[10]:


documents[0].page_content
documents[0].metadata




# In[17]:


from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

embedding_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

vectorstore = FAISS.from_documents(
    documents,
    embedding_model
)


# In[18]:


vectorstore.save_local("data/processed/faiss_index")


# In[19]:


retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

docs = retriever.invoke("Which menu items are most profitable?")

for d in docs:
    print("-", d.metadata["item_name"], d.metadata["profit"])

