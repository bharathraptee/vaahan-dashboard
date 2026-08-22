import React, { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from 'recharts'
import { CustomTooltip } from './CustomTooltip'
import { formatCompactNumber } from '../utils/formatters'

export const YearlyTrendChart = React.memo(({ chartData, selectedCompanies, getCompanyColor }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })

  if (!chartData || chartData.length === 0) {
    return (
      <div className="card full-width" style={{ marginTop: '1.5rem' }}>
        <h2>Yearly Trend</h2>
        <div className="data-error" style={{ color: '#94a3b8', background: 'transparent' }}>No Chart Data Available</div>
      </div>
    )
  }

  const handleSort = (key) => {
    let direction = 'desc'
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc'
    }
    setSortConfig({ key, direction })
  }

  const sortedData = [...chartData].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="card full-width yearly-trend-card" style={{ marginTop: '1.5rem' }}>
      <h2>Yearly Trend</h2>
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
          <YAxis stroke="#94a3b8" width={60} tick={{ fontSize: 12 }} tickFormatter={formatCompactNumber} />
          <Tooltip content={<CustomTooltip baseCompany={selectedCompanies[0]} />} />
          <Legend verticalAlign="top" wrapperStyle={{ fontSize: '12px', paddingBottom: '15px' }} />
          {selectedCompanies.map(company => (
            <Line
              key={company}
              type="monotone"
              dataKey={company}
              stroke={getCompanyColor(company) || '#fff'}
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Yearly Data Table & Total Row */}
      <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--heading-color)', marginBottom: '1rem' }}>Yearly Breakdown Data Table</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                  Year {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                {selectedCompanies.map(c => (
                  <th key={c} onClick={() => handleSort(c)} style={{ color: getCompanyColor(c), cursor: 'pointer' }}>
                    {c} {sortConfig.key === c ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map(row => {
                // For heatmap calculation per row
                const vals = selectedCompanies.map(c => row[c] || 0)
                const maxVal = Math.max(...vals)
                
                return (
                  <tr key={row.name}>
                    <td style={{ fontWeight: 500 }}>{row.name}</td>
                    {selectedCompanies.map(c => {
                      const val = row[c] || 0
                      const intensity = maxVal > 0 ? (val / maxVal) * 0.15 : 0; // max 15% opacity
                      return (
                        <td key={c} style={{ color: getCompanyColor(c), backgroundColor: `rgba(52, 211, 153, ${intensity})` }}>
                          {val.toLocaleString()}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 'bold', background: 'var(--table-footer-bg)', borderTop: '2px solid var(--accent)' }}>
                <td style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>Total</td>
                {selectedCompanies.map(c => {
                  const sum = chartData.reduce((acc, row) => acc + (row[c] || 0), 0)
                  return (
                    <td key={c} style={{ color: getCompanyColor(c), fontSize: '1rem', fontWeight: 700 }}>
                      {sum.toLocaleString()}
                    </td>
                  )
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
})
