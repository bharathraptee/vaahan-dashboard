import React from 'react'
import { STATES } from '../constants/states'

export const SidebarFilters = ({
  isSidebarOpen,
  setIsSidebarOpen,
  loadingCompanies,
  companies,
  baseCompanyInput,
  setBaseCompanyInput,
  isBaseDropdownOpen,
  setIsBaseDropdownOpen,
  filteredBaseCompanies,
  selectBaseCompany,
  baseCompany,
  getCompanyColor,
  competitorInput,
  setCompetitorInput,
  isCompetitorDropdownOpen,
  setIsCompetitorDropdownOpen,
  filteredCompetitorCompanies,
  selectCompetitor,
  competitorCompanies,
  removeCompetitor,
  timeFilter,
  setTimeFilter,
  fromYear,
  setFromYear,
  toYear,
  setToYear,
  stateCode,
  setStateCode,
  selectedCities,
  setSelectedCities,
  areaInput,
  setAreaInput,
  isAreaDropdownOpen,
  setIsAreaDropdownOpen,
  cities,
  rtoCode,
  setRtoCode,
  filteredRtos,
  applyFilters,
  clearAllFilters
}) => {
  return (
    <aside className={`sidebar ${!isSidebarOpen ? 'closed' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <img 
          src="./raptee-logo.png" 
          alt="Raptee HV Logo" 
          className="sidebar-logo"
          style={{ height: '32px', maxWidth: '210px', objectFit: 'contain' }} 
        />
        <button 
          onClick={() => setIsSidebarOpen(false)}
          style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '24px', cursor: 'pointer', padding: '5px' }}
          title="Close Sidebar"
        >
          ☰
        </button>
      </div>

      {loadingCompanies ? (
        <div style={{ marginBottom: '1rem', padding: '10px 12px', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#60a5fa', marginBottom: '8px' }}>
            <span style={{ fontWeight: 500 }}>Fetching Makers from Vahan...</span>
            <span style={{ fontSize: '10px', background: '#2563eb', color: '#fff', padding: '2px 6px', borderRadius: '10px' }}>Loading</span>
          </div>
          <div style={{ height: '4px', width: '100%', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
            <div className="indeterminate-progress" style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', borderRadius: '2px' }}></div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', marginTop: '-0.5rem' }}>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            ✓ {companies.length.toLocaleString()} makers loaded from Vahan
          </div>
          <button 
            onClick={clearAllFilters}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '12px', padding: 0 }}
          >
            Reset All
          </button>
        </div>
      )}
      
      {/* Base Company Input */}
      <div className="filter-group">
        <label>Base Company (Primary)</label>
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <input 
            type="text" 
            placeholder="Search base company..." 
            value={baseCompanyInput}
            onChange={(e) => setBaseCompanyInput(e.target.value)}
            onFocus={() => setIsBaseDropdownOpen(true)}
            onBlur={() => setTimeout(() => setIsBaseDropdownOpen(false), 200)}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-main)' }}
          />
          {isBaseDropdownOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, 
              background: 'var(--dropdown-bg)', border: '1px solid var(--border)', 
              borderRadius: '4px', zIndex: 10, maxHeight: '250px', overflowY: 'auto',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
            }}>
              {filteredBaseCompanies.length === 0 ? (
                <div style={{ padding: '10px', color: '#94a3b8' }}>
                  {loadingCompanies ? "Loading makers from Vahan..." : "No matches found"}
                </div>
              ) : (
                filteredBaseCompanies.map(c => (
                  <div 
                    key={c}
                    onMouseDown={() => selectBaseCompany(c)}
                    className="dropdown-item"
                    style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #334155' }}
                  >
                    {c}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        {baseCompany && (
          <div className="multi-select" style={{ marginBottom: '20px' }}>
            <div 
              className="select-item selected"
              style={{ 
                borderLeftColor: getCompanyColor(baseCompany), 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.05)'
              }}
            >
              <span>{baseCompany}</span>
              <span style={{ color: '#94a3b8', fontSize: '12px', marginLeft: '10px' }}>Base</span>
            </div>
          </div>
        )}
      </div>

      {/* Competitors Search & Selection */}
      <div className="filter-group">
        <label>Competitors (Compare Against)</label>
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <input 
            type="text" 
            placeholder="Search competitors..." 
            value={competitorInput}
            onChange={(e) => setCompetitorInput(e.target.value)}
            onFocus={() => setIsCompetitorDropdownOpen(true)}
            onBlur={() => setTimeout(() => setIsCompetitorDropdownOpen(false), 200)}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-main)' }}
          />
          {isCompetitorDropdownOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, 
              background: 'var(--dropdown-bg)', border: '1px solid var(--border)', 
              borderRadius: '4px', zIndex: 10, maxHeight: '250px', overflowY: 'auto',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
            }}>
              {filteredCompetitorCompanies.length === 0 ? (
                <div style={{ padding: '10px', color: '#94a3b8' }}>
                  {loadingCompanies ? "Loading makers from Vahan..." : "No matches found"}
                </div>
              ) : (
                filteredCompetitorCompanies.map(c => (
                  <div 
                    key={c}
                    onMouseDown={() => selectCompetitor(c)}
                    className="dropdown-item"
                    style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #334155' }}
                  >
                    {c}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <div className="multi-select">
          {competitorCompanies.map(company => (
            <div 
              key={company} 
              className="select-item selected"
              onClick={() => removeCompetitor(company)}
              style={{ 
                borderLeftColor: getCompanyColor(company), 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>{company}</span>
              <span style={{ color: '#ef4444', fontSize: '18px', fontWeight: 'bold', marginLeft: '10px', cursor: 'pointer' }}>×</span>
            </div>
          ))}
        </div>
      </div>

      {/* Time Filter Collapsible */}
      <details className="filter-details" open>
        <summary className="filter-summary">Time Filter</summary>
        <div className="filter-group" style={{ marginTop: '10px' }}>
          <select value={timeFilter} onChange={e => setTimeFilter(e.target.value)}>
            <option value="As on Date">As on Date (All Historical Data)</option>
            <option value="Calendar Year">Calendar Year</option>
          </select>
        </div>

        {timeFilter === "Calendar Year" && (
          <div className="filter-group row">
            <div>
              <label style={{ fontSize: '11px' }}>From Year</label>
              <input type="number" value={fromYear} onChange={e => setFromYear(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '11px' }}>To Year</label>
              <input type="number" value={toYear} onChange={e => setToYear(e.target.value)} />
            </div>
          </div>
        )}
      </details>

      {/* Location Filter Collapsible */}
      <details className="filter-details" open>
        <summary className="filter-summary">Location Filter</summary>
        <div className="filter-group" style={{ marginTop: '10px' }}>
          <label style={{ fontSize: '11px' }}>State</label>
          <select value={stateCode} onChange={e => setStateCode(e.target.value)}>
             {STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
          </select>
        </div>

        <div className="filter-group" style={{ marginTop: '16px' }}>
          <label style={{ fontSize: '11px', display: 'block', marginBottom: '6px' }}>Area (Max 5)</label>
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <input 
              type="text" 
              placeholder={!stateCode ? "Select State first..." : "Search & add area..."}
              value={areaInput}
              disabled={!stateCode}
              onChange={(e) => setAreaInput(e.target.value)}
              onFocus={() => setIsAreaDropdownOpen(true)}
              onBlur={() => setTimeout(() => setIsAreaDropdownOpen(false), 200)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '11px' }}
            />
            {isAreaDropdownOpen && stateCode && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, 
                background: 'var(--dropdown-bg)', border: '1px solid var(--border)', 
                borderRadius: '4px', zIndex: 10, maxHeight: '200px', overflowY: 'auto',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
              }}>
                {(() => {
                  const available = cities.filter(c => !selectedCities.includes(c));
                  const searchMatches = available.filter(c => c.toLowerCase().includes((areaInput || "").toLowerCase()));
                  if (searchMatches.length === 0) return <div style={{ padding: '10px', color: '#94a3b8', fontSize: '11px' }}>No matches</div>;
                  return searchMatches.map(c => (
                    <div 
                      key={c}
                      onMouseDown={() => {
                        if (selectedCities.length >= 5) {
                          alert("Maximum 5 areas can be selected at a time.");
                        } else {
                          setSelectedCities([...selectedCities, c]);
                          setRtoCode(0);
                        }
                        setAreaInput("");
                      }}
                      className="dropdown-item"
                      style={{ padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid #334155', fontSize: '11px' }}
                    >
                      {c}
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
          
          {selectedCities.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', marginTop: '4px' }}>
              {selectedCities.map(city => (
                <span 
                  key={city}
                  style={{ 
                    background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', 
                    color: '#60a5fa', padding: '4px 10px', borderRadius: '16px', fontSize: '11px',
                    display: 'flex', alignItems: 'center', gap: '6px', lineHeight: '1'
                  }}
                >
                  {city}
                  <span 
                    onClick={() => setSelectedCities(selectedCities.filter(c => c !== city))}
                    style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', lineHeight: '1', display: 'flex', alignItems: 'center' }}
                  >×</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="filter-group">
          <label style={{ fontSize: '11px' }}>RTO</label>
          <select value={rtoCode} onChange={e => setRtoCode(e.target.value)} disabled={!stateCode}>
            <option value={0}>All RTOs</option>
            {filteredRtos.map(r => <option key={r.id} value={r.rtoCode}>{r.rtoName}</option>)}
          </select>
        </div>
      </details>

      <button className="apply-btn" onClick={applyFilters}>Apply Filters</button>
    </aside>
  )
}
