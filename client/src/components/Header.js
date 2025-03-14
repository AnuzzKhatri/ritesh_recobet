import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <h1>Ritesh_Recobet</h1>
        </Link>
        <nav className="nav">
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <a href="https://github.com/yourusername/pdf-editor" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header; 