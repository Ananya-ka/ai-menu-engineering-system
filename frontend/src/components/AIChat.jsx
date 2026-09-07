import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  Clock, 
  Database, 
  ArrowUpRight, 
  Loader2, 
  Lightbulb,
  ExternalLink
} from 'lucide-react';
import { sendAnalystQuery } from '../services/api';

export default function AIChat({ onSelectItem }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: "👋 Hello! I am your AI Menu Engineering Analyst. You can ask any business question regarding menu profitability, margins, prep times, demand elasticity, or optimal pricing recommendations grounded in your POS transactional records.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: []
    }
  ]);

  const quickPrompts = [
    "Which menu items are most profitable?",
    "Which items sell a lot but have low margin?",
    "Which items take long to prepare?",
    "Which items are most price sensitive?",
    "What are the top optimal pricing recommendations?"
  ];

  const handleSend = async (textToSend) => {
    const messageText = (textToSend || query).trim();
    if (!messageText || loading) return;

    const userMsgId = Date.now();
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const response = await sendAnalystQuery(messageText);
      const botMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: response.answer,
        sources: response.sources || [],
        items: response.items || [],
        latency: response.latency,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: `⚠️ Error processing query: ${err.message}. Please verify the backend connection.`,
        isError: true,
        sources: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format markdown text with bolding and bullet list styling
  const renderFormattedText = (rawText) => {
    if (!rawText) return null;
    const lines = rawText.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={idx} style={{ height: '8px' }} />;
      }
      // Check for bullet lines
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const content = trimmed.substring(2);
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '4px 0', paddingLeft: '4px' }}>
            <span style={{ color: 'var(--accent-secondary)', marginTop: '2px', fontSize: '0.8rem' }}>•</span>
            <span dangerouslySetInnerHTML={{ __html: parseMarkdownInline(content) }} />
          </div>
        );
      }
      // Check for blockquote / note lines
      if (trimmed.startsWith('>')) {
        const noteContent = trimmed.replace(/^>\s*/, '');
        return (
          <div 
            key={idx} 
            style={{
              margin: '8px 0',
              padding: '8px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderLeft: '3px solid var(--accent-primary)',
              borderRadius: '0 6px 6px 0',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)'
            }}
            dangerouslySetInnerHTML={{ __html: parseMarkdownInline(noteContent) }}
          />
        );
      }
      return (
        <p 
          key={idx} 
          style={{ margin: '4px 0', lineHeight: '1.6' }}
          dangerouslySetInnerHTML={{ __html: parseMarkdownInline(line) }}
        />
      );
    });
  };

  const parseMarkdownInline = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--text-primary); font-weight: 700;">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em style="color: var(--text-secondary);">$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.06); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.85em; color: var(--accent-primary);">$1</code>');
  };

  return (
    <div className="animate-fade-in" style={{
      maxWidth: '1000px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* Suggested Prompt Chips */}
      <div className="glass-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Sparkles size={16} color="var(--accent-secondary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Suggested Questions for the Analyst
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="btn-secondary"
              style={{
                fontSize: '0.8rem',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-color)'
              }}
            >
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="glass-card" style={{
        padding: '24px',
        minHeight: '480px',
        maxHeight: '620px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              gap: '14px',
              alignItems: 'flex-start',
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: msg.sender === 'user' ? '80%' : '94%'
            }}
          >
            {/* Avatar */}
            {msg.sender === 'assistant' ? (
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #4f46e5 0%, #0284c7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)'
              }}>
                <Bot size={20} color="#ffffff" />
              </div>
            ) : (
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: '#e2e8f0',
                border: '1px solid #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <User size={18} color="#475569" />
              </div>
            )}

            {/* Bubble */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{
                backgroundColor: msg.sender === 'user' ? 'var(--accent-primary)' : '#ffffff',
                border: msg.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                borderRadius: msg.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                padding: '16px 20px',
                color: msg.sender === 'user' ? '#ffffff' : 'var(--text-primary)',
                fontSize: '0.92rem',
                lineHeight: '1.6',
                boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
              }}>
                {msg.sender === 'user' ? (
                  <div>{msg.text}</div>
                ) : (
                  <div>{renderFormattedText(msg.text)}</div>
                )}

                {/* Referenced Items / Sources Row */}
                {msg.sources && msg.sources.length > 0 && (
                  <div style={{
                    marginTop: '14px',
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: '10px'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--accent-secondary)',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Database size={13} />
                      <span>Referenced Menu Items & POS Data:</span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {msg.sources.map((src, i) => {
                        const matchedItem = msg.items?.find(it => it.item_name === src.item_name);
                        return (
                          <div
                            key={i}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 'var(--radius-sm)',
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              color: 'var(--text-primary)'
                            }}
                          >
                            <span>🍕 <strong>{src.item_name}</strong></span>
                            {matchedItem && (
                              <button
                                onClick={() => onSelectItem(matchedItem.item_id)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--accent-primary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  padding: '0 2px',
                                  cursor: 'pointer'
                                }}
                                title="Inspect in Pricing Lab"
                              >
                                <span style={{ textDecoration: 'underline' }}>Analyze</span>
                                <ExternalLink size={11} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Latency and Time */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.7rem', color: 'var(--text-muted)', paddingLeft: '4px' }}>
                <span>{msg.timestamp}</span>
                {msg.latency && (
                  <span>⚡ Analysis computed in <strong>{msg.latency}s</strong> (FAISS + RAG)</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #4f46e5 0%, #0284c7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Loader2 size={20} color="#ffffff" className="animate-spin" />
            </div>
            <div style={{
              padding: '12px 18px',
              borderRadius: 'var(--radius-md)',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
            }}>
              🔍 Grounding facts from POS logs, computing regressions & drafting answer...
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="glass-card" style={{ padding: '12px 16px' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
        >
          <input
            type="text"
            placeholder="Ask a question about menu profitability, margins, prep bottlenecks, or pricing..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
              outline: 'none',
              padding: '8px 6px'
            }}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="btn-primary"
            style={{ opacity: (!query.trim() || loading) ? 0.5 : 1 }}
          >
            <Send size={16} />
            <span>Ask Analyst</span>
          </button>
        </form>
      </div>
    </div>
  );
}
