import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { 
  fetchItemHistory, 
  simulatePrice 
} from '../services/api';
import { 
  DollarSign, 
  TrendingUp, 
  Sliders, 
  Zap, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  BarChart2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function PricingDashboard({ items, selectedItemId, onSelectItem }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemHistoryData, setItemHistoryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [simulatedPriceVal, setSimulatedPriceVal] = useState(0);
  const [simulationResult, setSimulationResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  // Set selected item on prop change
  useEffect(() => {
    if (items.length > 0) {
      const target = items.find(i => i.item_id === selectedItemId) || items[0];
      setSelectedItem(target);
      loadHistory(target.item_id);
    }
  }, [selectedItemId, items]);

  const loadHistory = async (itemId) => {
    setLoading(true);
    try {
      const data = await fetchItemHistory(itemId);
      setItemHistoryData(data);
      setSimulatedPriceVal(data.current_price);
      // Run initial simulation
      runSimulation(itemId, data.current_price);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = async (itemId, price) => {
    setSimulating(true);
    try {
      const res = await simulatePrice(itemId, price);
      setSimulationResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  const handleSliderChange = (e) => {
    const val = parseFloat(e.target.value);
    setSimulatedPriceVal(val);
    if (selectedItem) {
      runSimulation(selectedItem.item_id, val);
    }
  };

  const handleItemDropdownChange = (e) => {
    const id = parseInt(e.target.value, 10);
    onSelectItem(id);
  };

  if (!selectedItem || !itemHistoryData) {
    return (
      <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading pricing intelligence data...</p>
      </div>
    );
  }

  const priceDiff = itemHistoryData.optimal_price - itemHistoryData.current_price;
  const isElastic = itemHistoryData.price_elasticity > 1.0;

  // Custom tooltips
  const CustomHistoryTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #cbd5e1',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-primary)',
          boxShadow: '0 10px 25px -3px rgba(0,0,0,0.1)',
          fontSize: '0.85rem'
        }}>
          <div style={{ fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>Week {label}</div>
          <div style={{ color: '#0284c7', fontWeight: 600 }}>Price: ${payload[0]?.value?.toFixed(2)}</div>
          {payload[1] && <div style={{ color: '#16a34a', fontWeight: 600, marginTop: '2px' }}>Units Sold: {payload[1]?.value}</div>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header & Selector */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
              Menu Item Econometric Profile
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {itemHistoryData.item_name}
            </h2>
          </div>
          <span className="badge badge-category">{itemHistoryData.category}</span>
          <span className="badge badge-success">COGS: ${itemHistoryData.cogs.toFixed(2)}</span>
        </div>

        {/* Item Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Select Dish:</span>
          <select
            value={selectedItem.item_id}
            onChange={handleItemDropdownChange}
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 14px',
              fontSize: '0.9rem',
              fontWeight: 600,
              outline: 'none',
              minWidth: '220px'
            }}
          >
            {items.map(item => (
              <option key={item.item_id} value={item.item_id}>
                {item.item_name} (${item.price.toFixed(2)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Key Pricing Metrics 4-Card Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px'
      }}>
        {/* Card 1: Current Price */}
        <div className="glass-card" style={{ padding: '18px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            CURRENT MENU PRICE
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            ${itemHistoryData.current_price.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Cost of Goods Sold: ${itemHistoryData.cogs.toFixed(2)}
          </div>
        </div>

        {/* Card 2: Recommended Optimal Price */}
        <div className="glass-card" style={{ padding: '18px', borderLeft: '4px solid #16a34a' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            RECOMMENDED OPTIMAL PRICE
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a' }}>
              ${itemHistoryData.optimal_price.toFixed(2)}
            </span>
            <span className={`badge ${priceDiff >= 0 ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
              {priceDiff >= 0 ? `+$${priceDiff.toFixed(2)}` : `-$${Math.abs(priceDiff).toFixed(2)}`}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Calculated via P* = (α - β*COGS)/(-2β)
          </div>
        </div>

        {/* Card 3: Price Elasticity */}
        <div className="glass-card" style={{ padding: '18px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            PRICE ELASTICITY (E)
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: isElastic ? '#dc2626' : '#0284c7' }}>
              -{itemHistoryData.price_elasticity.toFixed(2)}
            </span>
            <span className={`badge ${isElastic ? 'badge-danger' : 'badge-plowhorse'}`} style={{ fontSize: '0.7rem' }}>
              {isElastic ? 'Elastic (Sensitive)' : 'Inelastic (Insensitive)'}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {isElastic ? 'Price hikes decrease demand significantly' : 'Demand remains stable upon price shifts'}
          </div>
        </div>

        {/* Card 4: Profit Lift */}
        <div className="glass-card" style={{ padding: '18px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            EST. MONTHLY PROFIT LIFT
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
            +${itemHistoryData.monthly_profit_lift.toFixed(2)}/mo
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Incremental gain adopting optimal price
          </div>
        </div>
      </div>

      {/* 52-Week Charts & Demand Regression Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1.2fr)',
        gap: '20px'
      }}>
        {/* Chart 1: 52-Week Time-Series */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <span>📅 52-Week Historical Pricing & Demand Trends</span>
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Weekly price variations vs. observed POS sales volume
          </p>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={itemHistoryData.history} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 10 }} label={{ value: 'Week', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                <YAxis yAxisId="left" stroke="#0284c7" tick={{ fill: '#0284c7', fontSize: 10 }} unit="$" domain={['auto', 'auto']} />
                <YAxis yAxisId="right" orientation="right" stroke="#16a34a" tick={{ fill: '#16a34a', fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip content={<CustomHistoryTooltip />} />
                <Line yAxisId="left" type="monotone" dataKey="price" stroke="#0284c7" strokeWidth={2.5} dot={false} name="Price ($)" />
                <Line yAxisId="right" type="monotone" dataKey="units_sold" stroke="#16a34a" strokeWidth={2.5} dot={false} name="Units Sold" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Demand Curve Scatter + Regression */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                🔬 Demand Curve & Regression Line
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Fitted Formula: <strong style={{ color: '#d97706', fontFamily: 'JetBrains Mono' }}>{itemHistoryData.regression.formula}</strong>
              </p>
            </div>
            <span className="badge badge-category">Slope: {itemHistoryData.regression.slope.toFixed(2)}</span>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" dataKey="price" name="Price" unit="$" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 10 }} domain={['auto', 'auto']} />
                <YAxis type="number" dataKey="units_sold" name="Units" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Actual Sales" data={itemHistoryData.history} fill="#4f46e5" opacity={0.7} />
                <Line 
                  type="monotone" 
                  dataKey="fitted_demand" 
                  data={itemHistoryData.regression_line} 
                  stroke="#dc2626" 
                  strokeWidth={2.5} 
                  dot={false} 
                  name="Fitted Curve"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live "What-If" Elasticity Simulator & Diagnostic Card */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
        gap: '20px'
      }}>
        {/* Interactive Simulator */}
        <div className="glass-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-md)',
              background: '#eef2ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)'
            }}>
              <Sliders size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>🎛️ Live "What-If" Price Elasticity Simulator</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Slide to test hypothetical price points and see instant economic forecasts
              </p>
            </div>
          </div>

          {/* Slider Controls */}
          <div style={{ marginTop: '20px', padding: '18px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Simulated Price Target:</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'JetBrains Mono' }}>
                ${simulatedPriceVal.toFixed(2)}
              </span>
            </div>

            <input
              type="range"
              min={(itemHistoryData.cogs * 1.05).toFixed(2)}
              max={(itemHistoryData.current_price * 2).toFixed(2)}
              step="0.25"
              value={simulatedPriceVal}
              onChange={handleSliderChange}
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                background: 'linear-gradient(90deg, #4f46e5, #0284c7)',
                outline: 'none',
                cursor: 'pointer'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              <span>Min Margin: ${(itemHistoryData.cogs * 1.05).toFixed(2)}</span>
              <button 
                onClick={() => {
                  setSimulatedPriceVal(itemHistoryData.optimal_price);
                  runSimulation(itemHistoryData.item_id, itemHistoryData.optimal_price);
                }}
                className="btn-secondary"
                style={{ padding: '2px 8px', fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 }}
              >
                Set to Optimal (${itemHistoryData.optimal_price.toFixed(2)})
              </button>
              <span>Max Test: ${(itemHistoryData.current_price * 2).toFixed(2)}</span>
            </div>
          </div>

          {/* Simulation Output Metrics */}
          {simulationResult && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginTop: '16px'
            }}>
              {/* Output 1: Weekly Demand */}
              <div style={{ padding: '14px', background: '#ffffff', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Predicted Weekly Units</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {simulationResult.simulated_units}
                </div>
                <span style={{ fontSize: '0.72rem', color: simulationResult.units_delta_pct >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                  {simulationResult.units_delta_pct >= 0 ? '+' : ''}{simulationResult.units_delta_pct}% vs current
                </span>
              </div>

              {/* Output 2: Weekly Revenue */}
              <div style={{ padding: '14px', background: '#ffffff', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Weekly Revenue</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0284c7', marginTop: '2px' }}>
                  ${simulationResult.simulated_revenue.toFixed(2)}
                </div>
                <span style={{ fontSize: '0.72rem', color: simulationResult.revenue_delta_pct >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                  {simulationResult.revenue_delta_pct >= 0 ? '+' : ''}{simulationResult.revenue_delta_pct}%
                </span>
              </div>

              {/* Output 3: Weekly Profit */}
              <div style={{ padding: '14px', background: '#ffffff', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Weekly Net Profit</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#d97706', marginTop: '2px' }}>
                  ${simulationResult.simulated_profit.toFixed(2)}
                </div>
                <span style={{ fontSize: '0.72rem', color: simulationResult.profit_delta >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                  {simulationResult.profit_delta >= 0 ? `+$${simulationResult.profit_delta.toFixed(2)}` : `-$${Math.abs(simulationResult.profit_delta).toFixed(2)}`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Diagnosis & Actionable Strategy */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>📌 Strategy & Diagnostics</h3>
              <span className={`badge ${
                itemHistoryData.pricing_strategy === 'Increase Price' ? 'badge-success' :
                itemHistoryData.pricing_strategy === 'Decrease Price' ? 'badge-warning' : 'badge-category'
              }`}>
                Action: {itemHistoryData.pricing_strategy}
              </span>
            </div>

            <div style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#f8fafc',
              borderLeft: `4px solid ${
                itemHistoryData.pricing_strategy === 'Increase Price' ? '#16a34a' :
                itemHistoryData.pricing_strategy === 'Decrease Price' ? '#d97706' : '#0284c7'
              }`,
              border: '1px solid #e2e8f0',
              borderLeftWidth: '4px',
              marginBottom: '16px'
            }}>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-primary)', margin: 0 }}>
                {itemHistoryData.pricing_recommendation}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span>Price Volatility Index:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{itemHistoryData.price_volatility_pct.toFixed(1)}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span>Recent 12-Week Sales Trend:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{itemHistoryData.sales_trend_label}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span>Model Regression Alpha (Intercept):</span>
                <strong style={{ color: 'var(--text-primary)' }}>{itemHistoryData.regression.intercept.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Model Regression Beta (Slope):</span>
                <strong style={{ color: 'var(--text-primary)' }}>{itemHistoryData.regression.slope.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
