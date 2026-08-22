import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from 'recharts'
import { formatCompactNumber } from '../utils/formatters'
import { CustomTooltip } from './CustomTooltip'
const CATEGORY_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"]

export const DistributionChartsGrid = React.memo(({
  formatMultiSeriesChartData,
  data,
  selectedCompanies,
  getCompanyColor
}) => {
  const chartKeys = ["Fuel", "Status", "Class"]

  const processedData = React.useMemo(() => {
    const result = {}
    
    chartKeys.forEach(key => {
      const chartData = formatMultiSeriesChartData(key)
      
      if (key === "Status" && chartData.length > 0) {
        const stackedData = selectedCompanies.map(company => {
          const compliantObj = chartData.find(d => d.name === "ACTIVE_COMPLIANT")
          const nonCompliantObj = chartData.find(d => d.name === "ACTIVE_NON_COMPLIANT")
          return {
            name: company.split(' ')[0], 
            originalCompany: company,
            "ACTIVE_COMPLIANT": compliantObj ? (compliantObj[company] || 0) : 0,
            "ACTIVE_NON_COMPLIANT": nonCompliantObj ? (nonCompliantObj[company] || 0) : 0
          }
        })
        result[key] = { chartData, stackedData }
      } 
      else if (key === "Fuel" && chartData.length > 0) {
        const categories = chartData.map(d => d.name)
        const stackedData100 = selectedCompanies.map(company => {
          const obj = { name: company.split(' ')[0], originalCompany: company }
          let total = 0
          categories.forEach(cat => {
            const categoryData = chartData.find(d => d.name === cat)
            total += categoryData ? (categoryData[company] || 0) : 0
          })
          categories.forEach(cat => {
            const categoryData = chartData.find(d => d.name === cat)
            const val = categoryData ? (categoryData[company] || 0) : 0
            const pct = total > 0 ? (val / total) * 100 : 0
            obj[cat] = parseFloat(pct.toFixed(1))
            obj[`${cat}_raw`] = val
          })
          return obj
        })
        result[key] = { chartData, stackedData100, categories }
      }
      else {
        result[key] = { chartData }
      }
    })
    
    return result
  }, [data, selectedCompanies, formatMultiSeriesChartData])

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.75rem', marginTop: '2rem' }}>
      {chartKeys.map(key => {
        const config = processedData[key] || { chartData: [] }
        const chartData = config.chartData
        const isClass = key === 'Class'
        
        if (chartData.length === 0) {
          return (
            <div key={key} className="card" style={{ flex: isClass ? '1 1 100%' : '1 1 400px', minWidth: '340px' }}>
              <h2>{key} Breakdown</h2>
              <div className="data-error" style={{ color: '#94a3b8', background: 'transparent' }}>No Chart Data Available</div>
            </div>
          )
        }

        // --- STATUS CHART LOGIC (Absolute Stacked Bar) ---
        if (key === "Status") {
          return (
            <div key={key} className="card" style={{ flex: isClass ? '1 1 100%' : '1 1 400px', minWidth: '340px' }}>
              <h2>{key} (Compliant vs Non-Compliant)</h2>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={config.stackedData} layout="vertical" margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  <XAxis type="number" stroke="var(--text-muted)" tick={{ fontSize: 11 }} tickFormatter={formatCompactNumber} />
                  <YAxis type="category" dataKey="name" stroke="var(--text-muted)" width={70} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    cursor={{ fill: 'var(--table-hover)' }} 
                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-main)' }} 
                  />
                  <Legend verticalAlign="top" wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }} />
                  <Bar dataKey="ACTIVE_COMPLIANT" name="Compliant" stackId="status" fill="#10b981" />
                  <Bar dataKey="ACTIVE_NON_COMPLIANT" name="Non-Compliant" stackId="status" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )
        }

        // --- CLASS CHART LOGIC (Standard Grouped Bar) ---
        if (key === "Class") {
          return (
            <div key={key} className="card" style={{ flex: isClass ? '1 1 100%' : '1 1 400px', minWidth: '340px' }}>
              <h2>{key} Breakdown</h2>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 85 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 11 }} interval={0} angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="var(--text-muted)" width={45} tick={{ fontSize: 11 }} tickFormatter={formatCompactNumber} />
                  <Tooltip cursor={{ fill: 'var(--table-hover)' }} content={<CustomTooltip baseCompany={selectedCompanies[0]} />} />
                  <Legend formatter={(value) => value.split(' ')[0]} verticalAlign="top" wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }} />
                  {selectedCompanies.map(company => (
                    <Bar
                      key={company}
                      dataKey={company}
                      name={company}
                      fill={getCompanyColor(company) || '#10b981'}
                      radius={[4, 4, 0, 0]}
                      minPointSize={3}
                      isAnimationActive={false}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )
        }

        // --- FUEL CHART LOGIC (100% Stacked Bar) ---
        return (
          <div key={key} className="card" style={{ flex: isClass ? '1 1 100%' : '1 1 400px', minWidth: '340px' }}>
            <h2>{key} Portfolio Breakdown (100%)</h2>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={config.stackedData100} margin={{ top: 20, right: 30, left: 10, bottom: 85 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 11 }} interval={0} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="var(--text-muted)" width={45} tick={{ fontSize: 11 }} tickFormatter={(val) => `${val}%`} />
                <Tooltip 
                  cursor={{ fill: 'var(--table-hover)' }} 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-main)' }}
                  formatter={(value, name, props) => {
                    const rawVal = props.payload[`${name}_raw`]
                    return [`${value}% (${rawVal?.toLocaleString()} veh.)`, name]
                  }}
                />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }} />
                {config.categories.map((cat, idx) => (
                  <Bar
                    key={cat}
                    dataKey={cat}
                    name={cat}
                    stackId="100"
                    fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
      })}
    </div>
  )
})
