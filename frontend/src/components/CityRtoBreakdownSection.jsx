import React, { useState } from 'react'
import { extractAvailableYears } from '../utils/formatters'

export const CityRtoBreakdownSection = React.memo(({
  cityRtoData,
  loadingCityRto,
  selectedCities,
  selectedCompanies,
  cityRtoTableYear,
  setCityRtoTableYear,
  cityRtoMonthFilter,
  setCityRtoMonthFilter,
  getCompanyColor
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  if (!cityRtoData && !loadingCityRto) return null

  if (loadingCityRto) {
    return (
      <div className="card full-width" style={{ marginTop: '20px', padding: '30px', textAlign: 'center' }}>
        <div className="loading" style={{ margin: 0 }}>Fetching deep RTO breakdown (this takes a few seconds to bypass Vahan security)...</div>
      </div>
    )
  }

  // Extract all unique months
  const allMonths = new Set()
  Object.values(cityRtoData).forEach(companyData => {
    Object.values(companyData).forEach(dataArr => {
      if (Array.isArray(dataArr)) {
        dataArr.forEach(row => {
          const m = row.yearAsString || row.year
          if (m) allMonths.add(m)
        })
      }
    })
  })

  // Determine available years
  const sortedYears = extractAvailableYears(Array.from(allMonths))
  const availableYears = new Set(sortedYears)
  
  let currentTableYear = cityRtoTableYear
  if (!currentTableYear || !availableYears.has(currentTableYear)) {
    currentTableYear = sortedYears[0]
  }

  React.useEffect(() => {
    if (cityRtoTableYear !== currentTableYear && currentTableYear) {
      setCityRtoTableYear(currentTableYear)
    }
  }, [currentTableYear, cityRtoTableYear, setCityRtoTableYear])

  const MONTH_ORDER = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

  const monthsForYear = Array.from(allMonths)
    .filter(m => m.startsWith(currentTableYear))
    .map(m => m.includes('-') ? m.split('-')[1] : m)
    .sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b))
  
  let currentMonth = cityRtoMonthFilter
  if (!currentMonth || !monthsForYear.includes(currentMonth)) {
     currentMonth = monthsForYear[0]
  }

  React.useEffect(() => {
    if (cityRtoMonthFilter !== currentMonth && currentMonth) {
      setCityRtoMonthFilter(currentMonth)
    }
  }, [currentMonth, cityRtoMonthFilter, setCityRtoMonthFilter])

  const rtoNames = Object.keys(cityRtoData)

  const handleSort = (key) => {
    let direction = 'desc'
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc'
    }
    setSortConfig({ key, direction })
  }

  const getCompanyCount = (rto, c) => {
    const compArr = cityRtoData[rto]?.[c]
    let count = 0
    if (Array.isArray(compArr)) {
      const searchStr = `${currentTableYear}-${currentMonth}`
      const match = compArr.find(x => (x.yearAsString || x.year) === searchStr)
      if (match) count = match.registeredVehicleCount || 0
    }
    return count
  }

  const sortedRtoNames = [...rtoNames].sort((a, b) => {
    if (!sortConfig.key) return 0;
    if (sortConfig.key === 'rto') {
      return sortConfig.direction === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
    } else {
      const valA = getCompanyCount(a, sortConfig.key)
      const valB = getCompanyCount(b, sortConfig.key)
      return sortConfig.direction === 'asc' ? valA - valB : valB - valA
    }
  })

  return (
    <div className="detailed-section" style={{ marginTop: '2rem' }}>
      <h2>Area RTO Breakdown (for {selectedCities?.join(', ')})</h2>
      <div className="card full-width">
        <div className="table-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '8px', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ marginRight: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>Select Year:</label>
              <select 
                value={currentTableYear} 
                onChange={(e) => setCityRtoTableYear(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '4px', background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--input-border)', cursor: 'pointer', minWidth: '80px' }}
              >
                {sortedYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ marginRight: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>Select Month:</label>
              <select 
                value={currentMonth} 
                onChange={(e) => setCityRtoMonthFilter(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '4px', background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--input-border)', cursor: 'pointer', minWidth: '120px' }}
              >
                {monthsForYear.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('rto')} style={{ cursor: 'pointer' }}>
                  RTO Name {sortConfig.key === 'rto' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                {selectedCompanies.map(c => (
                  <th key={c} onClick={() => handleSort(c)} style={{ color: getCompanyColor(c), cursor: 'pointer' }}>
                    {c} {sortConfig.key === c ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRtoNames.map((rto, idx) => {
                 const vals = selectedCompanies.map(c => getCompanyCount(rto, c))
                 const maxVal = Math.max(...vals)

                 return (
                   <tr key={idx}>
                     <td style={{ fontWeight: 500 }}>{rto}</td>
                     {selectedCompanies.map(c => {
                        const count = getCompanyCount(rto, c)
                        const intensity = maxVal > 0 ? (count / maxVal) * 0.15 : 0;
                        return (
                          <td key={c} style={{ color: getCompanyColor(c), backgroundColor: `rgba(52, 211, 153, ${intensity})` }}>
                            {count.toLocaleString()}
                          </td>
                        )
                     })}
                   </tr>
                 )
              })}
            </tbody>
            {rtoNames.length > 0 && (
              <tfoot>
                <tr style={{ fontWeight: 'bold', background: 'var(--table-footer-bg)', borderTop: '2px solid var(--accent)' }}>
                  <td style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>Total</td>
                  {selectedCompanies.map(c => {
                     const sum = rtoNames.reduce((acc, rto) => acc + getCompanyCount(rto, c), 0)
                     return <td key={c} style={{ color: getCompanyColor(c), fontSize: '1rem', fontWeight: 700 }}>{sum.toLocaleString()}</td>
                  })}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
})
