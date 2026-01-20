import time
import os
import streamlit as st

from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

import os
os.environ["OPENAI_API_KEY"] = "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"

# ---------------- PAGE CONFIG ----------------
st.set_page_config(
    page_title="AI Menu Engineering Analyst",
    page_icon="🍽️",
    layout="centered"
)

st.title("🍽️ AI Menu Engineering Analyst")
st.caption("RAG-powered insights grounded in POS data")

# ---------------- API KEY CHECK ----------------
if "OPENAI_API_KEY" not in os.environ:
    st.error("OPENAI_API_KEY not found. Please set it before running the app.")
    st.stop()

# ---------------- LOAD RETRIEVER ----------------
@st.cache_resource
def load_retriever():
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    vectorstore = FAISS.load_local(
        "faiss_index",
        embeddings,
        allow_dangerous_deserialization=True
    )

    return vectorstore.as_retriever(search_kwargs={"k": 3})

retriever = load_retriever()

# ---------------- LOAD LLM ----------------
@st.cache_resource
def load_llm():
    return ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0,
	

    )

llm = load_llm()

# ---------------- PROMPT ----------------
prompt = PromptTemplate(
    template="""
You are an AI Menu Engineering Analyst.

RULES:
- Use ONLY the provided POS data context.
- When asked about "most profitable", rank by TOTAL PROFIT, not margin.
- Do not guess or infer beyond the data.
- If the answer is unclear, say "Not enough data".

Context:
{context}

Question:
{question}

Answer clearly and concisely for a business stakeholder.
""",
    input_variables=["context", "question"]
)

# ---------------- RAG CHAIN ----------------
rag_chain = (
    {
        "context": retriever,
        "question": lambda x: x
    }
    | prompt
    | llm
    | StrOutputParser()
)

# ---------------- UI ----------------
query = st.text_input(
    "Ask a menu performance question:",
    placeholder="e.g. Which menu items are most profitable?"
)

if query:
    with st.spinner("Analyzing menu data..."):
        start = time.time()
        answer = rag_chain.invoke(query)
        latency = time.time() - start

    st.subheader("📊 Answer")
    st.write(answer)

    st.caption(f"⏱️ Response time: {latency:.2f} seconds")

