#!/usr/bin/env python
# coding: utf-8

# In[1]:


import pandas as pd
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings


# In[2]:


# Load metrics
df = pd.read_csv("data/processed/menu_metrics.csv")

# Recreate thresholds (same as Day 3)
HIGH_SALES_THRESHOLD = df["units_sold_last_month"].quantile(0.6)
LOW_MARGIN_THRESHOLD = 50
LONG_PREP_THRESHOLD = 12


# In[3]:


# Load FAISS
embedding_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

vectorstore = FAISS.load_local(
    "data/processed/faiss_index",
    embedding_model,
    allow_dangerous_deserialization=True
)

retriever = vectorstore.as_retriever(search_kwargs={"k": 10})


# In[4]:


docs = retriever.invoke("Which menu items are most profitable?")
[(d.metadata["item_name"], d.metadata["profit"]) for d in docs]


# In[5]:


def most_profitable(docs, top_n=3):
    return sorted(
        docs,
        key=lambda d: d.metadata["profit"],
        reverse=True
    )[:top_n]


# In[10]:


def high_sales_low_margin(docs, top_n=3):
    strict = [
        d for d in docs
        if d.metadata["units_sold"] >= HIGH_SALES_THRESHOLD
        and d.metadata["profit_margin"] < LOW_MARGIN_THRESHOLD
    ]

    if strict:
        return strict[:top_n]

    # refined fallback: keep only bottom 40% margins among retrieved docs
    margin_cutoff = pd.Series(
        [d.metadata["profit_margin"] for d in docs]
    ).quantile(0.4)

    fallback = [
        d for d in docs
        if d.metadata["profit_margin"] <= margin_cutoff
    ]

    return sorted(
        fallback,
        key=lambda d: (-d.metadata["units_sold"], d.metadata["profit_margin"])
    )[:top_n]


# In[11]:


def long_prep_items(docs, top_n=3):
    return sorted(
        docs,
        key=lambda d: d.metadata["prep_time"],
        reverse=True
    )[:top_n]


# In[12]:


def answer_query(query):
    q = query.lower()
    docs = retriever.invoke(query)

    if "most profitable" in q:
        return most_profitable(docs)

    if "sell a lot" in q and "low margin" in q:
        return high_sales_low_margin(docs)

    if "long to prepare" in q or "take long" in q:
        return long_prep_items(docs)

    return docs[:3]


# In[13]:


queries = [
    "Which menu items are most profitable?",
    "Which items sell a lot but have low margins?",
    "Items that take long to prepare"
]

for q in queries:
    print("\nQUERY:", q)
    docs = answer_query(q)
    for d in docs:
        print("-", d.metadata["item_name"], "|", d.metadata)


# In[ ]:




