import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SECTIONS } from '../api/sections'

const CategorySelect = ({ value = 'trending', onChange = () => {} }) => {
  return (
    <div className="filter-bar">
      <span className="filter-label">Filter by:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full max-w-48">
          <SelectValue placeholder="Filter by..." />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Filter by</SelectLabel>
            {SECTIONS.map((section) => {
              return (
                <SelectItem key={section.key} value={section.key}>
                  {section.title}
                </SelectItem>
              )
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export default CategorySelect
