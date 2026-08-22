import { useState, useEffect } from 'react'

export const useTheme = () => {
  const [theme, setTheme] = useState("light")

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return { theme, toggleTheme }
}
