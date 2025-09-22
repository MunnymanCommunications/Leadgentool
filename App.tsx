import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { LeadCard } from './components/LeadCard';
import { SourceLink } from './components/SourceLink';
import { Loader } from './components/Loader';
import { findCompanyLeads } from './services/geminiService';
import { enrichContact } from './services/contactOutService';
import type { Lead, GroundingChunk } from './types';
import { OverviewCard } from './components/OverviewCard';
import { WebhookInfo } from './components/WebhookInfo';

const App: React.FC = () => {
  const [companyInput, setCompanyInput] = useState<string>('');
  const [locationInput, setLocationInput] = useState<string>('');
  const [overview, setOverview] = useState<string>('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showWebhookInfo, setShowWebhookInfo] = useState<boolean>(false);


  const handleResearch = useCallback(async () => {
    if (!companyInput.trim()) {
      setError('Please enter a company name or website.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setOverview('');
    setLeads([]);
    setSources([]);

    try {
      const result = await findCompanyLeads(companyInput, locationInput);
      setOverview(result.overview);
      setLeads(result.leads);
      setSources(result.sources);
    } catch (err) {
      console.error(err);
      setError(
        'Failed to fetch or parse research data. The AI may have returned an unexpected format. Please try refining your query.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [companyInput, locationInput]);

  const handleEnrichLead = useCallback(async (leadIndex: number) => {
    const leadToEnrich = leads[leadIndex];
    if (!leadToEnrich || leadToEnrich.enrichmentStatus === 'pending') {
      return;
    }

    setLeads(currentLeads => {
        const newLeads = [...currentLeads];
        newLeads[leadIndex] = { ...newLeads[leadIndex], enrichmentStatus: 'pending', enrichmentError: undefined };
        return newLeads;
    });

    try {
        const enrichedData = await enrichContact(leadToEnrich.name, leadToEnrich.role, companyInput);
        
        setLeads(currentLeads => {
            const newLeads = [...currentLeads];
            const currentLead = newLeads[leadIndex];
            if (enrichedData && (enrichedData.emails.length > 0 || enrichedData.phones.length > 0)) {
                newLeads[leadIndex] = {
                    ...currentLead,
                    enrichedData,
                    enrichmentStatus: 'enriched'
                };
            } else {
                newLeads[leadIndex] = { ...currentLead, enrichmentStatus: 'not_found' };
            }
            return newLeads;
        });
    } catch (error) {
        console.error("Enrichment failed:", error);
        const errorMessage = error instanceof Error && error.message.includes('Failed to fetch')
            ? 'A network error occurred. This may be due to browser security (CORS) policies blocking the request from this domain. The standard solution is to use a backend proxy.'
            : 'An unexpected error occurred during enrichment.';

        setLeads(currentLeads => {
            const newLeads = [...currentLeads];
            newLeads[leadIndex] = { 
                ...newLeads[leadIndex], 
                enrichmentStatus: 'failed',
                enrichmentError: errorMessage 
            };
            return newLeads;
        });
    }
}, [leads, companyInput]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto bg-gray-800/50 rounded-2xl shadow-2xl shadow-blue-500/10 border border-gray-700 p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300 mb-2">
            AI-Powered Lead Engine
          </h2>
          <p className="text-gray-400 mb-6">
            Enter a company name or website to find key contacts, company insights, and talking points.
          </p>

          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-2">
                Company Name or Website*
              </label>
              <input
                id="company"
                type="text"
                value={companyInput}
                onChange={(e) => setCompanyInput(e.target.value)}
                placeholder="e.g., 'Walmart' or 'walmart.com'"
                className="w-full bg-gray-900 border border-gray-600 rounded-md px-4 py-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
                Location (Optional)
              </label>
              <input
                id="location"
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="e.g., 'Bentonville, Arkansas'"
                className="w-full bg-gray-900 border border-gray-600 rounded-md px-4 py-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            onClick={handleResearch}
            disabled={isLoading || !companyInput.trim()}
            className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-all duration-300 ease-in-out transform hover:scale-105 disabled:scale-100"
          >
            {isLoading ? (
              <>
                <Loader />
                Researching...
              </>
            ) : (
              'Find Leads & Insights'
            )}
          </button>
           <div className="text-center mt-4">
              <button onClick={() => setShowWebhookInfo(!showWebhookInfo)} className="text-sm text-gray-400 hover:text-blue-400 underline transition-colors">
                  {showWebhookInfo ? 'Hide' : 'Show'} API/Webhook Info
              </button>
          </div>
          {showWebhookInfo && <WebhookInfo />}
        </div>

        {error && (
          <div className="max-w-3xl mx-auto mt-6 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert">
            <p><span className="font-bold">Error:</span> {error}</p>
          </div>
        )}

        { !isLoading && (overview || leads.length > 0 || sources.length > 0) && (
            <div className="max-w-3xl mx-auto mt-8 space-y-8">
              {overview && <OverviewCard overview={overview} />}
            
              {leads.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold text-gray-300 mb-4 border-b border-gray-700 pb-2">Identified Contacts</h3>
                    <div className="grid grid-cols-1 gap-4">
                        {leads.map((lead, index) => (
                            <LeadCard key={index} lead={lead} onEnrich={() => handleEnrichLead(index)} />
                        ))}
                    </div>
                </div>
              )}
                
              {sources.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold text-gray-300 mb-4 border-b border-gray-700 pb-2">Research Sources</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {sources.map((source, index) => (
                             <SourceLink key={index} source={source} />
                        ))}
                    </div>
                </div>
              )}
            </div>
        )}
      </main>
    </div>
  );
};

export default App;