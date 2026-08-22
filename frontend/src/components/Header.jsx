import React from 'react'
import { exportDashboardToExcel } from '../utils/excelExport'

export const Header = ({ 
  isSidebarOpen, 
  setIsSidebarOpen, 
  loadingCompanies, 
  companiesCount, 
  theme, 
  toggleTheme,
  stateCode,
  setStateCode,
  selectedCities,
  setSelectedCities,
  timeFilter,
  setTimeFilter,
  fromYear,
  toYear,
  clearAllFilters,
  data,
  cityRtoData,
  selectedCompanies
}) => {
  const hasActiveFilters = stateCode || (selectedCities && selectedCities.length > 0) || timeFilter !== "As on Date";

  return (
    <header className="top-header" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                style={{
                  position: 'fixed',
                  top: '2rem',
                  left: '2.5rem',
                  zIndex: 999,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--accent)',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)'
                }}
                title="Open Filters Sidebar"
              >
                ☰
              </button>
            )}
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--heading-color)', marginLeft: !isSidebarOpen ? '4.5rem' : '0' }}>Vahan EV Competitor Dashboard</h1>
          </div>

          {/* Active Filter Pills */}
          {hasActiveFilters && (
            <div className="active-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Active Filters:</span>
              
              {stateCode && (
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-main)' }}>
                  State: {stateCode}
                  <button onClick={() => setStateCode("")} style={{ background: 'none', border: 'none', color: '#ef4444', marginLeft: '4px', cursor: 'pointer', fontSize: '14px' }}>×</button>
                </div>
              )}

              {selectedCities && selectedCities.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-main)' }}>
                  Areas: {selectedCities.join(', ')}
                  <button onClick={() => setSelectedCities([])} style={{ background: 'none', border: 'none', color: '#ef4444', marginLeft: '4px', cursor: 'pointer', fontSize: '14px' }}>×</button>
                </div>
              )}

              {timeFilter === "Calendar Year" && (
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-main)' }}>
                  Year: {fromYear === toYear ? fromYear : `${fromYear}-${toYear}`}
                  <button onClick={() => setTimeFilter("As on Date")} style={{ background: 'none', border: 'none', color: '#ef4444', marginLeft: '4px', cursor: 'pointer', fontSize: '14px' }}>×</button>
                </div>
              )}

              <button 
                onClick={clearAllFilters}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        <div className="header-status" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {loadingCompanies ? (
            <span style={{ color: '#d97706', fontSize: '0.85rem', fontWeight: 500 }}>⌛ Fetching Makers from Vahan...</span>
          ) : (
            <span style={{ color: '#059669', fontSize: '0.85rem', fontWeight: 500 }}>✓ {companiesCount?.toLocaleString()} makers loaded from Vahan</span>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? '☀️ Light' : '🌙 Dark'}
          </button>

          {/* Export to Excel Button */}
          <button
            onClick={() => exportDashboardToExcel(data, cityRtoData, selectedCompanies, timeFilter, fromYear, toYear)}
            className="export-excel-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #059669, #047857)',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
              transition: 'all 0.2s ease'
            }}
            title="Export Dashboard Data to Excel"
          >
            <span>📊</span> Export to Excel
          </button>

          {/* Export to PDF Button */}
          <button
            onClick={() => window.print()}
            className="export-pdf-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
              transition: 'all 0.2s ease'
            }}
            title="Export Current View as PDF"
          >
            <span>📄</span> Export to PDF
          </button>
        </div>
      </div>
    </header>
  )
}
