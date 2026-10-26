import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DEFAULT_FILTERS,
  GENRE_OPTIONS,
  YEAR_OPTIONS,
  SEASON_OPTIONS,
  FORMAT_OPTIONS,
  STATUS_OPTIONS,
  hasActiveFilters,
} from '../api/sections'

const genreLabel = (slug) => GENRE_OPTIONS.find((g) => g.slug === slug)?.label ?? slug

const FilterSelect = ({ label, value, options, onChange }) => {
  return (
    <div className="adv-filter-group">
      <span className="filter-label">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Any" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((opt) => {
              const val = opt.value ?? opt
              const text = opt.label ?? (opt === 'any' ? 'Any' : opt)
              return (
                <SelectItem key={val} value={val}>
                  {text}
                </SelectItem>
              )
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

const AdvancedFilters = ({ filters = DEFAULT_FILTERS, onChange = () => {} }) => {
  const panelRef = useRef(null)
  const active = hasActiveFilters(filters)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = gsap.context(() => {
      const groups = Array.from(panelRef.current.querySelectorAll('.adv-filter-group')).reverse()
      gsap.fromTo(
        groups,
        { y: -40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, ease: 'power2.out', stagger: 0.1 },
      )
    }, panelRef)

    return () => ctx.revert()
  }, [])

  const set = (patch) => onChange({ ...filters, ...patch })

  const addGenre = (slug) => {
    if (!slug || slug === 'any' || filters.genres.includes(slug)) return
    set({ genres: [...filters.genres, slug] })
  }

  const removeGenre = (slug) => {
    set({ genres: filters.genres.filter((g) => g !== slug) })
  }

  return (
    <div className="adv-filter-panel" ref={panelRef}>
      <div className="adv-filter-group">
        <span className="filter-label">Genres & Tags</span>
        <Select
          value="any"
          onValueChange={(v) => (v === 'any' ? set({ genres: [] }) : addGenre(v))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="any">Any</SelectItem>
              {GENRE_OPTIONS.map((g) => (
                <SelectItem key={g.slug} value={g.slug}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {filters.genres.length > 0 && (
          <div className="genre-chips">
            {filters.genres.map((slug) => (
              <span className="tag-pill genre-chip" key={slug}>
                {genreLabel(slug)}
                <button aria-label={`Remove ${genreLabel(slug)}`} onClick={() => removeGenre(slug)}>
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <FilterSelect
        label="Year"
        value={filters.year}
        options={YEAR_OPTIONS}
        onChange={(v) => set({ year: v })}
      />
      <FilterSelect
        label="Season"
        value={filters.season}
        options={SEASON_OPTIONS}
        onChange={(v) => set({ season: v })}
      />
      <FilterSelect
        label="Format"
        value={filters.format}
        options={FORMAT_OPTIONS}
        onChange={(v) => set({ format: v })}
      />
      <FilterSelect
        label="Airing Status"
        value={filters.status}
        options={STATUS_OPTIONS}
        onChange={(v) => set({ status: v })}
      />

      {active && (
        <button className="view-all-btn adv-clear-btn" onClick={() => onChange(DEFAULT_FILTERS)}>
          Clear all
        </button>
      )}
    </div>
  )
}

export default AdvancedFilters
