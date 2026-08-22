import React from 'react'

export const KpiMetricsSection = ({ selectedCompanies, selectedCities, cityRtoData, data, getCompanyColor }) => {
  if (!selectedCompanies || selectedCompanies.length === 0) return null

  return (
    <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
      {selectedCompanies.map(company => {
        let countDisplay = "0"
        if (selectedCities && selectedCities.length > 0 && cityRtoData) {
          let citySum = 0
          Object.keys(cityRtoData).forEach(rtoName => {
            const compArr = cityRtoData[rtoName]?.[company]
            if (Array.isArray(compArr)) {
              citySum += compArr.reduce((acc, row) => acc + (row.registeredVehicleCount || 0), 0)
            }
          })
          countDisplay = citySum.toLocaleString()
        } else {
          const rawVal = data?.[company]?.["Dashboard Count"]?.totalTransactions
          countDisplay = rawVal ? parseInt(String(rawVal).replace(/,/g, '')).toLocaleString() : "0"
        }

        return (
          <div key={company} className="card stat-card" style={{ borderTop: `4px solid ${getCompanyColor(company)}` }}>
            <h2 style={{ color: getCompanyColor(company), fontSize: '0.95rem', fontWeight: 700, borderBottom: 'none', marginBottom: '0.5rem' }}>{company}</h2>
            <div className="big-stat" style={{ fontSize: '2.5rem', background: 'none', color: getCompanyColor(company), WebkitTextFillColor: 'initial' }}>
              {countDisplay}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {selectedCities && selectedCities.length > 0 ? `Total in ${selectedCities.join(', ')}` : 'Total Registrations'}
            </div>
          </div>
        )
      })}
    </div>
  )
}
