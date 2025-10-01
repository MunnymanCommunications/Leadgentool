
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { Lead, GroundingChunk, EnrichedData } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ResearchResult {
  overview: string;
  leads: Lead[];
  sources: GroundingChunk[];
}

const generatePrompt = (company: string, location: string): string => {
  return `
    You are a highly advanced corporate research AI specializing in lead generation. 
    Your task is to conduct deep research on the company provided, using your grounded search capabilities to find publicly available information.

    Company: "${company}"
    ${location ? `Location Focus: "${location}"` : ''}

    Your goal is to provide a comprehensive research document in a structured JSON format. The JSON object must have two top-level keys: "overview" and "contacts".

    1.  **overview**: A concise but insightful summary (2-3 paragraphs) about the company. Include any recent news, potential talking points for a sales call, or reasons for congratulations (e.g., recent funding, new product launch, awards). This should provide actionable intelligence.

    2.  **contacts**: A JSON array of all publicly identifiable employees. For each employee, find:
        - Full Name
        - Job Title/Role
        - Business Email Address
        - Business Phone Number
        - A boolean flag "isPrimaryTarget"

    The "isPrimaryTarget" flag must be set to \`true\` if the employee's role is related to any of the following areas, otherwise set it to \`false\`:
    - Fleet Management / Fleet Vehicles
    - Procurement / Purchasing (especially for cleaning supplies, detergents, industrial equipment, pressure washers)
    - Maintenance Management / Facilities Management
    - Logistics / Supply Chain Management
    - Operations Management (related to heavy equipment)
    - EHS (Environmental, Health, and Safety) managers who might handle industrial cleaning.

    **CRITICAL RULES FOR CONTACTS:**
    - Each contact object in the array MUST have the keys: "name", "role", "email", "phone", and "isPrimaryTarget".
    - If a specific piece of information (like a phone or email) cannot be found, use the string value "Not Found".
    - Only include a contact if you can find their name AND at least one of the following: their role, email, or phone number. Do not include contacts where you only have a name.

    **OUTPUT FORMAT:**
    Your entire response must be ONLY the raw JSON data. Do not include any text, explanation, or markdown formatting (like \`\`\`json) before or after the JSON.

    Example output format:
    {
      "overview": "ExampleCorp is a leading provider of logistics solutions, recently recognized for its innovative supply chain optimization software. They just announced a new partnership with Global Shipping Inc. to expand their international reach, a great point of congratulations. Their focus on sustainability presents an opportunity to discuss eco-friendly fleet maintenance solutions.",
      "contacts": [
        {
          "name": "John Doe",
          "role": "Fleet Manager",
          "email": "john.doe@examplecorp.com",
          "phone": "+1-555-123-4567",
          "isPrimaryTarget": true
        },
        {
          "name": "Jane Smith",
          "role": "Director of Logistics",
          "email": "jane.smith@examplecorp.com",
          "phone": "Not Found",
          "isPrimaryTarget": true
        },
        {
          "name": "Peter Jones",
          "role": "Marketing Coordinator",
          "email": "peter.jones@examplecorp.com",
          "phone": "Not Found",
          "isPrimaryTarget": false
        }
      ]
    }
  `;
}

export const findCompanyLeads = async (company: string, location: string): Promise<ResearchResult> => {
  const prompt = generatePrompt(company, location);

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{googleSearch: {}}],
    },
  });

  const rawText = response.text;
  let researchData: { overview: string; contacts: Lead[] } = { overview: '', contacts: [] };
  
  try {
    // The model sometimes returns the JSON wrapped in markdown ```json ... ``` or with other text.
    // We'll find the start and end of the JSON object to parse it robustly.
    const startIndex = rawText.indexOf('{');
    const endIndex = rawText.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1) {
        throw new Error("No JSON object found in the response.");
    }
    const jsonString = rawText.substring(startIndex, endIndex + 1);
    researchData = JSON.parse(jsonString);
  } catch (e) {
    console.error("Failed to parse Gemini response as JSON:", e);
    console.error("Raw response text:", rawText);
    throw new Error("AI response was not in a valid JSON format.");
  }

  const allLeads = researchData.contacts || [];

  // Filter leads to ensure they have a name and at least one other key piece of info.
  const filteredLeads = allLeads.filter(lead =>
    lead.name && lead.name.toLowerCase() !== 'not found' &&
    (
      (lead.role && lead.role.toLowerCase() !== 'not found') ||
      (lead.email && lead.email.toLowerCase() !== 'not found') ||
      (lead.phone && lead.phone.toLowerCase() !== 'not found')
    )
  );

  // Sort leads to show primary targets first
  const sortedLeads = filteredLeads.sort((a, b) => {
    const aIsTarget = a.isPrimaryTarget ? 1 : 0;
    const bIsTarget = b.isPrimaryTarget ? 1 : 0;
    return bIsTarget - aIsTarget;
  });

  const sources: GroundingChunk[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const overview = researchData.overview || 'No overview provided.';
  
  return { overview, leads: sortedLeads, sources };
};

const generateEnrichmentPrompt = (name: string, role: string, company: string): string => {
  return `
    You are an expert AI research assistant. Your mission is to find and compile a professional profile for a specific individual using targeted Google searches. You will act like a detective, piecing together clues.

    **Target:**
    - Name: "${name}"
    - Role: "${role}"
    - Company: "${company}"

    **CRITICAL STRATEGY:**
    Your primary goal is to extract a professional summary, a LinkedIn URL, and all possible contact information (emails, phone numbers).
    You MUST achieve this by meticulously examining Google search result **SNIPPETS** and **TITLES**. Information from data provider websites (like ContactOut, RocketReach, Apollo, ZoomInfo) and LinkedIn that is visible directly in the search snippets is highly valuable.

    **NEW DIRECTIVE - PIECING TOGETHER MASKED INFO:**
    Sometimes, contact information is partially masked (e.g., "kb*****@iacna.com" or "kevin.b****@iacgroup.com"). You should:
    1.  Collect all masked versions you can find.
    2.  Attempt to logically combine them to reconstruct the full, unmasked information. For example, if one source shows "j.smith@..." and another shows "john.s...@domain.com", you can infer "john.smith@domain.com".
    3.  Assign confidence scores based on how you found the information.

    **SUGGESTED SEARCH QUERIES (use variations of these):**
    - \`"${name}" "${role}" "${company}" email contactout\`
    - \`site:linkedin.com/in "${name}" "${company}"\`
    - \`"${name}" "${company}" contact information rocketreach\`
    - \`"${name}" email address "${role}" "${company}" apollo.io\`

    **OUTPUT REQUIREMENTS:**
    Your entire response MUST be a single, raw JSON object. Do not include any text, explanations, or markdown formatting (like \`\`\`json) before or after the JSON.

    The JSON object MUST have these four top-level keys: "summary", "linkedinUrl", "emails", and "phones".

    1.  **summary**: A brief overview (2-3 sentences) of the person's professional history and current role. If nothing is found, use an empty string "".

    2.  **linkedinUrl**: The direct URL to their main LinkedIn profile. If not found, use the string value "Not Found".

    3.  **emails**: A JSON array of objects. For each complete email found:
        - \`value\`: The full email address (string). Can be personal or professional. **CRITICAL: Do NOT include partially masked emails in the final output; only include them if you successfully pieced them together into a complete email.**
        - \`confidence\`: Your confidence level ("high", "medium", or "low").
            - "high": Found complete and unmasked directly in a search snippet from a data provider.
            - "medium": Inferred from a common corporate email pattern but not seen directly.
            - "low": Reconstructed by piecing together multiple masked versions.

    4.  **phones**: A JSON array of objects, following the same logic as emails for value and confidence.

    **CRITICAL RULES:**
    - If you cannot find any information for a key, return an empty array \`[]\` for "emails" and "phones".
    - Do not invent information. Only report what can be found or strongly inferred.
    - All complete email addresses and phone numbers are valuable, whether personal or work-related.

    Example output:
    {
      "summary": "Kevin Baird is the Chief Executive Officer at IAC Group, a leader in the automotive interiors sector. With extensive experience in global manufacturing and operations, he focuses on driving strategic growth and innovation within the company.",
      "linkedinUrl": "https://www.linkedin.com/in/kevin-baird-iac",
      "emails": [
        { "value": "kbaird@iacna.com", "confidence": "high" },
        { "value": "kevin.baird@iacgroup.com", "confidence": "medium" },
        { "value": "kbaird123@gmail.com", "confidence": "low" }
      ],
      "phones": []
    }
  `;
}

export const enrichLead = async (name: string, role: string, company: string): Promise<EnrichedData> => {
  const prompt = generateEnrichmentPrompt(name, role, company);

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{googleSearch: {}}],
    },
  });

  const rawText = response.text;
  let enrichedData: EnrichedData = { summary: '', linkedinUrl: undefined, emails: [], phones: [] };
  
  try {
    const startIndex = rawText.indexOf('{');
    const endIndex = rawText.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1) {
        throw new Error("No JSON object found in the response for enrichment.");
    }
    const jsonString = rawText.substring(startIndex, endIndex + 1);
    const parsedData = JSON.parse(jsonString);

    // Validate and structure the data
    enrichedData = {
        summary: parsedData.summary || '',
        linkedinUrl: parsedData.linkedinUrl === 'Not Found' ? undefined : parsedData.linkedinUrl,
        emails: Array.isArray(parsedData.emails) ? parsedData.emails : [],
        phones: Array.isArray(parsedData.phones) ? parsedData.phones : [],
    }

  } catch (e) {
    console.error("Failed to parse Gemini enrichment response as JSON:", e);
    console.error("Raw enrichment response text:", rawText);
    throw new Error("AI response for enrichment was not in a valid JSON format.");
  }
  
  return enrichedData;
};
