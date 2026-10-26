import { Link } from 'react-router-dom'
import SearchBar from './SearchBar'

const Navbar = ({ searchValue, onSearchChange }) => {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="navbar-left">
          <Link to="/home" className="navbar-brand">
            H-Anime
            <span className="navbar-tagline">
              <span className="navbar-tagline-dot" />
              hatke anime
            </span>
          </Link>

          <nav className="navbar-links">
            <Link to="/characters">Characters</Link>
            <Link to="/watchlist">Watchlist</Link>
          </nav>
        </div>

        <div className="navbar-actions">
          <SearchBar value={searchValue} onChange={onSearchChange} />
          <Link to="/login" className="navbar-login">
            log in
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Navbar
