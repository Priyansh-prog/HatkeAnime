import { Link } from 'react-router-dom'
import SearchBar from './SearchBar'

const Navbar = ({ searchValue, onSearchChange }) => {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          Hanime
          <span className="navbar-tagline">
            <span className="navbar-tagline-dot" />
            hatke anime
          </span>
        </Link>

        <nav className="navbar-links">
          <a href="#">Characters</a>
          <Link to="/watchlist">Watchlist</Link>
        </nav>

        <div className="navbar-actions">
          <SearchBar value={searchValue} onChange={onSearchChange} />
          <a href="#" className="navbar-login">
            sign up
          </a>
          <a href="#" className="navbar-login">
            log in
          </a>
        </div>
      </div>
    </header>
  )
}

export default Navbar
