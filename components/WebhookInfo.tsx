import React from 'react';

const CodeBlock: React.FC<{ children: React.ReactNode, lang: string }> = ({ children, lang }) => (
    <pre className="bg-gray-900 rounded-md p-4 my-2 text-sm text-gray-300 overflow-x-auto">
        <code className={`language-${lang}`}>{children}</code>
    </pre>
);

export const WebhookInfo: React.FC = () => {
    const webhookUrl = 'https://YOUR_SHARED_HOST_URL/webhook.php';
    
    const curlExample = `curl -X POST ${webhookUrl} \\
-H "Content-Type: application/json" \\
-d '{
  "company": "ExampleCorp",
  "location": "San Francisco, CA"
}'`;

    return (
        <div className="mt-6 p-5 border border-gray-700 rounded-lg bg-gray-900/50 space-y-6">
            <h4 className="text-lg font-semibold text-teal-300 text-center">Two Ways to Use This Tool</h4>
            
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
                <h5 className="font-semibold text-gray-200">The Core Concept: They Are Separate</h5>
                <p className="text-gray-400 text-sm mt-1">
                    The web app (on Coolify) and the webhook (on your shared host) <span className="font-bold text-yellow-400">do not talk to each other</span>. They are two different tools for the same purpose.
                </p>
                 <p className="text-gray-400 text-sm mt-2">
                    Think of it like a car: you can either drive it yourself (the web app) or you can use a remote to tell it where to go (the webhook for automation).
                </p>
            </div>

            {/* --- USE CASE 1 --- */}
            <div className="border border-blue-500/50 rounded-lg p-4 bg-blue-900/20">
                <h5 className="font-bold text-blue-300 mb-2">Use Case 1: Manual Research (This App)</h5>
                <p className="text-gray-400 text-sm">
                    This is the website you are using right now. When you type a company name and click the button, your web browser calls the Gemini API directly and securely.
                </p>
                <p className="font-semibold text-gray-300 text-sm mt-2">
                    It <span className="underline">does not</span> use or need the <code className="bg-gray-700 text-xs p-1 rounded">webhook.php</code> file at all.
                </p>
            </div>
            
            {/* --- USE CASE 2 --- */}
            <div className="border border-teal-500/50 rounded-lg p-4 bg-teal-900/20">
                 <h5 className="font-bold text-teal-300 mb-2">Use Case 2: Automated Research (Optional Webhook)</h5>
                <p className="text-gray-400 text-sm">
                    The <code className="bg-gray-700 text-xs p-1 rounded">webhook.php</code> file is for automation. You upload this single file to your shared hosting plan to create an API endpoint.
                </p>
                <p className="text-gray-400 text-sm mt-2">
                   You would then give that URL (<code className="bg-gray-700 text-xs p-1 rounded">{webhookUrl}</code>) to another service like n8n, Zapier, or your own custom code. That service can then trigger research jobs automatically.
                </p>

                <div className="mt-4">
                    <h6 className="font-semibold text-gray-300 mb-2">How to Set It Up:</h6>
                     <ol className="text-gray-400 text-sm list-decimal list-inside space-y-2">
                         <li>Upload the <code className="bg-gray-700 text-xs p-1 rounded">webhook.php</code> file to your shared host's public directory.</li>
                         <li>
                            Set your Gemini API Key as an environment variable on that server. On many hosts, you can do this by adding the following line to a <code className="bg-gray-700 text-xs p-1 rounded">.htaccess</code> file:
                            <CodeBlock lang="bash">SetEnv API_KEY "YOUR_GEMINI_API_KEY_HERE"</CodeBlock>
                         </li>
                         <li>
                             Send a <code className="bg-gray-700 text-xs p-1 rounded">POST</code> request to your webhook's URL to trigger it. Here's an example:
                            <CodeBlock lang="bash">{curlExample}</CodeBlock>
                         </li>
                     </ol>
                </div>
            </div>
        </div>
    );
};
