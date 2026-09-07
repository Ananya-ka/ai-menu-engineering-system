import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  Tooltip, 
  ReferenceLine, 
  Cell 
} from 'recharts';
import { 
  DollarSign, 
  Percent, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  Star, 
  ArrowUpRight,
  HelpCircle,
  Flame,
  CheckCircle2
} from 'lucide-react';

export default function OverviewDashboard({ 
  overview, 
  items, 
  matrixData, 
  onSelectItem 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedQuadrant, setSelectedQuadrant] = useState('All');
  const [sortField, setSortField] = useState('profit');
  const [sortDirection, setSortDirection] = useState('desc');

  // Filter items
  const filteredItems = useMemo(() => {
    const rawSearch = searchQuery.toLowerCase().trim();

    return items.filter(item => {
      // Shorthand keywords for quadrants
      let matchesQuadrantShorthand = false;
      if (rawSearch === 'dogs' || rawSearch === 'dog' || rawSearch.includes('low vol') || rawSearch.includes('low profit')) {
        matchesQuadrantShorthand = item.quadrant === 'Dogs';
      } else if (rawSearch === 'stars' || rawSearch === 'star' || rawSearch.includes('high vol high profit')) {
        matchesQuadrantShorthand = item.quadrant === 'Stars';
      } else if (rawSearch === 'plowhorses' || rawSearch === 'plowhorse' || rawSearch === 'plow horse' || rawSearch.includes('high vol low profit')) {
        matchesQuadrantShorthand = item.quadrant === 'Plowhorses';
      } else if (rawSearch === 'puzzles' || rawSearch === 'puzzle' || rawSearch.includes('low vol high profit')) {
        matchesQuadrantShorthand = item.quadrant === 'Puzzles';
      }

      const matchesText = item.item_name.toLowerCase().includes(rawSearch) ||
                          item.category.toLowerCase().includes(rawSearch) ||
                          item.quadrant.toLowerCase().includes(rawSearch);

      const matchesSearch = !rawSearch || matchesText || matchesQuadrantShorthand;
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesQuadrant = selectedQuadrant === 'All' || item.quadrant === selectedQuadrant;
      return matchesSearch && matchesCategory && matchesQuadrant;
    }).sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? (aVal - bVal) : (bVal - aVal);
    });
  }, [items, searchQuery, selectedCategory, selectedQuadrant, sortField, sortDirection]);

  // Quadrant color mapping
  const getQuadrantColor = (quadrant) => {
    switch(quadrant) {
      case 'Stars': return '#fbbf24';
      case 'Plowhorses': return '#38bdf8';
      case 'Puzzles': return '#a855f7';
      case 'Dogs': return '#f87171';
      default: return '#9ca3af';
    }
  };

  const getQuadrantBadge = (quadrant) => {
    switch(quadrant) {
      case 'Stars': return <span className="badge badge-star">⭐ Stars</span>;
      case 'Plowhorses': return <span className="badge badge-plowhorse">🐎 Plowhorses</span>;
      case 'Puzzles': return <span className="badge badge-puzzle">🧩 Puzzles</span>;
      case 'Dogs': return <span className="badge badge-dog">🐕 Dogs</span>;
      default: return <span className="badge">{quadrant}</span>;
    }
  };

  // Custom BCG Matrix Tooltip
  const CustomMatrixTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #cbd5e1',
          padding: '14px 16px',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 10px 25px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
          color: 'var(--text-primary)',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{data.item_name}</span>
            {getQuadrantBadge(data.quadrant)}
          </div>
          <div style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Category: <strong style={{ color: '#0f172a' }}>{data.category}</strong> | Price: <strong style={{ color: '#16a34a' }}>${data.price.toFixed(2)}</strong>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
            <div>Monthly Volume: <strong>{data.units_sold} units</strong></div>
            <div>Total Profit: <strong style={{ color: '#d97706' }}>${data.profit.toFixed(2)}</strong></div>
            <div>Profit Margin: <strong>{data.profit_margin.toFixed(1)}%</strong></div>
            <div>Prep Time: <strong>{data.prep_time} mins</strong></div>
          </div>
          {data.monthly_profit_lift > 0 && (
            <div style={{ marginTop: '8px', color: '#16a34a', fontSize: '0.8rem', fontWeight: 600 }}>
              🚀 Potential Profit Lift: +${data.monthly_profit_lift.toFixed(2)}/mo
            </div>
          )}
          <div style={{ marginTop: '8px', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 600 }}>
            Click point to open pricing lab →
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* KPI Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '16px'
      }}>
        {/* Card 1: Revenue */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              TOTAL MONTHLY REVENUE
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: '#eef2ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)'
            }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            ${overview?.total_revenue?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>Across <strong>{overview?.total_items}</strong> items & <strong>{overview?.total_categories}</strong> categories</span>
          </div>
        </div>

        {/* Card 2: Average Profit Margin */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              AVG PROFIT MARGIN
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-success)'
            }}>
              <Percent size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#16a34a', letterSpacing: '-0.02em' }}>
            {overview?.avg_profit_margin?.toFixed(1) || '0.0'}%
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>Net Monthly Profit: <strong style={{ color: 'var(--text-primary)' }}>${overview?.total_profit?.toFixed(2)}</strong></span>
          </div>
        </div>

        {/* Card 3: Optimization Opportunity */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              PROFIT LIFT OPPORTUNITY
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706'
            }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#d97706', letterSpacing: '-0.02em' }}>
            +${overview?.total_monthly_profit_lift?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}/mo
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>Derived via Regression & Elasticity modeling</span>
          </div>
        </div>

        {/* Card 4: Bottlenecks & Low Margin */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              OPERATIONAL ALERTS
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-danger)'
            }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#dc2626' }}>
                {overview?.high_prep_bottlenecks_count || 0}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>Long Prep</span>
            </div>
            <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '12px' }}>
              <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#d97706' }}>
                {overview?.low_margin_high_sales_count || 0}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>Low Margin Vol</span>
            </div>
          </div>
          <div style={{ marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Items requiring recipe or price adjustments
          </div>
        </div>
      </div>

      {/* BCG Matrix & Quadrant Breakdown Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 1fr)',
        gap: '20px'
      }}>
        {/* BCG Matrix Chart */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                <span>🎯 Menu Engineering Matrix (BCG Quadrants)</span>
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Interactive classification: Sales Volume (Popularity) vs. Total Profit ($)
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['All', 'Stars', 'Plowhorses', 'Puzzles', 'Dogs'].map(q => (
                <button
                  key={q}
                  onClick={() => setSelectedQuadrant(q)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: '1px solid var(--border-color)',
                    backgroundColor: selectedQuadrant === q ? 'var(--accent-primary)' : '#f8fafc',
                    color: selectedQuadrant === q ? '#ffffff' : 'var(--text-secondary)'
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Recharts Scatter Matrix */}
          <div style={{ height: '380px', width: '100%' }}>
            {matrixData && (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                  <XAxis 
                    type="number" 
                    dataKey="units_sold" 
                    name="Sales Volume" 
                    unit=" units"
                    stroke="#94a3b8"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    label={{ value: 'Sales Volume (Units Sold Last Month) →', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="profit" 
                    name="Total Profit" 
                    unit=" $"
                    stroke="#94a3b8"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    label={{ value: 'Total Profit ($) →', angle: -90, position: 'left', offset: 0, fill: '#64748b', fontSize: 12 }}
                  />
                  <ZAxis type="number" dataKey="price" range={[60, 200]} name="Price" unit=" $" />
                  <Tooltip content={<CustomMatrixTooltip />} />
                  
                  {/* Quadrant Dividers */}
                  <ReferenceLine 
                    x={matrixData.thresholds.popularity} 
                    stroke="rgba(100, 116, 139, 0.35)" 
                    strokeDasharray="4 4" 
                    label={{ value: `60th %ile Vol (${matrixData.thresholds.popularity.toFixed(0)})`, fill: '#64748b', fontSize: 10, position: 'insideTopRight' }}
                  />
                  <ReferenceLine 
                    y={matrixData.thresholds.profitability} 
                    stroke="rgba(100, 116, 139, 0.35)" 
                    strokeDasharray="4 4" 
                    label={{ value: `Median Profit ($${matrixData.thresholds.profitability.toFixed(0)})`, fill: '#64748b', fontSize: 10, position: 'insideTopLeft' }}
                  />

                  <Scatter 
                    data={matrixData.items.filter(d => selectedQuadrant === 'All' || d.quadrant === selectedQuadrant)} 
                    onClick={(data) => onSelectItem(data.item_id)}
                    cursor="pointer"
                  >
                    {matrixData.items.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getQuadrantColor(entry.quadrant)} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quadrant Breakdown & Guide Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Stars */}
          <div className="glass-card" style={{ padding: '14px', borderLeft: '4px solid #fbbf24' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>⭐</span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fbbf24' }}>STARS</span>
              </div>
              <span className="badge badge-star">{matrixData?.quadrant_counts?.Stars || 0} items</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', margin: '4px 0 0 0' }}>
              High Volume + High Profit. Maintain quality and feature prominently.
            </p>
          </div>

          {/* Plowhorses */}
          <div className="glass-card" style={{ padding: '14px', borderLeft: '4px solid #38bdf8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>🐎</span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#38bdf8' }}>PLOWHORSES</span>
              </div>
              <span className="badge badge-plowhorse">{matrixData?.quadrant_counts?.Plowhorses || 0} items</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', margin: '4px 0 0 0' }}>
              High Volume + Low Profit. Raise price modestly or renegotiate ingredient cost.
            </p>
          </div>

          {/* Puzzles */}
          <div className="glass-card" style={{ padding: '14px', borderLeft: '4px solid #a855f7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>🧩</span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#a855f7' }}>PUZZLES</span>
              </div>
              <span className="badge badge-puzzle">{matrixData?.quadrant_counts?.Puzzles || 0} items</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', margin: '4px 0 0 0' }}>
              Low Volume + High Profit. Reposition, highlight via servers, or bundle.
            </p>
          </div>

          {/* Dogs */}
          <div className="glass-card" style={{ padding: '14px', borderLeft: '4px solid #f87171' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>🐕</span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f87171' }}>DOGS</span>
              </div>
              <span className="badge badge-dog">{matrixData?.quadrant_counts?.Dogs || 0} items</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', margin: '4px 0 0 0' }}>
              Low Volume + Low Profit. Consider reformulation, price test, or removal.
            </p>
          </div>
        </div>
      </div>

      {/* Menu Items Explorer Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>📋 Menu Performance & Pricing Catalog</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              Showing {filteredItems.length} of {items.length} items
            </p>
          </div>

          {/* Filters and Search Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 12px'
            }}>
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search dish or type 'dogs', 'stars'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontSize: '0.85rem',
                  width: '230px'
                }}
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-md)',
                padding: '7px 12px',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            >
              <option value="All">All Categories</option>
              {overview?.categories?.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 10px', cursor: 'pointer' }} onClick={() => { setSortField('item_name'); setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); }}>
                  Item Name
                </th>
                <th style={{ padding: '12px 10px' }}>Category</th>
                <th style={{ padding: '12px 10px', cursor: 'pointer', textAlign: 'right' }} onClick={() => { setSortField('price'); setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); }}>
                  Price
                </th>
                <th style={{ padding: '12px 10px', cursor: 'pointer', textAlign: 'right' }} onClick={() => { setSortField('units_sold_last_month'); setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); }}>
                  Monthly Sales
                </th>
                <th style={{ padding: '12px 10px', cursor: 'pointer', textAlign: 'right' }} onClick={() => { setSortField('profit_margin_percent'); setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); }}>
                  Margin %
                </th>
                <th style={{ padding: '12px 10px', cursor: 'pointer', textAlign: 'right' }} onClick={() => { setSortField('profit'); setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); }}>
                  Profit ($)
                </th>
                <th style={{ padding: '12px 10px', textAlign: 'right' }}>Optimal Price</th>
                <th style={{ padding: '12px 10px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr 
                  key={item.item_id}
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.item_name}
                    {item.prep_time_minutes >= 12 && (
                      <span title={`Prep time: ${item.prep_time_minutes} mins`} style={{ marginLeft: '6px', fontSize: '0.75rem', color: '#dc2626' }}>
                        ⏱️
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <span className="badge badge-category">{item.category}</span>
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', fontFamily: 'JetBrains Mono', color: 'var(--text-primary)' }}>
                    ${item.price.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', fontFamily: 'JetBrains Mono', color: 'var(--text-secondary)' }}>
                    {item.units_sold_last_month}
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', fontFamily: 'JetBrains Mono', color: item.profit_margin_percent < 50 ? '#dc2626' : '#16a34a' }}>
                    {item.profit_margin_percent.toFixed(1)}%
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', fontFamily: 'JetBrains Mono', fontWeight: 700, color: '#d97706' }}>
                    ${item.profit.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', fontFamily: 'JetBrains Mono' }}>
                    {item.optimal_price ? (
                      <span style={{ color: item.optimal_price > item.price ? '#16a34a' : '#2563eb', fontWeight: 600 }}>
                        ${item.optimal_price.toFixed(2)}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                    <button
                      onClick={() => onSelectItem(item.item_id)}
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    >
                      <span>Analyze</span>
                      <ArrowUpRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
