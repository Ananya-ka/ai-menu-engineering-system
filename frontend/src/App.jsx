import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import OverviewDashboard from './components/OverviewDashboard';
import PricingDashboard from './components/PricingDashboard';
import AIChat from './components/AIChat';
import { 
  fetchHealth, 
  fetchOverview, 
  fetchItems, 
  fetchMatrixData 
} from './services/api';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [health, setHealth] = useState(null);
  const [overview, setOverview] = useState(null);
  const [items, setItems] = useState([]);
  const [matrixData, setMatrixData] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [hData, oData, iData, mData] = await Promise.all([
        fetchHealth().catch(err => ({ status: 'error', error: err.message })),
        fetchOverview(),
        fetchItems(),
        fetchMatrixData()
      ]);
      setHealth(hData);
      setOverview(oData);
      setItems(iData);
      setMatrixData(mData);
      if (iData.length > 0 && !selectedItemId) {
        setSelectedItemId(iData[0].item_id);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectItemAndNavigate = (itemId) => {
    setSelectedItemId(itemId);
    setActiveTab('pricing');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        health={health} 
        overview={overview} 
      />

      <main style={{
        maxWidth: '1440px',
        width: '100%',
        margin: '0 auto',
        padding: '24px',
        flex: 1
      }}>
        {error && (
          <div className="glass-card" style={{
            padding: '20px',
            marginBottom: '24px',
            borderLeft: '4px solid #ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(239, 68, 68, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertCircle color="#ef4444" size={24} />
              <div>
                <strong style={{ color: '#fff' }}>Connection Warning:</strong>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#fca5a5' }}>
                  {error}. Make sure the FastAPI backend is running at <code style={{ color: '#fff' }}>http://localhost:8000</code>.
                </p>
              </div>
            </div>
            <button onClick={loadData} className="btn-secondary">
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '100px 0',
            gap: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: '3px solid rgba(99, 102, 241, 0.2)',
              borderTopColor: '#6366f1',
              animation: 'spin 0.8s linear infinite'
            }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Loading menu analytics and econometrics models...
            </span>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <OverviewDashboard 
                overview={overview} 
                items={items} 
                matrixData={matrixData} 
                onSelectItem={handleSelectItemAndNavigate} 
              />
            )}

            {activeTab === 'pricing' && (
              <PricingDashboard 
                items={items} 
                selectedItemId={selectedItemId} 
                onSelectItem={setSelectedItemId} 
              />
            )}

            {activeTab === 'chat' && (
              <AIChat onSelectItem={handleSelectItemAndNavigate} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '20px 24px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        marginTop: '40px'
      }}>
        <p>AI Menu Engineering & Pricing Intelligence System • React + FastAPI + FAISS RAG • Linear Demand Regression</p>
      </footer>
    </div>
  );
}
