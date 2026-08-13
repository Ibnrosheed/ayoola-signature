import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Facebook, Twitter } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-amber-900/20 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand Bio */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-400/40 flex items-center justify-center text-amber-400 font-serif font-bold text-sm">
                AS
              </div>
              <span className="font-serif text-xl font-bold tracking-widest text-white">
                AYOOLA SIGNATURE
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Redefining bespoke luxury and modern fashion. Crafted for those who demand elegance, distinction, and timeless prestige.
            </p>
            <div className="flex items-center space-x-4 pt-2">
              <a href="#" className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 hover:bg-amber-600 hover:text-white transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 hover:bg-amber-600 hover:text-white transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 hover:bg-amber-600 hover:text-white transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="text-amber-400 font-serif text-lg font-semibold tracking-wider mb-4 border-b border-slate-800 pb-2">
              Boutique
            </h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><Link to="/shop" className="hover:text-amber-400 transition-colors">New Arrivals</Link></li>
              <li><Link to="/categories" className="hover:text-amber-400 transition-colors">Signature Collections</Link></li>
              <li><Link to="/shop" className="hover:text-amber-400 transition-colors">Bespoke Apparel</Link></li>
              <li><Link to="/shop" className="hover:text-amber-400 transition-colors">Luxury Accessories</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-amber-400 font-serif text-lg font-semibold tracking-wider mb-4 border-b border-slate-800 pb-2">
              Client Care
            </h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><Link to="/account" className="hover:text-amber-400 transition-colors">My Account</Link></li>
              <li><Link to="/cart" className="hover:text-amber-400 transition-colors">Shopping Bag</Link></li>
              <li><Link to="/checkout" className="hover:text-amber-400 transition-colors">Checkout</Link></li>
              <li><span className="text-slate-500 cursor-not-allowed">Shipping & Returns</span></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-amber-400 font-serif text-lg font-semibold tracking-wider mb-4 border-b border-slate-800 pb-2">
              Concierge
            </h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Victoria Island, Lagos, Nigeria</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>+234 (0) 800 AYOOLA</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>concierge@ayoolasignature.com</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Ayoola Signature. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <span className="hover:text-slate-200 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-200 cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
