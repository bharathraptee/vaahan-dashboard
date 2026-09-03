import React, { useState, useMemo, useEffect } from 'react'
import { extractAvailableYears } from '../utils/formatters'

const MONTH_ORDER = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

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
  // 1. ALL HOOKS UNCONDITIONALLY AT THE TOP
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  // Extract unique months safely
  const allMonths = useMemo(() => {
    if (!cityRtoData) return new Set()
    const months = new Set()
    Object.values(cityRtoData).forEach(companyData => {
      Object.values(companyData).forEach(dataArr => {
        if (Array.isArray(dataArr)) {
          dataArr.forEach(row => {
            const m = row.yearAsString || row.year
            if (m) months.add(m)
          })
        }
      })
    })
    return months
  }, [cityRtoData])

  // Determine available years
  const sortedYears = useMemo(() => {
    return extractAvailableYears(Array.from(allMonths))
  }, [allMonths])

  let currentTableYear = cityRtoTableYear
  if (!currentTableYear || !sortedYears.includes(currentTableYear)) {
    currentTableYear = sortedYears[0] || ""
  }

  // Hook 1: Sync table year
  useEffect(() => {
    if (currentTableYear && cityRtoTableYear !== currentTableYear) {
      setCityRtoTableYear(currentTableYear)
    }
  }, [currentTableYear, cityRtoTableYear, setCityRtoTableYear])

  // Determine available months for selected year
  const monthsForYear = useMemo(() => {
    if (!currentTableYear) return []
    return Array.from(allMonths)
      .filter(m => m.startsWith(currentTableYear))
      .map(m => m.includes('-') ? m.split('-')[1] : m)
      .sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b))
  }, [allMonths, currentTableYear])

  let currentMonth = cityRtoMonthFilter
  if (!currentMonth || !monthsForYear.includes(currentMonth)) {
    currentMonth = monthsForYear[0] || ""
  }

  // Hook 2: Sync month filter
  useEffect(() => {
    if (currentMonth && cityRtoMonthFilter !== currentMonth) {
      setCityRtoMonthFilter(currentMonth)
    }
  }, [currentMonth, cityRtoMonthFilter, setCityRtoMonthFilter])

  // 2. EARLY RETURNS STRICTLY AFTER ALL HOOKS
  if (!cityRtoData && !loadingCityRto) return null

  if (loadingCityRto) {
    return (
      <div className="card full-width" style={{ marginTop: '20px', padding: '30px', textAlign: 'center' }}>
        <div className="loading" style={{ margin: 0 }}>Fetching deep RTO breakdown (this takes a few seconds to bypass Vahan security)...</div>
      </div>
    )
  }

  // 3. TABLE LOGIC & RENDERING
  const rtoNames = Object.keys(cityRtoData || {})

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
    if (!sortConfig.key) return 0
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
                style={{ padding: '6px 10px', borderRadius: '4px', background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--input-border)', cursor: 'pointer', minWidth: '110px' }}
              >
                {monthsForYear.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th onClick={() => handleSort('rto')} style={{ cursor: 'pointer' }}>
                    RTO Office {sortConfig.key === 'rto' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  {selectedCompanies.map(c => (
                    <th 
                      key={c} 
                      onClick={() => handleSort(c)}
                      style={{ color: getCompanyColor(c), cursor: 'pointer' }}
                    >
                      {c} {sortConfig.key === c && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRtoNames.length === 0 ? (
                  <tr><td colSpan={selectedCompanies.length + 1} style={{ textAlign: 'center', color: '#94a3b8' }}>No data for selected period</td></tr>
                ) : (
                  sortedRtoNames.map(rto => (
                    <tr key={rto}>
                      <td style={{ fontWeight: 'bold' }}>{rto}</td>
                      {selectedCompanies.map(c => (
                        <td key={c} style={{ textAlign: 'right' }}>
                          {getCompanyCount(rto, c).toLocaleString()}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
})
