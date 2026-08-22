import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { formatAxisLabel, formatCompactNumber } from '../utils/formatters'

export const Top5TerritoriesSection = React.memo(({
  rtoCode,
  selectedCities,
  stateCode,
  selectedCompanies,
  companyDrilldown,
  handleCompanyBarClick,
  resetCompanyDrilldown,
  formatMultiSeriesChartData,
  data,
  getCompanyColor
}) => {
  if (rtoCode && rtoCode.toString() !== "0") {
    return null
  }

  const titleText = selectedCities && selectedCities.length > 0 ? `Top 5 RTOs in ${selectedCities.join(', ')} (Per Brand)` : `Top 5 Territories (Per Brand)`

  return (
    <div className="card full-width" style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
        <div>
          <h2 style={{ color: 'var(--heading-color)', marginBottom: '0.2rem' }}>{titleText}</h2>
          {(!selectedCities || selectedCities.length === 0) && !stateCode && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>💡 Click on any state bar in a brand's chart to view its Top RTOs individually!</p>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(max(260px, 30%), 1fr))', gap: '1.25rem' }}>
        {selectedCompanies.map(company => {
          const isDrilledDown = !!companyDrilldown[company]
          const drilldownInfo = companyDrilldown[company]

          let top5ForCompany = []

          if (isDrilledDown) {
            top5ForCompany = drilldownInfo.data
          } else {
            const rawTop5 = formatMultiSeriesChartData("Top 5 (State/RTO)")
            top5ForCompany = rawTop5.map(item => ({
              name: item.name,
              value: item[company] || 0
            })).sort((a, b) => b.value - a.value).slice(0, 5)
          }

          const cardTitle = isDrilledDown
            ? `${company.split(' ')[0]} (RTOs in ${drilldownInfo.stateName})`
            : `${company.split(' ')[0]} (${stateCode ? "Top 5 RTOs" : "Top 5 States"})`

          return (
            <div key={company} style={{ background: 'var(--bg-card)', border: `1px solid ${getCompanyColor(company)}40`, borderRadius: '12px', padding: '1rem', boxShadow: 'var(--card-shadow)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', color: getCompanyColor(company), margin: 0 }}>
                  {cardTitle}
                </h3>
                {isDrilledDown && (
                  <button
                    onClick={() => resetCompanyDrilldown(company)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid #ef4444',
                      color: '#ef4444',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    ← Back
                  </button>
                )}
              </div>

              {drilldownInfo?.loading ? (
                <div style={{ height: '210px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Loading Top RTOs for {company}...
                </div>
              ) : top5ForCompany.length === 0 ? (
                <div style={{ height: '210px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No Data Available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart
                    data={top5ForCompany}
                    margin={{ top: 15, right: 10, left: 0, bottom: 65 }}
                    onClick={(clickData) => !isDrilledDown && handleCompanyBarClick(company, clickData)}
                    style={{ cursor: !isDrilledDown && !stateCode ? 'pointer' : 'default' }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                    <XAxis
                      dataKey="name"
                      stroke="var(--text-muted)"
                      tick={{ fontSize: 9 }}
                      tickFormatter={formatAxisLabel}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis stroke="var(--text-muted)" width={35} tick={{ fontSize: 10 }} tickFormatter={formatCompactNumber} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--dropdown-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--dropdown-text)' }} 
                      formatter={(value) => [value.toLocaleString(), 'Vehicles']}
                    />
                    <Bar
                      dataKey="value"
                      name={company}
                      fill={getCompanyColor(company)}
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={false}
                      onClick={(clickData) => !isDrilledDown && handleCompanyBarClick(company, clickData)}
                      style={{ cursor: !isDrilledDown && !stateCode ? 'pointer' : 'default' }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
})
