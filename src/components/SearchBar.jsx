import { useState } from 'react'
import { Input } from '@/components/ui/input'

const SearchBar = ({ placeholder = 'Search anime...', value, onChange }) => {
  const [inner, setInner] = useState('')
  const query = value ?? inner
  const handleChange = (e) => {
    if (onChange) onChange(e.target.value)
    else setInner(e.target.value)
  }

  if (placeholder.trim() === '') return null

  return (
    <Input
      className="search-bar"
      value={query}
      onChange={handleChange}
      placeholder={placeholder}
    />
  )
}

export default SearchBar
