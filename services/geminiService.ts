
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
    You are an expert AI assistant whose SOLE mission is to find publicly available contact information for a specific professional using targeted Google searches.

    **Target:**
    - Name: "${name}"
    - Role: "${role}"
    - Company: "${company}"

    **CRITICAL STRATEGY:**
    Your primary goal is to extract email addresses and phone numbers. You MUST achieve this by carefully examining the Google search result **SNIPPETS** and **TITLES**. Many data provider websites (like ContactOut, RocketReach, Apollo, ZoomInfo) show contact information directly in their search result snippets on Google. You must look for this information and extract it. Do not just look at the links; read the text previews.

    **EXECUTION PLAN:**
    1.  Execute a series of targeted searches.
    2.  For each search, meticulously scan the result snippets for any emails or phone numbers.
    3.  Compile all unique findings.

    **SEARCH QUERIES TO USE:**
    - \`"${name}" "${company}" email phone contactout\`
    - \`"${name}" "${company}" contact information rocketreach\`
    - \`"${name}" email address "${role}" "${company}"\`
    - \`site:linkedin.com/in "${name}" "${company}"\` (Use this primarily for the LinkedIn URL)

    **OUTPUT REQUIREMENTS:**
    Your entire response MUST be a single, raw JSON object. Do not include any text, explanations, or markdown formatting (like \`\`\`json) before or after the JSON.

    The JSON object MUST have these four top-level keys: "summary", "linkedinUrl", "emails", and "phones".

    1.  **emails**: (TOP PRIORITY) A JSON array of objects. For each email found:
        - \`value\`: The email address (string).
        - \`confidence\`: Your confidence level ("high", "medium", or "low"). Base confidence on how directly it was associated with the person in the search snippet.

    2.  **phones**: (TOP PRIORITY) A JSON array of objects. For each phone number found:
        - \`value\`: The phone number (string).
        - \`confidence\`: Your confidence level ("high", "medium", or "low").

    3.  **linkedinUrl**: (SECONDARY PRIORITY) The direct URL to their main LinkedIn profile. If not found, use the string value "Not Found".

    4.  **summary**: (LOWEST PRIORITY) After searching for contact info, provide a 1-sentence professional summary if easily found. If not, use an empty string "".

    **CRITICAL RULES:**
    - If you cannot find any information for a key (e.g., no emails), return an empty array \`[]\` for "emails" and "phones".
    - Your highest priority is to find emails and phones by reading the search snippets.

    Example output:
    {
      "summary": "Director of Logistics at ExampleCorp, skilled in supply chain optimization.",
      "linkedinUrl": "https://www.linkedin.com/in/janesmithexample",
      "emails": [
        { "value": "jane.smith@examplecorp.com", "confidence": "high" },
        { "value": "j.smith@examplecorp.com", "confidence": "medium" }
      ],
      "phones": [
        { "value": "+1-555-987-6543", "confidence": "high" }
      ]
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
