import { useState, useMemo, useCallback } from 'react'
import { getCompanyColor } from './utils/formatters'

// Custom Modular Hooks
import { useTheme } from './hooks/useTheme'
import { useCompanyFilters } from './hooks/useCompanyFilters'
import { useLocationFilters } from './hooks/useLocationFilters'
import { useDashboardData } from './hooks/useDashboardData'
import { useMultiCity } from './hooks/useMultiCity'
import { useCompanyDrilldown } from './hooks/useCompanyDrilldown'

// UI Components
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // 1. Theme State
  const { theme, toggleTheme } = useTheme()

  // 2. Company & Competitor Filters
  const companyFilters = useCompanyFilters()
  const { selectedCompanies } = companyFilters

  // 3. Location, Fuel & Time Filters
  const locationFilters = useLocationFilters()
  const {
    timeFilter, setTimeFilter,
    fromYear, setFromYear,
    toYear, setToYear,
    selectedFuels, setSelectedFuels,
    toggleFuel, removeFuel,
    fuelType,
    stateCode, setStateCode,
    selectedCities, setSelectedCities,
    areaInput, setAreaInput,
    isAreaDropdownOpen, setIsAreaDropdownOpen,
    cities, rtoCode, setRtoCode,
    filteredRtos
  } = locationFilters

  // 4. Main Dashboard Data Engine
  const dashboardData = useDashboardData({
    selectedCompanies,
    timeFilter,
    fromYear,
    toYear,
    fuelType,
    stateCode,
    rtoCode,
    selectedCities,
    filteredRtos
  })

  const {
    data, loading, loadingStatus, error,
    cityRtoData, loadingCityRto,
    durationTableYear, setDurationTableYear,
    cityRtoTableYear, setCityRtoTableYear,
    cityRtoMonthFilter, setCityRtoMonthFilter,
    applyFilters, getChartData, clearData
  } = dashboardData

  // 5. Multi-City Comparison Module
  const multiCity = useMultiCity({
    selectedCompanies,
    timeFilter,
    fromYear,
    toYear,
    fuelType
  })

  // 6. Interactive Drilldown Module (Click-to-Drilldown into State RTOs)
  const drilldown = useCompanyDrilldown({
    timeFilter,
    fromYear,
    toYear,
    stateCode,
    fuelType
  })

  const yearlyTrendChartData = useMemo(() => {
    return getChartData("Yearly Trend")
  }, [getChartData])

  const getColorForCompany = useCallback(
    (comp) => getCompanyColor(comp, selectedCompanies),
    [selectedCompanies]
  )

  const clearAllFilters = () => {
    companyFilters.clearCompanyFilters()
    locationFilters.clearLocationFilters()
    clearData()
    multiCity.clearMultiCity()
    drilldown.clearDrilldown()
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar Filters */}
      <SidebarFilters
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        loadingCompanies={companyFilters.loadingCompanies}
        companies={companyFilters.companies}
        baseCompanyInput={companyFilters.baseCompanyInput}
        setBaseCompanyInput={companyFilters.setBaseCompanyInput}
        isBaseDropdownOpen={companyFilters.isBaseDropdownOpen}
        setIsBaseDropdownOpen={companyFilters.setIsBaseDropdownOpen}
        filteredBaseCompanies={companyFilters.filteredBaseCompanies}
        loadingBaseSearch={companyFilters.loadingBaseSearch}
        selectBaseCompany={companyFilters.selectBaseCompany}
        baseCompany={companyFilters.baseCompany}
        getCompanyColor={getColorForCompany}
        competitorInput={companyFilters.competitorInput}
        setCompetitorInput={companyFilters.setCompetitorInput}
        isCompetitorDropdownOpen={companyFilters.isCompetitorDropdownOpen}
        setIsCompetitorDropdownOpen={companyFilters.setIsCompetitorDropdownOpen}
        filteredCompetitorCompanies={companyFilters.filteredCompetitorCompanies}
        loadingCompetitorSearch={companyFilters.loadingCompetitorSearch}
        selectCompetitor={companyFilters.selectCompetitor}
        competitorCompanies={companyFilters.competitorCompanies}
        removeCompetitor={companyFilters.removeCompetitor}
        timeFilter={timeFilter}
        setTimeFilter={setTimeFilter}
        fromYear={fromYear}
        setFromYear={setFromYear}
        toYear={toYear}
        setToYear={setToYear}
        selectedFuels={selectedFuels}
        setSelectedFuels={setSelectedFuels}
        toggleFuel={toggleFuel}
        removeFuel={removeFuel}
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

      {/* Main Content Area */}
      <main className="main-content" style={{ maxWidth: isSidebarOpen ? 'calc(100vw - 300px)' : '100vw' }}>
        <Header
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          loadingCompanies={companyFilters.loadingCompanies}
          companiesCount={companyFilters.companies.length}
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
          selectedFuels={selectedFuels}
          setSelectedFuels={setSelectedFuels}
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
                multiCityStateCode={multiCity.multiCityStateCode}
                handleMultiCityStateChange={multiCity.handleMultiCityStateChange}
                multiCityAvailableCities={multiCity.multiCityAvailableCities}
                multiCitySearchInput={multiCity.multiCitySearchInput}
                setMultiCitySearchInput={multiCity.setMultiCitySearchInput}
                loadingMultiCityRtos={multiCity.loadingMultiCityRtos}
                isMultiCityDropdownOpen={multiCity.isMultiCityDropdownOpen}
                setIsMultiCityDropdownOpen={multiCity.setIsMultiCityDropdownOpen}
                toggleMultiCity={multiCity.toggleMultiCity}
                removeMultiCity={multiCity.removeMultiCity}
                selectedMultiCities={multiCity.selectedMultiCities}
                loadingMultiCity={multiCity.loadingMultiCity}
                loadingMultiCityStatus={multiCity.loadingMultiCityStatus}
                multiCityData={multiCity.multiCityData}
                fetchMultiCityComparisonData={multiCity.fetchMultiCityComparisonData}
                selectedCompanies={selectedCompanies}
                getCompanyColor={getColorForCompany}
              />

              <Top5TerritoriesSection
                rtoCode={rtoCode}
                selectedCities={selectedCities}
                stateCode={stateCode}
                selectedCompanies={selectedCompanies}
                companyDrilldown={drilldown.companyDrilldown}
                handleCompanyBarClick={drilldown.handleCompanyBarClick}
                resetCompanyDrilldown={drilldown.resetCompanyDrilldown}
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
