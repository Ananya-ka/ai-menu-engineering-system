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

 New Order Event
        ->
 Event Stream (Redis / Kafka – conceptual)
        ->
 Async Consumer (FastAPI)
        ->
 Incremental Metric Updates
        ->
 Conditional Insight Regeneration
        ->
 Live Dashboard Update







TECH STACK

 Data & Analytics: SQL (SQLite), Pandas

 Retrieval: FAISS

 AI Layer: OpenAI (RAG-based, hallucination-safe)

 Backend: Python

 Frontend: Streamlit

 Streaming (Design / Partial Implementation): Redis Streams, Async FastAPI

HOW IT WORKS

 Data Modeling

  Transactional data is modeled as menu metadata + sales performance.

 SQL Analytics

  Core metrics (profit, demand, margin, preparation time) are computed using SQL for correctness and reproducibility.

 RAG Document Layer

  SQL outputs are converted into structured, business-readable documents.

 Semantic Retrieval

  Relevant records are retrieved using FAISS based on user queries.

 AI Explanation Layer
 
  An LLM generates insights strictly from retrieved data with deterministic prompting.

 Streamlit UI

  A lightweight dashboard allows non-technical users to ask questions and receive fast, grounded insights.

 Event-Driven Upgrade

  Transactions are treated as events, enabling incremental metric updates and near–real-time insight refresh without batch recomputation.

EXAMPLE QUESTIONS

 Which menu items are most profitable and should be promoted?

 Which items sell well but have low margins?

 Which items should be reconsidered due to long preparation times?

WHAT THIS PROJECT DEMONSTRATES

 Strong analytics fundamentals

 SQL-based metric design and joins

 Business-driven metric selection

 Safe and explainable use of AI

 Event-driven system thinking

 Ability to translate data into decisions

 Clear communication via a product-style interface

FUTURE ENHANCEMENTS:

 Full event-stream ingestion (Kafka/Redis)

 Incremental analytics at scale

 Logging and evaluation

 Trend and cohort analysis

 Dockerized deployment
