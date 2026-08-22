import React from 'react'
import { STATES } from '../constants/states'

export const MultiCityComparisonSection = React.memo(({
  multiCityStateCode,
  handleMultiCityStateChange,
  multiCityAvailableCities,
  multiCitySearchInput,
  setMultiCitySearchInput,
  loadingMultiCityRtos,
  isMultiCityDropdownOpen,
  setIsMultiCityDropdownOpen,
  toggleMultiCity,
  removeMultiCity,
  selectedMultiCities,
  loadingMultiCity,
  loadingMultiCityStatus,
  multiCityData,
  fetchMultiCityComparisonData,
  selectedCompanies,
  getCompanyColor
}) => {
  const filteredCityList = multiCityAvailableCities.filter(c => 
    c.toLowerCase().includes(multiCitySearchInput.toLowerCase()) && 
    !selectedMultiCities.includes(c)
  )

  const rtoNames = multiCityData ? Object.keys(multiCityData) : []
  const selectedStateObj = STATES.find(s => s.code === multiCityStateCode)

  return (
    <div className="card full-width" style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ color: 'var(--heading-color)', marginBottom: '0.25rem' }}>Multi-Area RTO Comparison</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Select a state and pick up to 5 areas to compare RTO volumes side-by-side (Independent filter)</p>
        </div>
      </div>

      {/* Local Independent Selectors Container */}
      <div style={{ marginBottom: '1.5rem', background: 'var(--table-header-bg)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {/* Independent Local State Dropdown */}
          <div style={{ flex: '1', minWidth: '220px', maxWidth: '300px' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
              1. Select State:
            </label>
            <select
              value={multiCityStateCode}
              onChange={(e) => handleMultiCityStateChange(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '0.9rem' }}
            >
              <option value="">-- Choose State --</option>
              {STATES.filter(s => s.code).map(s => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Independent City Selector */}
          <div style={{ flex: '2', minWidth: '280px' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
              2. Select Areas in {selectedStateObj ? selectedStateObj.name : "State"}:
            </label>
            <div style={{ position: 'relative', width: '100%', marginBottom: '0.5rem' }}>
              <input
                type="text"
                placeholder={!multiCityStateCode ? "Select a State above first..." : "Search & add areas (e.g. CHENNAI, COIMBATORE)..."}
                value={multiCitySearchInput}
                disabled={!multiCityStateCode || loadingMultiCityRtos}
                onChange={(e) => setMultiCitySearchInput(e.target.value)}
                onFocus={() => setIsMultiCityDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsMultiCityDropdownOpen(false), 200)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid var(--input-border)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  cursor: !multiCityStateCode ? 'not-allowed' : 'text'
                }}
              />
              {isMultiCityDropdownOpen && multiCityStateCode && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  background: 'var(--dropdown-bg)', border: '1px solid var(--border)',
                  borderRadius: '6px', zIndex: 20, maxHeight: '220px', overflowY: 'auto',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}>
                  {loadingMultiCityRtos ? (
                    <div style={{ padding: '10px', color: 'var(--accent)', fontSize: '0.85rem' }}>Loading state areas...</div>
                  ) : filteredCityList.length === 0 ? (
                    <div style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No areas available</div>
                  ) : (
                    filteredCityList.map(c => (
                      <div
                        key={c}
                        onMouseDown={() => {
                          toggleMultiCity(c)
                          setMultiCitySearchInput("")
                          setIsMultiCityDropdownOpen(false)
                        }}
                        className="dropdown-item"
                        style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}
                      >
                        + Add {c}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected City Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
          {selectedMultiCities.map(c => (
            <span
              key={c}
              style={{
                background: 'rgba(37, 99, 235, 0.1)',
                border: '1px solid rgba(37, 99, 235, 0.3)',
                color: '#2563eb',
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {c}
              <span
                onClick={() => removeMultiCity(c)}
                style={{ cursor: 'pointer', fontWeight: 'bold', color: '#ef4444' }}
              >
                ×
              </span>
            </span>
          ))}
          {multiCityStateCode && selectedMultiCities.length === 0 && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
              No areas selected in {selectedStateObj?.name}. Type in search box above to add areas.
            </span>
          )}
          {!multiCityStateCode && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
              Select a state to start adding areas for comparison.
            </span>
          )}
        </div>

        {/* Explicit Compare / Fetch Button */}
        {multiCityStateCode && (
          <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {selectedMultiCities.length > 0 ? `${selectedMultiCities.length} cities selected. Click compare to fetch accurate data.` : "Select at least 1 city to compare."}
            </span>
            <button
              disabled={loadingMultiCity || selectedMultiCities.length === 0}
              onClick={() => fetchMultiCityComparisonData(selectedMultiCities)}
              style={{
                padding: '10px 22px',
                background: loadingMultiCity || selectedMultiCities.length === 0 ? 'var(--border)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: loadingMultiCity || selectedMultiCities.length === 0 ? 'var(--text-muted)' : '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: loadingMultiCity || selectedMultiCities.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow: selectedMultiCities.length > 0 ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {loadingMultiCity ? "Fetching RTO Data..." : "Compare Cities (Fetch Data)"}
            </button>
          </div>
        )}
      </div>

      {loadingMultiCity && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 1.5rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          margin: '1rem 0'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(37, 99, 235, 0.2)',
            borderTop: '4px solid #2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '1rem'
          }}></div>
          <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{loadingMultiCityStatus || "Fetching RTO data..."}</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sequencing requests to ensure 100% accurate data from Vahan. Please wait...</p>
        </div>
      )}

      {!loadingMultiCity && multiCityData && (
        <div>
          <h3 style={{ fontSize: '1rem', color: 'var(--heading-color)', marginBottom: '1rem' }}>RTO Comparison Data Table</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>RTO Name</th>
                  {selectedCompanies.map(c => (
                    <th key={c} style={{ color: getCompanyColor(c) }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rtoNames.map(rto => (
                  <tr key={rto}>
                    <td style={{ fontWeight: 500 }}>{rto}</td>
                    {selectedCompanies.map(c => {
                      const compArr = multiCityData[rto]?.[c]
                      let sum = 0
                      if (Array.isArray(compArr)) {
                        sum = compArr.reduce((acc, row) => acc + (row.registeredVehicleCount || 0), 0)
                      }
                      return <td key={c} style={{ color: getCompanyColor(c) }}>{sum.toLocaleString()}</td>
                    })}
                  </tr>
                ))}
              </tbody>
              {rtoNames.length > 0 && (
                <tfoot>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Total</td>
                    {selectedCompanies.map(c => {
                      const totalForBrand = rtoNames.reduce((acc, rto) => {
                        const compArr = multiCityData[rto]?.[c]
                        let count = 0
                        if (Array.isArray(compArr)) {
                          count = compArr.reduce((accRto, row) => accRto + (row.registeredVehicleCount || 0), 0)
                        }
                        return acc + count
                      }, 0)
                      return (
                        <td key={c} style={{ color: getCompanyColor(c), fontSize: '1rem', fontWeight: 700 }}>
                          {totalForBrand.toLocaleString()}
                        </td>
                      )
                    })}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  )
})
