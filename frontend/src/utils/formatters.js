/**
 * Strips RTO/ARTO suffixes and returns clean uppercase city name.
 */
export const extractCleanCity = (rtoName) => {
  if (!rtoName) return ''
  let clean = rtoName.split('(')[0].split('-')[0].trim()
  clean = clean.replace(/\s+(RTO|ARTO|SUB RTO|UNIT OFFICE|TRANSPORT).*$/i, '').trim()
  return clean.toUpperCase()
}

/**
 * Formats long X-axis labels for Recharts (e.g. "Regional Transport Office" -> "RTO").
 */
export const formatAxisLabel = (value) => {
  if (!value) return ''
  let str = String(value)
  str = str.replace(/Regional Transport Office/gi, 'RTO')
  str = str.replace(/Unit Office/gi, 'UO')
  if (str.length > 20) {
    return str.slice(0, 18) + '...'
  }
  return str
}

const BRAND_COLORS = [
  '#f472b6', '#34d399', '#fbbf24', '#60a5fa', 
  '#a78bfa', '#fb923c', '#2dd4bf', '#a3e635'
]

/**
 * Returns a deterministic brand color based on company index in selected list.
 */
export const getCompanyColor = (companyName, selectedCompanies = []) => {
  const idx = selectedCompanies.indexOf(companyName)
  return BRAND_COLORS[idx !== -1 ? idx % BRAND_COLORS.length : 0]
}

/**
 * Formats large numbers compactly (e.g. 1500000 -> 1.5M, 150000 -> 150K)
 */
export const formatCompactNumber = (number) => {
  if (number === undefined || number === null) return ''
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1
  }).format(number)
}

/**
 * Calculates percentage difference string with sign
 */
export const calculatePercentageDifference = (current, base) => {
  if (!base || base === 0) return null;
  const diff = ((current - base) / base) * 100;
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff.toFixed(1)}%`;
}

/**
 * Filters and sorts companies prioritizing exact startsWith matches.
 */
export const searchAndSortCompanies = (companiesList, searchInput) => {
  const input = (searchInput || '').toLowerCase().trim()
  if (!input) return companiesList.slice(0, 50)
  return companiesList
    .filter(c => c.toLowerCase().includes(input))
    .sort((a, b) => {
      const aLower = a.toLowerCase()
      const bLower = b.toLowerCase()
      const aStarts = aLower.startsWith(input)
      const bStarts = bLower.startsWith(input)
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1
      return aLower.localeCompare(bLower)
    })
}

export const calculateTop5Rtos = (cityRtoData, selectedCompanies) => {
  const customData = []
  Object.keys(cityRtoData).forEach(rtoName => {
    const rtoObj = { name: rtoName }
    let rtoTotal = 0
    selectedCompanies.forEach(company => {
      let sum = 0
      const compArr = cityRtoData[rtoName][company]
      if (Array.isArray(compArr)) {
        sum = compArr.reduce((acc, row) => acc + (row.registeredVehicleCount || 0), 0)
      }
      rtoObj[company] = sum
      rtoTotal += sum
    })
    if (rtoTotal > 0) {
      rtoObj._total = rtoTotal
      customData.push(rtoObj)
    }
  })
  customData.sort((a, b) => b._total - a._total)
  return customData.slice(0, 5).map(d => {
    const { _total, ...rest } = d
    return rest
  })
}

export const formatMultiSeriesChartData = (apiData, endpointKey, selectedCompanies, rtoCode, selectedCities, cityRtoData, timeFilter, fromYear, toYear) => {
  if (!apiData) return []
  const mergedData = {}

  selectedCompanies.forEach(company => {
    const compData = apiData[company]?.[endpointKey]
    const hasData = compData && (compData.data || (compData.datasets && compData.datasets.length > 0))
    
    if (!compData || !compData.labels || !hasData) return

    const dataValues = Array.isArray(compData.data) 
      ? compData.data 
      : (compData.datasets && compData.datasets[0] ? compData.datasets[0].data : [])

    compData.labels.forEach((label, i) => {
      if (!mergedData[label]) {
        mergedData[label] = { name: label }
      }
      mergedData[label][company] = dataValues[i] || 0
    })
  })

  let finalData = Object.values(mergedData)
  
  if (endpointKey === "Yearly Trend" && timeFilter === "Calendar Year") {
    const fY = parseInt(fromYear)
    const tY = parseInt(toYear)
    finalData = finalData.filter(d => {
      const year = parseInt(d.name)
      return year >= fY && year <= tY
    })
  }
  
  if (endpointKey === "Top 5 (State/RTO)") {
    if (rtoCode && rtoCode.toString() !== "0") {
      return []
    }
    if (selectedCities.length > 0 && cityRtoData) {
      return calculateTop5Rtos(cityRtoData, selectedCompanies)
    }
  }
  
  return finalData
}

export const extractAvailableYears = (monthKeys) => {
  const availableYears = new Set()
  monthKeys.forEach(m => {
    if (!m) return
    const str = String(m)
    const yearMatch = str.match(/^(\d{4})/)
    if (yearMatch) availableYears.add(yearMatch[1])
  })
  return Array.from(availableYears).sort().reverse()
}
