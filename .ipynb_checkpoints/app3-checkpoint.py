import streamlit as st
from rag_pipeline import answer_with_llm
import time

# import everything you already defined
# retriever, df, llm, prompt
# answer_query, build_context, answer_with_llm
st.set_page_config(page_title="AI Menu Engineering Analyst", layout="centered")

st.title("🍽️ AI Menu Engineering Analyst")
st.write("Ask business questions about menu performance, profitability, and operations.")

query = st.text_input(
    "Ask a question",
    placeholder="Which menu items are most profitable?"
)

ask = st.button("Analyze")


if ask and query:
    with st.spinner("Analyzing menu data..."):
        result = answer_with_llm(query)

    st.subheader("📊 Answer")
    st.write(result["answer"])

    st.subheader("📌 Sources")
    for src in result["sources"]:
        st.write(f"- **{src['item_name']}** (source: {src['source']})")

    st.caption(f"⏱️ Latency: {result['latency_seconds']} seconds")

