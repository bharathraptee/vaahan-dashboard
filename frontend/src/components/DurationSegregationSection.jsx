import React, { useState } from 'react'
import { extractAvailableYears } from '../utils/formatters'

export const DurationSegregationSection = React.memo(({
  apiData,
  selectedCompanies,
  timeFilter,
  fromYear,
  toYear,
  durationTableYear,
  setDurationTableYear,
  getCompanyColor
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  if (!apiData) return null

  const monthMap = {}
  const order = [] // To preserve API order
  selectedCompanies.forEach(company => {
    const compData = apiData[company]?.["Month Wise (Duration)"]
    if (Array.isArray(compData)) {
      compData.forEach(row => {
        const monthKey = row.yearAsString || row.year
        if (!monthMap[monthKey]) {
          monthMap[monthKey] = { monthKey }
          order.push(monthKey)
        }
        monthMap[monthKey][company] = row.registeredVehicleCount || 0
      })
    }
  })
  
  let rows = order.map(k => monthMap[k])
  if (timeFilter === "Calendar Year") {
     const fY = parseInt(fromYear)
     const tY = parseInt(toYear)
     rows = rows.filter(row => {
       const yearMatch = row.monthKey.match(/^(\d{4})/)
       if (yearMatch) {
         const y = parseInt(yearMatch[1])
         return y >= fY && y <= tY
       }
       return true
     })
  }

  if (rows.length === 0) {
    return (
      <div className="detailed-section" style={{ marginTop: '2rem' }}>
        <h2>Detailed Data Segregation (Duration Wise)</h2>
        <div className="card full-width">
          <div className="table-container">
            <table className="data-table"><tbody><tr><td>No Data</td></tr></tbody></table>
          </div>
        </div>
      </div>
    )
  }

  // Extract unique years available in the data for the dropdown
  const sortedYears = extractAvailableYears(rows.map(r => r.monthKey))
  const availableYears = new Set(sortedYears)
  
  let currentTableYear = durationTableYear
  if (!currentTableYear || !availableYears.has(currentTableYear)) {
    currentTableYear = sortedYears[0]
  }

  React.useEffect(() => {
    if (durationTableYear !== currentTableYear && currentTableYear) {
      setDurationTableYear(currentTableYear)
    }
  }, [currentTableYear, durationTableYear, setDurationTableYear])
  
  const MONTH_ORDER = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  
  let finalRows = rows.filter(row => row.monthKey.startsWith(currentTableYear))
  
  // Always sort finalRows chronologically for the columns
  finalRows.sort((a, b) => {
    const monthA = a.monthKey.includes('-') ? a.monthKey.split('-')[1] : a.monthKey
    const monthB = b.monthKey.includes('-') ? b.monthKey.split('-')[1] : b.monthKey
    return MONTH_ORDER.indexOf(monthA) - MONTH_ORDER.indexOf(monthB)
  })

  const handleSort = (key) => {
    let direction = 'desc'
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc'
    }
    setSortConfig({ key, direction })
  }

  const sortedCompanies = [...selectedCompanies]

  if (sortConfig.key) {
    sortedCompanies.sort((a, b) => {
      if (sortConfig.key === 'company') {
        return sortConfig.direction === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
      } else if (sortConfig.key === 'total') {
        const valA = finalRows.reduce((acc, r) => acc + (r[a] || 0), 0)
        const valB = finalRows.reduce((acc, r) => acc + (r[b] || 0), 0)
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA
      } else {
        const monthRow = finalRows.find(r => (r.monthKey.includes('-') ? r.monthKey.split('-')[1] : r.monthKey) === sortConfig.key)
        const valA = monthRow ? (monthRow[a] || 0) : 0
        const valB = monthRow ? (monthRow[b] || 0) : 0
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA
      }
    })
  }

  return (
    <div className="detailed-section" style={{ marginTop: '2rem' }}>
      <h2>Detailed Data Segregation (Duration Wise)</h2>
      <div className="card full-width">
        <div className="table-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ marginRight: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>Filter Month Data by Year:</label>
            <select 
              value={currentTableYear} 
              onChange={(e) => setDurationTableYear(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '4px', background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--input-border)', cursor: 'pointer' }}
            >
              {sortedYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('company')} style={{ cursor: 'pointer', padding: '0.6rem 0.5rem', fontSize: '0.75rem', width: '140px' }}>
                  Company {sortConfig.key === 'company' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                {finalRows.map(row => {
                  const monthOnly = row.monthKey.includes('-') ? row.monthKey.split('-')[1] : row.monthKey
                  return (
                    <th key={row.monthKey} onClick={() => handleSort(monthOnly)} style={{ cursor: 'pointer', padding: '0.6rem 0.5rem', fontSize: '0.75rem', textAlign: 'center' }}>
                      {monthOnly.substring(0, 3).toUpperCase()} {sortConfig.key === monthOnly ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </th>
                  )
                })}
                <th onClick={() => handleSort('total')} style={{ cursor: 'pointer', padding: '0.6rem 0.5rem', fontSize: '0.75rem', textAlign: 'center' }}>
                  Total {sortConfig.key === 'total' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedCompanies.length === 0 ? (
                <tr><td colSpan={finalRows.length + 2}>No Data</td></tr>
              ) : (
                sortedCompanies.map((company, idx) => {
                  return (
                    <tr key={company}>
                      <td style={{ fontWeight: 500, color: getCompanyColor(company), padding: '0.6rem 0.5rem', fontSize: '0.8rem', whiteSpace: 'normal', wordWrap: 'break-word', lineHeight: '1.2' }}>{company}</td>
                      {finalRows.map(row => {
                        const val = row[company] || 0
                        const maxForMonth = Math.max(...selectedCompanies.map(c => row[c] || 0))
                        const intensity = maxForMonth > 0 ? (val / maxForMonth) * 0.15 : 0;
                        return (
                          <td key={row.monthKey} style={{ color: getCompanyColor(company), backgroundColor: `rgba(52, 211, 153, ${intensity})`, padding: '0.6rem 0.5rem', fontSize: '0.8rem', textAlign: 'center' }}>
                            {val.toLocaleString()}
                          </td>
                        )
                      })}
                      <td style={{ color: getCompanyColor(company), fontWeight: 700, padding: '0.6rem 0.5rem', fontSize: '0.8rem', textAlign: 'center' }}>
                        {finalRows.reduce((acc, r) => acc + (r[company] || 0), 0).toLocaleString()}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 'bold', background: 'var(--table-footer-bg)', borderTop: '2px solid var(--accent)' }}>
                <td style={{ color: 'var(--text-main)', fontSize: '0.85rem', padding: '0.6rem 0.5rem' }}>Total</td>
                {finalRows.map(row => {
                   const sum = selectedCompanies.reduce((acc, c) => acc + (row[c] || 0), 0)
                   return <td key={row.monthKey} style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 700, padding: '0.6rem 0.5rem', textAlign: 'center' }}>{sum.toLocaleString()}</td>
                })}
                <td style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 700, padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                  {finalRows.reduce((acc, r) => acc + selectedCompanies.reduce((sum, c) => sum + (r[c] || 0), 0), 0).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
})
