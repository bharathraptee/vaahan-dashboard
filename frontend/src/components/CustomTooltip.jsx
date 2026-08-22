import React from 'react';
import { calculatePercentageDifference } from '../utils/formatters';

export const CustomTooltip = ({ active, payload, label, baseCompany }) => {
  if (active && payload && payload.length) {
    // Find the base company value for percentage diff
    const basePayload = payload.find(p => p.dataKey === baseCompany);
    const baseValue = basePayload ? basePayload.value : null;

    return (
      <div className="custom-tooltip" style={{ 
        backgroundColor: 'var(--bg-card)', 
        border: '1px solid var(--border)', 
        borderRadius: '8px', 
        padding: '12px',
        color: 'var(--text-main)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <p className="label" style={{ fontWeight: 600, marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
          {label}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {payload.map((entry, index) => {
            const isBase = entry.dataKey === baseCompany;
            const diffStr = (!isBase && baseValue) 
              ? calculatePercentageDifference(entry.value, baseValue)
              : null;
              
            return (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', fontSize: '0.85rem' }}>
                <span style={{ color: entry.color, fontWeight: 500 }}>{entry.name}:</span>
                <span style={{ fontWeight: 600 }}>
                  {(entry.value ?? 0).toLocaleString()}
                  {diffStr && (
                    <span style={{ 
                      marginLeft: '8px', 
                      fontSize: '0.75rem', 
                      fontWeight: 500,
                      color: diffStr.startsWith('+') ? '#10b981' : (diffStr.startsWith('-') ? '#ef4444' : 'var(--text-muted)')
                    }}>
                      (vs {baseCompany.split(' ')[0]}: {diffStr})
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};
