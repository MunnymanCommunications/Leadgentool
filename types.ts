export interface EnrichedContactInfo {
  value: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface EnrichedData {
  summary?: string;
  linkedinUrl?: string;
  emails: EnrichedContactInfo[];
  phones: EnrichedContactInfo[];
}

export interface Lead {
  name: string;
  role: string;
  email: string;
  phone: string;
  isPrimaryTarget?: boolean;
  enrichedData?: EnrichedData;
  enrichmentStatus?: 'pending' | 'enriched' | 'not_found' | 'failed';
  enrichmentError?: string;
}

export interface GroundingChunkContent {
    // FIX: The `uri` property from the Gemini API can be optional. Making it optional here to match the source type and resolve the TypeScript error.
    uri?: string;
    // FIX: The `title` property from the Gemini API can be optional. Making it optional here for type consistency and robust handling in components.
    title?: string;
}

export interface GroundingChunk {
    // FIX: The `web` property can be optional in the Gemini API's GroundingChunk type. Making it optional here to resolve the TypeScript error.
    web?: GroundingChunkContent;
}
