import React from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] text-slate-900">
      <Header />
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {children}
      </main>
      <Footer />
    </div>
  );
};
