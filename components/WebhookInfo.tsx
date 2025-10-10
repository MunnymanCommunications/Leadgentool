import React from 'react';

const CodeBlock: React.FC<{ children: React.ReactNode, lang: string }> = ({ children, lang }) => (
    <pre className="bg-gray-900 rounded-md p-4 my-2 text-sm text-gray-300 overflow-x-auto">
        <code className={`language-${lang}`}>{children}</code>
    </pre>
);

export const WebhookInfo: React.FC = () => {
    const webhookUrl = 'https://zlkpkcxeplxavplpvqua.supabase.co/functions/v1/webhook-company';
    
    const curlExample = `curl -X POST '${webhookUrl}' \\
-H "Content-Type: application/json" \\
-H "x-company-name: ExampleCorp" \\
-d '{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "phone": "+15551234567",
  "job_title": "Director of Logistics",
  "custom_field1": "https://linkedin.com/in/janedoe",
  "custom_field2": "Experienced logistics professional with a focus on supply chain optimization."
}'`;

    return (
        <div className="mt-6 p-5 border border-gray-700 rounded-lg bg-gray-900/50 space-y-4">
            <h4 className="text-lg font-semibold text-teal-300 text-center">Using the Contact API</h4>
            
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
                <p className="text-gray-400 text-sm">
                    This tool sends enriched contact data to a specific API endpoint. You can use this same endpoint for your own automations (e.g., with n8n, Zapier, or custom scripts).
                </p>
            </div>

            <div>
                <h5 className="font-semibold text-gray-200">API Endpoint</h5>
                <p className="text-gray-400 text-sm mt-1">
                   All contacts are sent via a <code className="bg-gray-700 text-xs p-1 rounded">POST</code> request to the following URL:
                </p>
                <CodeBlock lang="text">{webhookUrl}</CodeBlock>
            </div>
            
            <div>
                 <h5 className="font-semibold text-gray-200">Required Headers</h5>
                 <ul className="text-gray-400 text-sm list-disc list-inside space-y-1 mt-1">
                     <li><code className="bg-gray-700 text-xs p-1 rounded">Content-Type: application/json</code></li>
                     <li><code className="bg-gray-700 text-xs p-1 rounded">x-company-name: [The company you are researching]</code></li>
                 </ul>
            </div>

            <div>
                 <h5 className="font-semibold text-gray-200">Example Request</h5>
                <p className="text-gray-400 text-sm mt-1">
                   Here's an example using cURL to send a single contact:
                </p>
                <CodeBlock lang="bash">{curlExample}</CodeBlock>
            </div>
        </div>
    );
};