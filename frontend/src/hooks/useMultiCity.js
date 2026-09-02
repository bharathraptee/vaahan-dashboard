import { useState, useMemo } from 'react'
import { fetchRtos, fetchCityRtoBreakdown } from '../api'
import { extractCleanCity } from '../utils/formatters'

export const useMultiCity = ({ selectedCompanies, timeFilter, fromYear, toYear, fuelType }) => {
  const [multiCityStateCode, setMultiCityStateCode] = useState("")
  const [multiCityRtos, setMultiCityRtos] = useState([])
  const [loadingMultiCityRtos, setLoadingMultiCityRtos] = useState(false)
  const [selectedMultiCities, setSelectedMultiCities] = useState([])
  const [multiCityData, setMultiCityData] = useState(null)
  const [loadingMultiCity, setLoadingMultiCity] = useState(false)
  const [loadingMultiCityStatus, setLoadingMultiCityStatus] = useState("")
  const [isMultiCityDropdownOpen, setIsMultiCityDropdownOpen] = useState(false)
  const [multiCitySearchInput, setMultiCitySearchInput] = useState("")

  const multiCityAvailableCities = useMemo(() => {
    const citySet = new Set()
    multiCityRtos.forEach(r => {
      const city = extractCleanCity(r.rtoName)
      if (city) citySet.add(city)
    })
    return Array.from(citySet).sort()
  }, [multiCityRtos])

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
        fuelType: fuelType || "",
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

  const clearMultiCity = () => {
    setMultiCityStateCode("")
    setMultiCityRtos([])
    setSelectedMultiCities([])
    setMultiCityData(null)
  }

  return {
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
    clearMultiCity
  }
}
