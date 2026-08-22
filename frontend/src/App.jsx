import { useState, useEffect, useMemo, useCallback } from 'react'
import { fetchCompanies, fetchRtos, fetchCompareData, fetchCityRtoBreakdown, fetchCompanyTop5Rtos } from './api'
import { STATES } from './constants/states'
import { extractCleanCity, getCompanyColor, searchAndSortCompanies, formatMultiSeriesChartData } from './utils/formatters'

// Modular Components
import { Header } from './components/Header'
import { SidebarFilters } from './components/SidebarFilters'
import { LoadingOverlay } from './components/LoadingOverlay'
import { KpiMetricsSection } from './components/KpiMetricsSection'
import { DurationSegregationSection } from './components/DurationSegregationSection'
import { CityRtoBreakdownSection } from './components/CityRtoBreakdownSection'
import { YearlyTrendChart } from './components/YearlyTrendChart'
import { Top5TerritoriesSection } from './components/Top5TerritoriesSection'
import { MultiCityComparisonSection } from './components/MultiCityComparisonSection'
import { DistributionChartsGrid } from './components/DistributionChartsGrid'

function App() {
  const [theme, setTheme] = useState("light")
  const [companies, setCompanies] = useState([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [baseCompany, setBaseCompany] = useState("")
  const [baseCompanyInput, setBaseCompanyInput] = useState("")
  const [isBaseDropdownOpen, setIsBaseDropdownOpen] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const [competitorCompanies, setCompetitorCompanies] = useState([])
  const [competitorInput, setCompetitorInput] = useState("")
  const [isCompetitorDropdownOpen, setIsCompetitorDropdownOpen] = useState(false)

  const [timeFilter, setTimeFilter] = useState("As on Date")
  const [cityRtoData, setCityRtoData] = useState(null)
  const [loadingCityRto, setLoadingCityRto] = useState(false)
  const [durationTableYear, setDurationTableYear] = useState("")
  const [cityRtoTableYear, setCityRtoTableYear] = useState("")
  const [cityRtoMonthFilter, setCityRtoMonthFilter] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Multi-City Comparison State
  const [multiCityStateCode, setMultiCityStateCode] = useState("")
  const [multiCityRtos, setMultiCityRtos] = useState([])
  const [loadingMultiCityRtos, setLoadingMultiCityRtos] = useState(false)
  const [selectedMultiCities, setSelectedMultiCities] = useState([])
  const [multiCityData, setMultiCityData] = useState(null)
  const [loadingMultiCity, setLoadingMultiCity] = useState(false)
  const [loadingMultiCityStatus, setLoadingMultiCityStatus] = useState("")
  const [isMultiCityDropdownOpen, setIsMultiCityDropdownOpen] = useState(false)
  const [multiCitySearchInput, setMultiCitySearchInput] = useState("")

  // Independent Per-Company Drilldown State
  const [companyDrilldown, setCompanyDrilldown] = useState({})

  const [fromYear, setFromYear] = useState(2026)
  const [toYear, setToYear] = useState(2026)
  const [stateCode, setStateCode] = useState("")
  const [rtos, setRtos] = useState([])
  const [selectedCities, setSelectedCities] = useState([])
  const [areaInput, setAreaInput] = useState("")
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false)
  const [rtoCode, setRtoCode] = useState(0)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState("")
  const [error, setError] = useState(null)

  const selectedCompanies = useMemo(() => {
    const list = []
    if (baseCompany) list.push(baseCompany)
    competitorCompanies.forEach(c => {
      if (!list.includes(c)) list.push(c)
    })
    return list
  }, [baseCompany, competitorCompanies])

  useEffect(() => {
    setLoadingCompanies(true)
    fetchCompanies()
      .then(data => {
        setCompanies(data)
        setLoadingCompanies(false)
      })
      .catch(err => {
        console.error("Failed to load companies:", err)
        setLoadingCompanies(false)
      })
  }, [])

  useEffect(() => {
    if (stateCode) {
      fetchRtos(stateCode)
        .then(data => setRtos(data))
        .catch(err => console.error("Failed to load RTOs:", err))
    } else {
      setRtos([])
      setSelectedCities([])
    }
  }, [stateCode])

  const cities = useMemo(() => {
    const citySet = new Set()
    rtos.forEach(r => {
      const city = extractCleanCity(r.rtoName)
      if (city) citySet.add(city)
    })
    return Array.from(citySet).sort()
  }, [rtos])

  const multiCityAvailableCities = useMemo(() => {
    const citySet = new Set()
    multiCityRtos.forEach(r => {
      const city = extractCleanCity(r.rtoName)
      if (city) citySet.add(city)
    })
    return Array.from(citySet).sort()
  }, [multiCityRtos])

  const filteredRtos = useMemo(() => {
    if (selectedCities.length === 0) return rtos
    return rtos.filter(r => selectedCities.includes(extractCleanCity(r.rtoName)))
  }, [rtos, selectedCities])

  const filteredBaseCompanies = useMemo(() => {
    return searchAndSortCompanies(companies, baseCompanyInput)
  }, [companies, baseCompanyInput])

  const filteredCompetitorCompanies = useMemo(() => {
    const available = companies.filter(c => c !== baseCompany && !competitorCompanies.includes(c))
    return searchAndSortCompanies(available, competitorInput)
  }, [companies, baseCompany, competitorCompanies, competitorInput])

  const selectBaseCompany = (companyName) => {
    setBaseCompany(companyName)
    setCompetitorCompanies(competitorCompanies.filter(c => c !== companyName))
    setBaseCompanyInput("")
  }

  const selectCompetitor = (companyName) => {
    if (competitorCompanies.length >= 6) {
      alert("Maximum 6 competitors can be selected at a time.")
      return
    }
    if (!competitorCompanies.includes(companyName)) {
      setCompetitorCompanies([...competitorCompanies, companyName])
    }
    setCompetitorInput("")
  }

  const removeCompetitor = (companyName) => {
    setCompetitorCompanies(competitorCompanies.filter(c => c !== companyName))
  }

  const applyFilters = async (overrides = {}) => {
    const isEvent = overrides && overrides.nativeEvent
    const filterOverrides = isEvent ? {} : overrides

    if (selectedCompanies.length === 0) {
      setError("Please select at least one company")
      return
    }
    
    setLoading(true)
    setLoadingStatus("Fetching multi-company data from Vahan...")
    setError(null)
    
    try {
      const payload = {
        companies: selectedCompanies,
        timeFilter: timeFilter,
        fromYear: timeFilter === "As on Date" ? 2000 : parseInt(fromYear),
        toYear: timeFilter === "As on Date" ? new Date().getFullYear() : parseInt(toYear),
        stateCode,
        rtoCode: parseInt(rtoCode),
        fuelType: "",
        vehicleCategory: "",
        ...filterOverrides
      }

      const result = await fetchCompareData(payload)
      let rtoDataResult = null

      if (selectedCities.length > 0 && parseInt(payload.rtoCode) === 0 && filteredRtos.length > 0) {
        setLoadingStatus(`Calculating 100% accurate area breakdown...`)
        setLoadingCityRto(true)
        try {
          rtoDataResult = await fetchCityRtoBreakdown(payload, filteredRtos)
        } catch (err) {
          console.error("Failed to fetch RTO breakdown:", err)
        } finally {
          setLoadingCityRto(false)
        }
      }

      setCityRtoData(rtoDataResult)
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setLoadingStatus("")
    }
  }

  const getChartData = useCallback((endpointKey) => {
    return formatMultiSeriesChartData(data, endpointKey, selectedCompanies, rtoCode, selectedCities, cityRtoData, timeFilter, fromYear, toYear)
  }, [data, selectedCompanies, rtoCode, selectedCities, cityRtoData, timeFilter, fromYear, toYear])

  const handleCompanyBarClick = async (company, clickData) => {
    if (stateCode) return
    const stateName = clickData?.name || clickData?.activeLabel || clickData?.activePayload?.[0]?.payload?.name
    if (!stateName) return

    const stateObj = STATES.find(s => s.name.toLowerCase() === stateName.toLowerCase())
    if (!stateObj || !stateObj.code) return

    setCompanyDrilldown(prev => ({
      ...prev,
      [company]: { stateCode: stateObj.code, stateName: stateObj.name, loading: true, data: [] }
    }))

    try {
      const basePayload = {
        timeFilter,
        fromYear: timeFilter === "As on Date" ? 2000 : parseInt(fromYear),
        toYear: timeFilter === "As on Date" ? new Date().getFullYear() : parseInt(toYear),
        fuelType: "",
        vehicleCategory: ""
      }
      const resData = await fetchCompanyTop5Rtos(company, stateObj.code, basePayload)
      let rtoTop5 = []
      if (resData && resData.labels) {
        const vals = Array.isArray(resData.data) ? resData.data : (resData.datasets?.[0]?.data || [])
        resData.labels.forEach((lbl, idx) => {
          rtoTop5.push({ name: lbl, value: vals[idx] || 0 })
        })
        rtoTop5.sort((a, b) => b.value - a.value)
        rtoTop5 = rtoTop5.slice(0, 5)
      }
      setCompanyDrilldown(prev => ({
        ...prev,
        [company]: { stateCode: stateObj.code, stateName: stateObj.name, loading: false, data: rtoTop5 }
      }))
    } catch (err) {
      console.error(`Failed to fetch drilldown RTOs for ${company}:`, err)
      setCompanyDrilldown(prev => ({
        ...prev,
        [company]: { stateCode: stateObj.code, stateName: stateObj.name, loading: false, data: [] }
      }))
    }
  }

  const resetCompanyDrilldown = (company) => {
    setCompanyDrilldown(prev => {
      const copy = { ...prev }
      delete copy[company]
      return copy
    })
  }

  const handleMultiCityStateChange = async (newStateCode) => {
    setMultiCityStateCode(newStateCode)
    setSelectedMultiCities([])
    setMultiCityData(null)
    if (newStateCode) {
      setLoadingMultiCityRtos(true)
      try {
        const rtoData = await fetchRtos(newStateCode)
        setMultiCityRtos(rtoData)
      } catch (err) {
        console.error("Failed to fetch RTOs for multi-city state:", err)
      } finally {
        setLoadingMultiCityRtos(false)
      }
    } else {
      setMultiCityRtos([])
    }
  }

  const fetchMultiCityComparisonData = async (citiesToFetch = selectedMultiCities, stCode = multiCityStateCode, rtoOptions = multiCityRtos) => {
    if (!stCode || citiesToFetch.length === 0 || selectedCompanies.length === 0) {
      setMultiCityData(null)
      return
    }

    setLoadingMultiCity(true)
    setLoadingMultiCityStatus(`Fetching RTO breakdown for ${citiesToFetch.length} selected cities...`)
    
    try {
      const matchingRtos = rtoOptions.filter(r => {
        const city = extractCleanCity(r.rtoName)
        return citiesToFetch.includes(city)
      })

      if (matchingRtos.length === 0) {
        setMultiCityData(null)
        setLoadingMultiCity(false)
        return
      }

      const payload = {
        companies: selectedCompanies,
        timeFilter,
        fromYear: timeFilter === "As on Date" ? 2000 : parseInt(fromYear),
        toYear: timeFilter === "As on Date" ? new Date().getFullYear() : parseInt(toYear),
        stateCode: stCode,
        rtoCode: 0,
        fuelType: "",
        vehicleCategory: ""
      }

      const result = await fetchCityRtoBreakdown(payload, matchingRtos)
      setMultiCityData(result)
    } catch (err) {
      console.error("Failed to fetch multi-city data:", err)
    } finally {
      setLoadingMultiCity(false)
      setLoadingMultiCityStatus("")
    }
  }

  const toggleMultiCity = (city) => {
    let updated
    if (selectedMultiCities.includes(city)) {
      updated = selectedMultiCities.filter(c => c !== city)
    } else {
      if (selectedMultiCities.length >= 5) {
        alert("Maximum 5 areas can be selected at a time.")
        return
      }
      updated = [...selectedMultiCities, city]
    }
    setSelectedMultiCities(updated)
  }

  const removeMultiCity = (city) => {
    const updated = selectedMultiCities.filter(c => c !== city)
    setSelectedMultiCities(updated)
  }

  const yearlyTrendChartData = useMemo(() => {
    return getChartData("Yearly Trend")
  }, [getChartData])

  const clearAllFilters = () => {
    setTimeFilter("As on Date")
    setFromYear(2026)
    setToYear(2026)
    setStateCode("")
    setSelectedCities([])
    setRtoCode(0)
    
    setBaseCompany("")
    setCompetitorCompanies([])

    // Clear data entirely
    setData(null)
    setCityRtoData(null)
    setError(null)

    // Clear multi-city comparison state
    setMultiCityStateCode("")
    setMultiCityRtos([])
    setSelectedMultiCities([])
    setMultiCityData(null)
  }

  const getColorForCompany = useCallback((comp) => getCompanyColor(comp, selectedCompanies), [selectedCompanies])

  return (
    <div className="dashboard-layout">
      {/* Sidebar Filters */}
      <SidebarFilters
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        loadingCompanies={loadingCompanies}
        companies={companies}
        baseCompanyInput={baseCompanyInput}
        setBaseCompanyInput={setBaseCompanyInput}
        isBaseDropdownOpen={isBaseDropdownOpen}
        setIsBaseDropdownOpen={setIsBaseDropdownOpen}
        filteredBaseCompanies={filteredBaseCompanies}
        selectBaseCompany={selectBaseCompany}
        baseCompany={baseCompany}
        getCompanyColor={getColorForCompany}
        competitorInput={competitorInput}
        setCompetitorInput={setCompetitorInput}
        isCompetitorDropdownOpen={isCompetitorDropdownOpen}
        setIsCompetitorDropdownOpen={setIsCompetitorDropdownOpen}
        filteredCompetitorCompanies={filteredCompetitorCompanies}
        selectCompetitor={selectCompetitor}
        competitorCompanies={competitorCompanies}
        removeCompetitor={removeCompetitor}
        timeFilter={timeFilter}
        setTimeFilter={setTimeFilter}
        fromYear={fromYear}
        setFromYear={setFromYear}
        toYear={toYear}
        setToYear={setToYear}
        stateCode={stateCode}
        setStateCode={setStateCode}
        selectedCities={selectedCities}
        setSelectedCities={setSelectedCities}
        areaInput={areaInput}
        setAreaInput={setAreaInput}
        isAreaDropdownOpen={isAreaDropdownOpen}
        setIsAreaDropdownOpen={setIsAreaDropdownOpen}
        cities={cities}
        rtoCode={rtoCode}
        setRtoCode={setRtoCode}
        filteredRtos={filteredRtos}
        applyFilters={applyFilters}
        clearAllFilters={clearAllFilters}
      />

      {/* Main Content */}
      <main className="main-content" style={{ maxWidth: isSidebarOpen ? 'calc(100vw - 300px)' : '100vw' }}>
        <Header
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          loadingCompanies={loadingCompanies}
          companiesCount={companies.length}
          theme={theme}
          toggleTheme={toggleTheme}
          stateCode={stateCode}
          setStateCode={setStateCode}
          selectedCities={selectedCities}
          setSelectedCities={setSelectedCities}
          timeFilter={timeFilter}
          setTimeFilter={setTimeFilter}
          fromYear={fromYear}
          toYear={toYear}
          clearAllFilters={clearAllFilters}
          data={data}
          cityRtoData={cityRtoData}
          selectedCompanies={selectedCompanies}
        />

        {loading && <LoadingOverlay loadingStatus={loadingStatus} />}
        {error && <div className="data-error">{error}</div>}

        {data && !loading && (
          <>
            {/* 1. KPI Metrics Cards */}
            <KpiMetricsSection
              selectedCompanies={selectedCompanies}
              selectedCities={selectedCities}
              cityRtoData={cityRtoData}
              data={data}
              getCompanyColor={getColorForCompany}
            />

            {/* 2. Duration-Wise Segregation Table */}
            <DurationSegregationSection
              apiData={data}
              selectedCompanies={selectedCompanies}
              timeFilter={timeFilter}
              fromYear={fromYear}
              toYear={toYear}
              durationTableYear={durationTableYear}
              setDurationTableYear={setDurationTableYear}
              getCompanyColor={getColorForCompany}
            />

            {/* 3. City RTO Breakdown Table */}
            <CityRtoBreakdownSection
              cityRtoData={cityRtoData}
              loadingCityRto={loadingCityRto}
              selectedCities={selectedCities}
              selectedCompanies={selectedCompanies}
              cityRtoTableYear={cityRtoTableYear}
              setCityRtoTableYear={setCityRtoTableYear}
              cityRtoMonthFilter={cityRtoMonthFilter}
              setCityRtoMonthFilter={setCityRtoMonthFilter}
              getCompanyColor={getColorForCompany}
            />

            {/* 4. Visual Analytics & Charts */}
            <div className="detailed-section" style={{ marginTop: '3rem' }}>
              <h2>Visual Analytics & Charts</h2>

              <YearlyTrendChart
                chartData={yearlyTrendChartData}
                selectedCompanies={selectedCompanies}
                getCompanyColor={getColorForCompany}
              />

              <MultiCityComparisonSection
                multiCityStateCode={multiCityStateCode}
                handleMultiCityStateChange={handleMultiCityStateChange}
                multiCityAvailableCities={multiCityAvailableCities}
                multiCitySearchInput={multiCitySearchInput}
                setMultiCitySearchInput={setMultiCitySearchInput}
                loadingMultiCityRtos={loadingMultiCityRtos}
                isMultiCityDropdownOpen={isMultiCityDropdownOpen}
                setIsMultiCityDropdownOpen={setIsMultiCityDropdownOpen}
                toggleMultiCity={toggleMultiCity}
                removeMultiCity={removeMultiCity}
                selectedMultiCities={selectedMultiCities}
                loadingMultiCity={loadingMultiCity}
                loadingMultiCityStatus={loadingMultiCityStatus}
                multiCityData={multiCityData}
                fetchMultiCityComparisonData={fetchMultiCityComparisonData}
                selectedCompanies={selectedCompanies}
                getCompanyColor={getColorForCompany}
              />

              <Top5TerritoriesSection
                rtoCode={rtoCode}
                selectedCities={selectedCities}
                stateCode={stateCode}
                selectedCompanies={selectedCompanies}
                companyDrilldown={companyDrilldown}
                handleCompanyBarClick={handleCompanyBarClick}
                resetCompanyDrilldown={resetCompanyDrilldown}
                formatMultiSeriesChartData={getChartData}
                data={data}
                getCompanyColor={getColorForCompany}
              />

              <DistributionChartsGrid
                formatMultiSeriesChartData={getChartData}
                data={data}
                selectedCompanies={selectedCompanies}
                getCompanyColor={getColorForCompany}
              />
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default App
