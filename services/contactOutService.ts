// WARNING: Storing API keys in frontend code is a major security risk.
// In a production application, this logic should be moved to a secure backend server 
// that can safely store the API key and proxy requests to the ContactOut API.
// For the constraints of this project, the key is included here directly.
const API_KEY = 'w3XcLoZhLt2W4AIhw8STwtG0';
const API_URL = 'https://api.contactout.com/v1/people/search';

interface ContactOutProfile {
  contact_info?: {
    emails?: string[];
    personal_emails?: string[];
    work_emails?: string[];
    phones?: string[];
  };
}

interface ContactOutResponse {
  profiles: { [key: string]: ContactOutProfile } | [];
}

export interface ContactOutData {
    emails: string[];
    phones: string[];
}

export const enrichContact = async (
    name: string,
    role: string,
    company: string
): Promise<ContactOutData | null> => {
    try {
        const payload: {
            name: string;
            job_title?: string[];
            company?: string[];
            match_experience: string;
            data_types: string[];
            reveal_info: boolean;
        } = {
            name: name,
            match_experience: "both",
            data_types: ['personal_email', 'work_email', 'phone'],
            reveal_info: true,
        };

        if (role && role.toLowerCase() !== 'not found') {
            payload.job_title = [role];
        }
        if (company) {
            payload.company = [company];
        }

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'token': API_KEY,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error('ContactOut API Error:', response.status, await response.text());
            throw new Error(`ContactOut API request failed with status ${response.status}`);
        }

        const data: ContactOutResponse = await response.json();

        const profiles = Array.isArray(data.profiles) ? [] : Object.values(data.profiles);

        if (profiles.length === 0) {
            return null; // No profiles found
        }
        
        const allEmails = new Set<string>();
        const allPhones = new Set<string>();

        profiles.forEach(profile => {
            profile.contact_info?.emails?.forEach(email => allEmails.add(email));
            profile.contact_info?.phones?.forEach(phone => allPhones.add(phone));
        });

        if (allEmails.size === 0 && allPhones.size === 0) {
            return null; // Profiles found, but no contact info revealed
        }
        
        return {
            emails: Array.from(allEmails),
            phones: Array.from(allPhones),
        };

    } catch (error) {
        console.error('Failed to enrich contact:', error);
        throw error;
    }
};