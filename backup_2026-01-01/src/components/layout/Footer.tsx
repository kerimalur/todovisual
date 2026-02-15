'use client';

import Link from 'next/link';
import { Github, Twitter, Heart } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Brand */}
        <div className="footer-brand">
          <div className="footer-logo">
            <div className="footer-logo-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span>Productive</span>
          </div>
          <p className="footer-tagline">
            Organisiere dein Leben. Erreiche deine Ziele.
          </p>
        </div>

        {/* Links */}
        <div className="footer-links">
          <div className="footer-links-group">
            <h4>Produkt</h4>
            <Link href="/">Dashboard</Link>
            <Link href="/tasks">Aufgaben</Link>
            <Link href="/goals">Ziele</Link>
            <Link href="/projects">Projekte</Link>
          </div>
          <div className="footer-links-group">
            <h4>Ressourcen</h4>
            <Link href="/matrix">Eisenhower Matrix</Link>
            <Link href="/calendar">Kalender</Link>
            <Link href="/journal">Journal</Link>
            <Link href="/progress">Fortschritt</Link>
          </div>
          <div className="footer-links-group">
            <h4>Support</h4>
            <Link href="/settings">Einstellungen</Link>
            <Link href="/archive">Archiv</Link>
            <a href="#">Hilfe</a>
            <a href="#">Feedback</a>
          </div>
        </div>

        {/* Bottom */}
        <div className="footer-bottom">
          <div className="footer-copyright">
            <span>© {currentYear} Productive.</span>
            <span className="footer-made-with">
              Made with <Heart size={12} className="footer-heart" /> in Germany
            </span>
          </div>
          <div className="footer-social">
            <a href="#" className="footer-social-link" title="GitHub">
              <Github size={18} />
            </a>
            <a href="#" className="footer-social-link" title="Twitter">
              <Twitter size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
