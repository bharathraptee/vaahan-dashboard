import { useState, useEffect, useMemo } from 'react'
import { fetchRtos } from '../api'
import { extractCleanCity } from '../utils/formatters'

export const useLocationFilters = () => {
  const [timeFilter, setTimeFilter] = useState("As on Date")
  const [fromYear, setFromYear] = useState(2026)
  const [toYear, setToYear] = useState(2026)
  
  // Multi-Fuel Selection State
  const [selectedFuels, setSelectedFuels] = useState([])
  const fuelType = useMemo(() => selectedFuels.join(","), [selectedFuels])

  const toggleFuel = (fuelVal) => {
    if (!fuelVal) {
      setSelectedFuels([])
      return
    }
    if (selectedFuels.includes(fuelVal)) {
      setSelectedFuels(selectedFuels.filter(f => f !== fuelVal))
    } else {
      setSelectedFuels([...selectedFuels, fuelVal])
    }
  }

  const removeFuel = (fuelVal) => {
    setSelectedFuels(selectedFuels.filter(f => f !== fuelVal))
  }

  const [stateCode, setStateCode] = useState("")
  const [rtos, setRtos] = useState([])
  const [selectedCities, setSelectedCities] = useState([])
  const [areaInput, setAreaInput] = useState("")
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false)
  const [rtoCode, setRtoCode] = useState(0)

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

  const filteredRtos = useMemo(() => {
    if (selectedCities.length === 0) return rtos
    return rtos.filter(r => selectedCities.includes(extractCleanCity(r.rtoName)))
  }, [rtos, selectedCities])

  const clearLocationFilters = () => {
    setTimeFilter("As on Date")
    setFromYear(2026)
    setToYear(2026)
    setSelectedFuels([])
    setStateCode("")
    setRtos([])
    setSelectedCities([])
    setAreaInput("")
    setRtoCode(0)
  }

  return {
    timeFilter,
    setTimeFilter,
    fromYear,
    setFromYear,
    toYear,
    setToYear,
    selectedFuels,
    setSelectedFuels,
    toggleFuel,
    removeFuel,
    fuelType,
    stateCode,
    setStateCode,
    rtos,
    cities,
    selectedCities,
    setSelectedCities,
    areaInput,
    setAreaInput,
    isAreaDropdownOpen,
    setIsAreaDropdownOpen,
    rtoCode,
    setRtoCode,
    filteredRtos,
    clearLocationFilters
  }
}
