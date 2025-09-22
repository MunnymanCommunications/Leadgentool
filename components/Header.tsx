
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
             <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-teal-400 rounded-full flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
             </div>
            <h1 className="text-xl font-bold text-gray-100">Deep Research AI</h1>
          </div>
        </div>
      </div>
    </header>
  );
};
