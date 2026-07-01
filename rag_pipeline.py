# rag_pipeline.py
import pandas as pd
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings

from config import TOP_K

load_dotenv(override=True)

# ---- Load data & index ONCE ----
df = pd.read_csv("data/processed/menu_metrics.csv")

embedding_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

vectorstore = FAISS.load_local(
    "data/processed/faiss_index",
    embedding_model,
    allow_dangerous_deserialization=True
)

retriever = vectorstore.as_retriever(search_kwargs={"k": TOP_K})

# ---- LLM (explainer only) ----
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

PROMPT = PromptTemplate(
    input_variables=["question", "context"],
    template="""
You are a menu engineering analyst.
Use ONLY the facts in DATA.
Do NOT calculate or infer new values.

DATA:
{context}

QUESTION:
{question}

Answer concisely.
"""
)

def build_context(docs):
    return "\n".join(f"- {d.page_content}" for d in docs)


def most_profitable(docs, top_n=3):
    return sorted(
        docs,
        key=lambda d: d.metadata["profit"],
        reverse=True
    )[:top_n]


def high_sales_low_margin(docs, top_n=3):
    from config import LOW_MARGIN_THRESHOLD

    strict = [
        d for d in docs
        if d.metadata["units_sold"] >= df["units_sold_last_month"].quantile(0.6)
        and d.metadata["profit_margin"] < LOW_MARGIN_THRESHOLD
    ]

    if strict:
        return strict[:top_n]

    # fallback: lowest margins among relevant docs
    margin_cutoff = sorted(
        [d.metadata["profit_margin"] for d in docs]
    )[int(len(docs) * 0.4)]

    fallback = [
        d for d in docs
        if d.metadata["profit_margin"] <= margin_cutoff
    ]

    return sorted(
        fallback,
        key=lambda d: (-d.metadata["units_sold"], d.metadata["profit_margin"])
    )[:top_n]


def long_prep_items(docs, top_n=3):
    return sorted(
        docs,
        key=lambda d: d.metadata["prep_time"],
        reverse=True
    )[:top_n]


def most_elastic_items(docs, top_n=3):
    return sorted(
        docs,
        key=lambda d: d.metadata.get("price_elasticity", 0),
        reverse=True
    )[:top_n]


def highest_profit_lift_items(docs, top_n=3):
    return sorted(
        docs,
        key=lambda d: d.metadata.get("monthly_profit_lift", 0),
        reverse=True
    )[:top_n]


def answer_query(query):
    q = query.lower()
    docs = retriever.invoke(query)

    if "most profitable" in q:
        return most_profitable(docs)

    if "sell a lot" in q and "low margin" in q:
        return high_sales_low_margin(docs)

    if "long to prepare" in q or "take long" in q:
        return long_prep_items(docs)

    if "price sensitive" in q or "elastic" in q or "sensitivity" in q:
        return most_elastic_items(docs)

    if "optimal price" in q or "pricing recommendation" in q or "profit lift" in q or "pricing strategy" in q:
        return highest_profit_lift_items(docs)

    return docs[:3]

def answer_with_llm(query):
    docs = answer_query(query)   # ← NOW EXISTS
    context = build_context(docs)

    resp = llm.invoke(
        PROMPT.format(
            question=query,
            context=context
        )
    )

    return {
        "answer": resp.content,
        "sources": [
            {
                "item_name": d.metadata["item_name"],
                "source": d.metadata.get("source", "pos_sql")
            }
            for d in docs
        ]
    }
