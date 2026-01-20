# ai-menu-engineering-system
An end-to-end analytics-first system that transforms transactional data into actionable business insights.
The project combines SQL-based metric computation, retrieval-augmented AI, and a Streamlit interface, and is being extended toward event-driven, near–real-time analytics.

Project Overview

This project helps answer key business questions such as:

1. Which items are most profitable and should be promoted?

2. Which items sell well but have inefficient pricing?

3. Which items create operational bottlenecks due to long preparation times?

All calculations are deterministic and data-grounded, with AI used strictly as an explanation layer, not for decision-making.

KEY DESIGN PRINCIPLES:

Analytics-first, AI-second

SQL as the source of truth

Explainable, auditable insights

Clear separation of data, logic, and UI

Scalable toward real-time systems

SYSTEM ARCHITECTURE : 

Transactional Data (POS-style)
        ->
SQL-Based Metric Computation
        ->
RAG-Ready Analytical Documents
        ->
Semantic Retrieval (FAISS)
        ->
LLM Insight Generation
        ->
Streamlit Dashboard

Event-Driven Extension
