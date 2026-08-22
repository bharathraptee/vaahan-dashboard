import { useState, useEffect, useMemo } from 'react'
import { fetchCompanies } from '../api'
import { searchAndSortCompanies } from '../utils/formatters'

export const useCompanyFilters = () => {
  const [companies, setCompanies] = useState([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [baseCompany, setBaseCompany] = useState("")
  const [baseCompanyInput, setBaseCompanyInput] = useState("")
  const [isBaseDropdownOpen, setIsBaseDropdownOpen] = useState(false)

  const [competitorCompanies, setCompetitorCompanies] = useState([])
  const [competitorInput, setCompetitorInput] = useState("")
  const [isCompetitorDropdownOpen, setIsCompetitorDropdownOpen] = useState(false)

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

  const selectedCompanies = useMemo(() => {
    const list = []
    if (baseCompany) list.push(baseCompany)
    competitorCompanies.forEach(c => {
      if (!list.includes(c)) list.push(c)
    })
    return list
  }, [baseCompany, competitorCompanies])

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

  const clearCompanyFilters = () => {
    setBaseCompany("")
    setCompetitorCompanies([])
    setBaseCompanyInput("")
    setCompetitorInput("")
  }

  return {
    companies,
    loadingCompanies,
    baseCompany,
    baseCompanyInput,
    setBaseCompanyInput,
    isBaseDropdownOpen,
    setIsBaseDropdownOpen,
    filteredBaseCompanies,
    selectBaseCompany,
    competitorCompanies,
    competitorInput,
    setCompetitorInput,
    isCompetitorDropdownOpen,
    setIsCompetitorDropdownOpen,
    filteredCompetitorCompanies,
    selectCompetitor,
    removeCompetitor,
    selectedCompanies,
    clearCompanyFilters
  }
}
