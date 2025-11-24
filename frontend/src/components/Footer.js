import React from 'react';
import { Apple, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        
        {/* Brand Section */}
        <div className="footer-section">
          <div className="footer-brand">
            <div className="brand-logo">
              <Apple size={32} />
              <span>AppleVerse 2.0</span>
            </div>
            <p className="brand-description">
              Your interactive platform to explore, manage, and track apple varieties worldwide with bulk uploads and an organized library.
            </p>
            <div className="social-links">
              <a href="https://x.com/AAFC_Canada?s=09" target="_blank" rel="noopener noreferrer" className="social-link">Twitter</a>
              <a href="https://www.linkedin.com/company/aafc-aac/posts/?feedView=all" target="_blank" rel="noopener noreferrer" className="social-link">LinkedIn</a>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul className="footer-links">
            <li><a href="/library">Search Apples</a></li>
            <li><a href="/library">All Varieties</a></li>
            <li><a href="/library">Export Data</a></li>
            <li><a href="/about">About Page</a></li>
          </ul>
        </div>

        {/* Resources */}
        <div className="footer-section">
          <h3>Resources</h3>
          <ul className="footer-links">
            <li>
              <a href="https://agriculture.canada.ca" target="_blank" rel="noopener noreferrer">
                Agriculture Canada <ExternalLink size={14} />
              </a>
            </li>
            <li>
              <a href="https://docs.google.com/document/d/1at6Y0BkwUhH0Mk2pLhK5okrpyaP3VoLgzigisBrTWjA/edit?usp=sharing" target="_blank" rel="noopener noreferrer">
                Documentation <ExternalLink size={14} />
              </a>
            </li>
          </ul>
        </div>

        {/* Contact & Info */}
        <div className="footer-section">
          <h3>Contact & Support</h3>
          <div className="contact-info">
            <div className="contact-item">
              <Mail size={16} />
              <span>support@appleverse.ca</span>
            </div>
            <div className="contact-item">
              <Phone size={16} />
              <span>+1 (555) 123-4567</span>
            </div>
            <div className="contact-item">
              <MapPin size={16} />
              <span>Ontario, Canada</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <div className="copyright">
            &copy; 2025 AppleVerse 2.0. All rights reserved.
          </div>
          <div className="footer-bottom-links">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
            <a href="/cookies">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;