import { useState } from 'react'
import { STATES } from '../constants/states'
import { fetchCompanyTop5Rtos } from '../api'

export const useCompanyDrilldown = ({ timeFilter, fromYear, toYear, stateCode }) => {
  const [companyDrilldown, setCompanyDrilldown] = useState({})

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

  const clearDrilldown = () => {
    setCompanyDrilldown({})
  }

  return {
    companyDrilldown,
    handleCompanyBarClick,
    resetCompanyDrilldown,
    clearDrilldown
  }
}
