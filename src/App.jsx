import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import CustomCursor from './components/CustomCursor'
import CategorySelect from './components/CategorySelect'
import AdvancedFilters from './components/AdvancedFilters'
import CategoryPage from './components/CategoryPage'
import AnimeDetailsPage from './components/AnimeDetailsPage'
import WatchlistPage from './components/WatchlistPage'
import AuthPage from './components/AuthPage'
import CharactersPage from './components/CharactersPage'
import { DEFAULT_FILTERS, hasActiveFilters } from './api/sections'

const useHomeState = () => {
  const [categoryKey, setCategoryKey] = useState('all-time')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [categoryKey])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 500)
    return () => clearTimeout(t)
  }, [query])

  return { categoryKey, setCategoryKey, query, setQuery, debouncedQuery, filters, setFilters }
}

const SearchHomeRedirect = ({ query }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const prevQuery = useRef(query)

  useEffect(() => {
    const changed = query !== prevQuery.current
    prevQuery.current = query
    if (changed && query.trim() && location.pathname !== '/home') navigate('/home')
  }, [query, location.pathname, navigate])

  return null
}

const HomePage = ({ home }) => {
  const activeQuery = home.debouncedQuery.length >= 3 ? home.debouncedQuery : ''
  const filterSig = JSON.stringify(home.filters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const filtersActive = hasActiveFilters(home.filters)

  return (
    <main>
      <div className="category-bar">
        <CategorySelect value={home.categoryKey} onChange={home.setCategoryKey} />
        <button
          className={filtersActive || filtersOpen ? 'adv-filter-btn active' : 'adv-filter-btn'}
          onClick={() => setFiltersOpen((o) => !o)}
        >
          {filtersOpen ? 'Hide Filters ▴' : 'Advanced Filters ▾'}
        </button>
      </div>
      {filtersOpen && <AdvancedFilters filters={home.filters} onChange={home.setFilters} />}
      <CategoryPage
        key={`${home.categoryKey}:${activeQuery}:${filterSig}`}
        sectionKey={home.categoryKey}
        query={activeQuery}
        filters={home.filters}
      />
    </main>
  )
}

const App = () => {
  const home = useHomeState()

  return (
    <BrowserRouter>
      <div>
        <CustomCursor />
        <Navbar searchValue={home.query} onSearchChange={home.setQuery} />
        <SearchHomeRedirect query={home.query} />
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage home={home} />} />
          <Route path="/anime/:id" element={<AnimeDetailsPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/characters" element={<CharactersPage />} />
          <Route
            path="*"
            element={
              <main>
                <p>
                  Page not found. <a href="/home">Back to browse</a>
                </p>
              </main>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
