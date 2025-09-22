
import React from 'react';
import type { GroundingChunk } from '../types';
import { LinkIcon } from './icons/LinkIcon';

interface SourceLinkProps {
    source: GroundingChunk;
}

export const SourceLink: React.FC<SourceLinkProps> = ({ source }) => {
    if (!source.web || !source.web.uri) {
        return null;
    }

    const { uri, title } = source.web;
    const displayUrl = uri.length > 50 ? `${uri.slice(0, 47)}...` : uri;

    return (
        <a 
            href={uri} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block bg-gray-800 border border-gray-700 rounded-lg p-4 transition-all duration-300 hover:bg-gray-700/50 hover:border-teal-500 group"
        >
            <div className="flex items-start space-x-3">
                <div className="mt-1 text-gray-500 group-hover:text-teal-400 transition-colors">
                    <LinkIcon />
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-semibold text-gray-200 truncate group-hover:text-teal-300 transition-colors" title={title || uri}>
                        {title || uri}
                    </p>
                    <p className="text-xs text-gray-400 truncate" title={uri}>{displayUrl}</p>
                </div>
            </div>
        </a>
    );
}
