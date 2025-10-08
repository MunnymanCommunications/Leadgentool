
import React, { useState } from 'react';
import type { Lead, EnrichedContactInfo } from '../types';
import { UserIcon } from './icons/UserIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { EmailIcon } from './icons/EmailIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { Loader } from './Loader';
import { LinkedinIcon } from './icons/LinkedinIcon';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';


interface LeadCardProps {
  lead: Lead;
  onEnrich: () => void;
}

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => {
    const isAvailable = value && value.toLowerCase() !== 'not found';
    return (
        <div className="flex items-start space-x-3">
            <span className={`mt-1 ${isAvailable ? 'text-blue-400' : 'text-gray-600'}`}>
                {icon}
            </span>
            <div className="flex-1">
                <p className="text-sm text-gray-400">{label}</p>
                <p className={`font-medium ${isAvailable ? 'text-gray-200' : 'text-gray-500 italic'}`}>
                    {value}
                </p>
            </div>
        </div>
    );
};

const CopyableRow: React.FC<{ info: EnrichedContactInfo }> = ({ info }) => {
    const [isCopied, setIsCopied] = useState(false);

    const confidenceStyles = {
        high: 'bg-green-500/20 text-green-300 border-green-500/30',
        medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };

    const handleCopy = () => {
        if (!info.value) return;
        navigator.clipboard.writeText(info.value);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="flex justify-between items-center text-sm group bg-gray-900/50 p-2 rounded-md border border-gray-700/50">
            <span className="text-gray-200 font-mono break-all mr-2">{info.value}</span>
            <div className="flex items-center space-x-2 flex-shrink-0 ml-auto">
                 <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${confidenceStyles[info.confidence]}`}>
                    {info.confidence}
                </span>
                <button 
                    onClick={handleCopy} 
                    className="text-gray-400 hover:text-white transition-all duration-200"
                    aria-label={`Copy ${info.value}`}
                    title="Copy to clipboard"
                >
                    {isCopied ? <CheckIcon /> : <CopyIcon />}
                </button>
            </div>
        </div>
    );
};


export const LeadCard: React.FC<LeadCardProps> = ({ lead, onEnrich }) => {
  const hasEnrichedData = lead.enrichedData && (
    lead.enrichedData.summary ||
    lead.enrichedData.linkedinUrl ||
    (lead.enrichedData.emails && lead.enrichedData.emails.length > 0) ||
    (lead.enrichedData.phones && lead.enrichedData.phones.length > 0)
  );

  const confidenceOrder: { [key in 'high' | 'medium' | 'low']: number } = { high: 0, medium: 1, low: 2 };

  const sortedEmails = lead.enrichedData?.emails
    ? [...lead.enrichedData.emails].sort((a, b) => confidenceOrder[a.confidence] - confidenceOrder[b.confidence])
    : [];
    
  const sortedPhones = lead.enrichedData?.phones
    ? [...lead.enrichedData.phones].sort((a, b) => confidenceOrder[a.confidence] - confidenceOrder[b.confidence])
    : [];

  return (
    <div className="relative bg-gray-800/70 border border-gray-700 rounded-lg p-5 transition-all duration-300 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10">
        {lead.isPrimaryTarget && (
            <div className="absolute top-3 right-3 text-yellow-400" title="Primary Target Contact">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            </div>
        )}
        <div className="space-y-4">
            <InfoRow icon={<UserIcon />} label="Name" value={lead.name} />
            <InfoRow icon={<BriefcaseIcon />} label="Role" value={lead.role} />
            <InfoRow icon={<EmailIcon />} label="Email" value={lead.email} />
            <InfoRow icon={<PhoneIcon />} label="Phone" value={lead.phone} />
        </div>

        {lead.enrichmentStatus === 'enriched' && hasEnrichedData && (
            <div className="mt-4 pt-4 border-t border-gray-600 space-y-4">
                <h4 className="text-sm font-semibold text-teal-300">Enriched Profile</h4>
                
                {lead.enrichedData?.summary && (
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Professional Summary</p>
                        <p className="text-sm text-gray-300 leading-relaxed">{lead.enrichedData.summary}</p>
                    </div>
                )}

                {lead.enrichedData?.linkedinUrl && (
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Social Profile</p>
                        <a href={lead.enrichedData.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-2 text-sm text-blue-400 hover:text-blue-300 hover:underline">
                            <LinkedinIcon />
                            <span>View LinkedIn Profile</span>
                        </a>
                    </div>
                )}
                
                {sortedEmails.length > 0 && (
                     <div className="space-y-2">
                        <p className="text-xs text-gray-400">Verified Emails</p>
                        {sortedEmails.map(email => <CopyableRow key={email.value} info={email} />)}
                     </div>
                )}

                {sortedPhones.length > 0 && (
                     <div className="space-y-2">
                        <p className="text-xs text-gray-400">Verified Phone Numbers</p>
                        {sortedPhones.map(phone => <CopyableRow key={phone.value} info={phone} />)}
                     </div>
                )}
            </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-700">
          {(() => {
            switch (lead.enrichmentStatus) {
              case 'pending':
                return (
                  <button
                    disabled
                    className="w-full flex items-center justify-center text-sm bg-gray-600 cursor-not-allowed text-white font-bold py-2 px-4 rounded-md"
                  >
                    <Loader />
                    <span>Enriching...</span>
                  </button>
                );
              case 'enriched':
                return (
                  <p className="text-sm text-center text-green-400 font-semibold">
                    ✓ Profile Enriched
                  </p>
                );
              case 'not_found':
                return (
                  <p className="text-sm text-center text-gray-500">
                    No additional info found.
                  </p>
                );
              case 'failed':
                return (
                  <div className="text-center space-y-2">
                    <p className="text-sm text-red-400 font-semibold">
                      Enrichment failed
                    </p>
                    {lead.enrichmentError && (
                        <div className="text-xs text-left text-gray-400 bg-gray-900/50 p-3 rounded-md border border-gray-600">
                            <p><strong>Reason:</strong> {lead.enrichmentError}</p>
                        </div>
                    )}
                    <button
                      onClick={onEnrich}
                      className="w-full flex items-center justify-center text-sm bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition-all duration-300 ease-in-out"
                    >
                      <SparklesIcon />
                      <span className="ml-2">Try Again</span>
                    </button>
                  </div>
                );
              default:
                return (
                  <button
                    onClick={onEnrich}
                    className="w-full flex items-center justify-center text-sm bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition-all duration-300 ease-in-out transform hover:scale-105"
                  >
                    <SparklesIcon />
                    <span className="ml-2">Enrich Profile</span>
                  </button>
                );
            }
          })()}
        </div>
    </div>
  );
};
