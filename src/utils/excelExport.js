import * as XLSX from 'xlsx'

export const exportDashboardToExcel = (data, cityRtoData, selectedCompanies, timeFilter, fromYear, toYear) => {
  if (!data || !selectedCompanies || selectedCompanies.length === 0) {
    alert("No data available to export.")
    return
  }

  const wb = XLSX.utils.book_new()

  // --- SHEET 1: KPIs ---
  const kpiRows = []
  kpiRows.push(["Company", "Total Registrations"])
  
  selectedCompanies.forEach(company => {
    let citySum = 0
    if (cityRtoData) {
      Object.keys(cityRtoData).forEach(rtoName => {
        const compArr = cityRtoData[rtoName]?.[company]
        if (Array.isArray(compArr)) {
          citySum += compArr.reduce((acc, row) => acc + (row.registeredVehicleCount || 0), 0)
        }
      })
      kpiRows.push([company, citySum])
    } else {
      const rawVal = data?.[company]?.["Dashboard Count"]?.totalTransactions
      const count = rawVal ? parseInt(String(rawVal).replace(/,/g, '')) : 0
      kpiRows.push([company, count])
    }
  })
  
  const wsKpi = XLSX.utils.aoa_to_sheet(kpiRows)
  XLSX.utils.book_append_sheet(wb, wsKpi, "KPIs")

  // --- SHEET 2: Yearly Trend ---
  const yearlyMap = {}
  const yearlyOrder = []
  
  selectedCompanies.forEach(company => {
    const compData = data[company]?.["Yearly Trend"]
    const hasData = compData && (compData.data || (compData.datasets && compData.datasets.length > 0))
    
    if (compData && compData.labels && hasData) {
      const dataValues = Array.isArray(compData.data) 
        ? compData.data 
        : (compData.datasets && compData.datasets[0] ? compData.datasets[0].data : [])
        
      compData.labels.forEach((label, i) => {
        const year = String(label)
        if (!yearlyMap[year]) {
          yearlyMap[year] = { Year: year }
          yearlyOrder.push(year)
        }
        yearlyMap[year][company] = dataValues[i] || 0
      })
    }
  })
  
  let filteredYearlyOrder = yearlyOrder
  if (timeFilter === "Calendar Year") {
     const fY = parseInt(fromYear)
     const tY = parseInt(toYear)
     filteredYearlyOrder = yearlyOrder.filter(yearStr => {
       const y = parseInt(yearStr)
       return y >= fY && y <= tY
     })
  }
  
  // Sort numerically so the Excel rows are perfectly ordered
  filteredYearlyOrder.sort((a, b) => parseInt(a) - parseInt(b))

  const yearlyHeaders = ["Year", ...selectedCompanies]
  const yearlyRows = [yearlyHeaders]
  
  filteredYearlyOrder.forEach(year => {
    const row = [year]
    selectedCompanies.forEach(company => {
      row.push(yearlyMap[year][company] || 0)
    })
    yearlyRows.push(row)
  })

  const wsYearly = XLSX.utils.aoa_to_sheet(yearlyRows)
  XLSX.utils.book_append_sheet(wb, wsYearly, "Yearly Trend")

  // --- SHEET 3: Monthly Segregation ---
  const monthMap = {}
  const monthOrder = []
  
  selectedCompanies.forEach(company => {
    const compData = data[company]?.["Month Wise (Duration)"]
    if (Array.isArray(compData)) {
      compData.forEach(row => {
        const month = row.yearAsString || row.year
        if (!monthMap[month]) {
          monthMap[month] = { Month: month }
          monthOrder.push(month)
        }
        monthMap[month][company] = row.registeredVehicleCount || 0
      })
    }
  })

  let filteredMonthOrder = monthOrder
  if (timeFilter === "Calendar Year") {
     const fY = parseInt(fromYear)
     const tY = parseInt(toYear)
     filteredMonthOrder = monthOrder.filter(monthKey => {
       const yearMatch = monthKey.match(/^(\d{4})/)
       if (yearMatch) {
         const y = parseInt(yearMatch[1])
         return y >= fY && y <= tY
       }
       return true
     })
  }
  
  const monthlyHeaders = ["Month", ...selectedCompanies]
  const monthlyRows = [monthlyHeaders]
  
  filteredMonthOrder.forEach(month => {
    const row = [month]
    selectedCompanies.forEach(company => {
      row.push(monthMap[month][company] || 0)
    })
    monthlyRows.push(row)
  })

  const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyRows)
  XLSX.utils.book_append_sheet(wb, wsMonthly, "Monthly Trend")

  // --- SHEET 4: RTO Breakdown (Top 5 / Multi-City) ---
  const rtoHeaders = ["RTO / City", ...selectedCompanies]
  const rtoRows = [rtoHeaders]

  if (cityRtoData) {
    Object.keys(cityRtoData).forEach(rtoName => {
      const row = [rtoName]
      selectedCompanies.forEach(company => {
        const compArr = cityRtoData[rtoName]?.[company]
        let sum = 0
        if (Array.isArray(compArr)) {
           sum = compArr.reduce((acc, r) => acc + (r.registeredVehicleCount || 0), 0)
        }
        row.push(sum)
      })
      rtoRows.push(row)
    })
  } else {
    // Top 5 Fallback
    const rtoMap = {}
    const rtoOrder = []
    
    selectedCompanies.forEach(company => {
      const compData = data[company]?.["Top 5 (State/RTO)"]
      const hasData = compData && (compData.data || (compData.datasets && compData.datasets.length > 0))
      
      if (compData && compData.labels && hasData) {
        const dataValues = Array.isArray(compData.data) 
          ? compData.data 
          : (compData.datasets && compData.datasets[0] ? compData.datasets[0].data : [])
          
        compData.labels.forEach((label, i) => {
          const name = String(label)
          if (!rtoMap[name]) {
            rtoMap[name] = { Name: name }
            rtoOrder.push(name)
          }
          rtoMap[name][company] = dataValues[i] || 0
        })
      }
    })
    
    rtoOrder.forEach(name => {
      const row = [name]
      selectedCompanies.forEach(company => {
        row.push(rtoMap[name][company] || 0)
      })
      rtoRows.push(row)
    })
  }

  const wsRto = XLSX.utils.aoa_to_sheet(rtoRows)
  XLSX.utils.book_append_sheet(wb, wsRto, "RTO Breakdown")

  // --- Helper to add generic pie/bar chart sheets ---
  const addChartSheet = (chartKey, sheetName) => {
    const chartMap = {}
    const chartOrder = []
    
    selectedCompanies.forEach(company => {
      const compData = data[company]?.[chartKey]
      const hasData = compData && (compData.data || (compData.datasets && compData.datasets.length > 0))
      
      if (compData && compData.labels && hasData) {
        const dataValues = Array.isArray(compData.data) 
          ? compData.data 
          : (compData.datasets && compData.datasets[0] ? compData.datasets[0].data : [])
          
        compData.labels.forEach((label, i) => {
          const name = String(label)
          if (!chartMap[name]) {
            chartMap[name] = { Name: name }
            chartOrder.push(name)
          }
          chartMap[name][company] = dataValues[i] || 0
        })
      }
    })

    if (chartOrder.length > 0) {
      const headers = [sheetName, ...selectedCompanies]
      const rows = [headers]
      
      chartOrder.forEach(name => {
        const row = [name]
        selectedCompanies.forEach(company => {
          row.push(chartMap[name][company] || 0)
        })
        rows.push(row)
      })

      const ws = XLSX.utils.aoa_to_sheet(rows)
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    }
  }

  // Add the 3 Distribution Charts
  addChartSheet("Fuel", "Fuel Type")
  addChartSheet("Class", "Vehicle Class")
  addChartSheet("Status", "Vehicle Status")

  // Write Excel file
  const dateStr = new Date().toISOString().split('T')[0]
  XLSX.writeFile(wb, `Vahan_Dashboard_Export_${dateStr}.xlsx`)
}
