import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p>&copy; {new Date().getFullYear()} Ritesh_Recobet. All rights reserved.</p>
        <div className="footer-links">
          <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Contact</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 