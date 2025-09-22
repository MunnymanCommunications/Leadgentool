
import React from 'react';
import { InfoIcon } from './icons/InfoIcon';

interface OverviewCardProps {
    overview: string;
}

export const OverviewCard: React.FC<OverviewCardProps> = ({ overview }) => {
    return (
        <div>
            <h3 className="text-xl font-bold text-gray-300 mb-4 border-b border-gray-700 pb-2 flex items-center">
                <InfoIcon />
                <span className="ml-2">Company Insights</span>
            </h3>
            <div className="bg-gray-800/70 border border-gray-700 rounded-lg p-5">
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{overview}</p>
            </div>
        </div>
    );
};
