import { useState, useCallback } from 'react'
import { fetchCompareData, fetchCityRtoBreakdown } from '../api'
import { formatMultiSeriesChartData } from '../utils/formatters'

export const useDashboardData = ({
  selectedCompanies,
  timeFilter,
  fromYear,
  toYear,
  fuelType,
  stateCode,
  rtoCode,
  selectedCities,
  filteredRtos
}) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState("")
  const [error, setError] = useState(null)

  const [cityRtoData, setCityRtoData] = useState(null)
  const [loadingCityRto, setLoadingCityRto] = useState(false)
  const [durationTableYear, setDurationTableYear] = useState("")
  const [cityRtoTableYear, setCityRtoTableYear] = useState("")
  const [cityRtoMonthFilter, setCityRtoMonthFilter] = useState("")

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
        fuelType: fuelType || "",
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

  const clearData = () => {
    setData(null)
    setCityRtoData(null)
    setError(null)
  }

  return {
    data,
    loading,
    loadingStatus,
    error,
    cityRtoData,
    loadingCityRto,
    durationTableYear,
    setDurationTableYear,
    cityRtoTableYear,
    setCityRtoTableYear,
    cityRtoMonthFilter,
    setCityRtoMonthFilter,
    applyFilters,
    getChartData,
    clearData
  }
}
