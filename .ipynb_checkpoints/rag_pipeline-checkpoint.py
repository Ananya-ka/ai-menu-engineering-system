# rag_pipeline.py

import time
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

# assumes retriever, df, thresholds are created here OR imported
# (copy them from your notebook)

llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0
)

prompt = PromptTemplate(
    input_variables=["context", "question"],
    template="""
You are an AI Menu Engineering Analyst.

Answer the question using ONLY the facts provided below.
Do NOT calculate, rank, or infer new numbers.
If the answer is not present, say "Not enough data."

DATA:
{context}

QUESTION:
{question}

Provide a concise, factual explanation.
"""
)

def build_context(docs):
    return "\n".join(f"- {d.page_content}" for d in docs)


def answer_query(query):
    q = query.lower()
    docs = retriever.invoke(query)

    if "most profitable" in q:
        return sorted(docs, key=lambda d: d.metadata["profit"], reverse=True)[:3]

    if "sell a lot" in q and "low margin" in q:
        strict = [
            d for d in docs
            if d.metadata["units_sold"] >= HIGH_POPULARITY_THRESHOLD
            and d.metadata["profit_margin"] < LOW_MARGIN_THRESHOLD
        ]
        if strict:
            return strict[:3]

        return sorted(
            docs,
            key=lambda d: (-d.metadata["units_sold"], d.metadata["profit_margin"])
        )[:3]

    if "long to prepare" in q or "take long" in q:
        return sorted(docs, key=lambda d: d.metadata["prep_time"], reverse=True)[:3]

    return docs[:3]


def answer_with_llm(query):
    start = time.time()

    docs = answer_query(query)
    context = build_context(docs)

    response = llm.invoke(
        prompt.format(context=context, question=query)
    )

    return {
        "answer": response.content,
        "sources": [
            {
                "item_name": d.metadata["item_name"],
                "item_id": d.metadata["item_id"],
                "source": d.metadata["source"]
            }
            for d in docs
        ],
        "latency_seconds": round(time.time() - start, 2)
    }

