import { useState, useEffect, useMemo, useRef } from 'react'
import { fetchCompanies } from '../api'
import { searchAndSortCompanies } from '../utils/formatters'

export const useCompanyFilters = () => {
  const [companies, setCompanies] = useState([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)

  const [baseCompany, setBaseCompany] = useState("")
  const [baseCompanyInput, setBaseCompanyInput] = useState("")
  const [isBaseDropdownOpen, setIsBaseDropdownOpen] = useState(false)
  const [baseSearchResults, setBaseSearchResults] = useState(null)
  const [loadingBaseSearch, setLoadingBaseSearch] = useState(false)

  const [competitorCompanies, setCompetitorCompanies] = useState([])
  const [competitorInput, setCompetitorInput] = useState("")
  const [isCompetitorDropdownOpen, setIsCompetitorDropdownOpen] = useState(false)
  const [competitorSearchResults, setCompetitorSearchResults] = useState(null)
  const [loadingCompetitorSearch, setLoadingCompetitorSearch] = useState(false)

  const baseTimerRef = useRef(null)
  const competitorTimerRef = useRef(null)

  // 1. Initial Load: Load maker directory
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

  // 2. Vahan 300ms Debounce Search for Base Company
  useEffect(() => {
    const term = baseCompanyInput.trim()
    if (!term) {
      setBaseSearchResults(null)
      setLoadingBaseSearch(false)
      return
    }

    setLoadingBaseSearch(true)
    if (baseTimerRef.current) clearTimeout(baseTimerRef.current)

    baseTimerRef.current = setTimeout(async () => {
      try {
        const results = await fetchCompanies(term, 0, 25)
        setBaseSearchResults(results)
      } catch (err) {
        console.error("Vahan maker live search error:", err)
        // Fallback to local search
        setBaseSearchResults(searchAndSortCompanies(companies, term).slice(0, 25))
      } finally {
        setLoadingBaseSearch(false)
      }
    }, 300) // Exact 300ms debounce matching Vahan portal

    return () => {
      if (baseTimerRef.current) clearTimeout(baseTimerRef.current)
    }
  }, [baseCompanyInput, companies])

  // 3. Vahan 300ms Debounce Search for Competitor Companies
  useEffect(() => {
    const term = competitorInput.trim()
    if (!term) {
      setCompetitorSearchResults(null)
      setLoadingCompetitorSearch(false)
      return
    }

    setLoadingCompetitorSearch(true)
    if (competitorTimerRef.current) clearTimeout(competitorTimerRef.current)

    competitorTimerRef.current = setTimeout(async () => {
      try {
        const results = await fetchCompanies(term, 0, 25)
        setCompetitorSearchResults(results)
      } catch (err) {
        console.error("Vahan competitor live search error:", err)
        // Fallback to local search
        setCompetitorSearchResults(searchAndSortCompanies(companies, term).slice(0, 25))
      } finally {
        setLoadingCompetitorSearch(false)
      }
    }, 300) // Exact 300ms debounce matching Vahan portal

    return () => {
      if (competitorTimerRef.current) clearTimeout(competitorTimerRef.current)
    }
  }, [competitorInput, companies])

  const selectedCompanies = useMemo(() => {
    const list = []
    if (baseCompany) list.push(baseCompany)
    competitorCompanies.forEach(c => {
      if (!list.includes(c)) list.push(c)
    })
    return list
  }, [baseCompany, competitorCompanies])

  // If live search results exist, show them; otherwise show default top companies
  const filteredBaseCompanies = useMemo(() => {
    if (baseSearchResults !== null) {
      return baseSearchResults
    }
    return companies.slice(0, 25)
  }, [baseSearchResults, companies])

  const filteredCompetitorCompanies = useMemo(() => {
    let sourceList = competitorSearchResults !== null ? competitorSearchResults : companies.slice(0, 25)
    return sourceList.filter(c => c !== baseCompany && !competitorCompanies.includes(c))
  }, [competitorSearchResults, companies, baseCompany, competitorCompanies])

  const selectBaseCompany = (companyName) => {
    setBaseCompany(companyName)
    setCompetitorCompanies(competitorCompanies.filter(c => c !== companyName))
    setBaseCompanyInput("")
    setBaseSearchResults(null)
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
    setCompetitorSearchResults(null)
  }

  const removeCompetitor = (companyName) => {
    setCompetitorCompanies(competitorCompanies.filter(c => c !== companyName))
  }

  const clearCompanyFilters = () => {
    setBaseCompany("")
    setCompetitorCompanies([])
    setBaseCompanyInput("")
    setCompetitorInput("")
    setBaseSearchResults(null)
    setCompetitorSearchResults(null)
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
    loadingBaseSearch,
    selectBaseCompany,
    competitorCompanies,
    competitorInput,
    setCompetitorInput,
    isCompetitorDropdownOpen,
    setIsCompetitorDropdownOpen,
    filteredCompetitorCompanies,
    loadingCompetitorSearch,
    selectCompetitor,
    removeCompetitor,
    selectedCompanies,
    clearCompanyFilters
  }
}
