import React from 'react';
import { 
  Utensils, 
  BarChart3, 
  TrendingUp, 
  Bot, 
  Layers, 
  Activity,
  Sparkles
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, health, overview }) {
  const tabs = [
    { id: 'overview', label: 'Executive Overview & BCG Matrix', icon: BarChart3 },
    { id: 'pricing', label: 'Pricing Intelligence & Regression Lab', icon: TrendingUp },
    { id: 'chat', label: 'AI Menu Analyst', icon: Bot },
  ];

  return (
    <header style={{
      borderBottom: '1px solid var(--border-color)',
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0 24px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '70px',
        gap: '20px'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #4f46e5 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
          }}>
            <Utensils size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                AI Menu Intelligence
              </span>
              <span className="badge badge-category" style={{ fontSize: '0.65rem' }}>
                RAG + Econometrics
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              POS Analytics & Demand Elasticity Engine
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{
          display: 'flex',
          background: '#f1f5f9',
          borderRadius: 'var(--radius-full)',
          padding: '4px',
          border: '1px solid var(--border-color)'
        }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent',
                  boxShadow: isActive ? '0 2px 8px rgba(79, 70, 229, 0.3)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* System Status Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {health?.openai_configured && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: '#dcfce7',
              border: '1px solid #bbf7d0',
              fontSize: '0.75rem',
              color: '#15803d',
              fontWeight: 600
            }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#16a34a',
                boxShadow: '0 0 6px #16a34a'
              }}></span>
              <span>GPT-4o-mini Connected</span>
            </div>
          )}

          {overview && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: '#f8fafc',
              border: '1px solid var(--border-color)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              fontWeight: 500
            }}>
              <Layers size={14} />
              <span>{overview.total_items} Items</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
