// This is your new serverless function: api/combine.js

export default async function handler(request, response) {
    // 1. Check if the request method is POST
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    // 2. Get the elements from the request body
    const { element1, element2 } = request.body;

    if (!element1 || !element2) {
        return response.status(400).json({ error: 'Missing element1 or element2 in request body' });
    }

    // 3. Get the secret API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return response.status(500).json({ error: 'API key not configured on the server' });
    }

    // 4. Prepare the request to the real Gemini API
    const model = "gemini-1.5-pro-latest";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const systemPrompt = "You are a helpful assistant for a crafting game. The user will provide two items. Respond with the single, most logical item that would result from combining them. Your response should be a short, 1-3 word answer, and must start with a relevant emoji. For example, if the user combines '💧 Water' and '🔥 Fire', a good response would be '💨 Steam'.";
    const userQuery = `Combine: ${element1.trim()} and ${element2.trim()}`;

    const payload = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userQuery }] }],
    };

    // 5. Make the API call and send the response back to the frontend
    try {
        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error("Gemini API Error:", errorText);
            return response.status(geminiResponse.status).json({ error: 'Failed to fetch from Gemini API' });
        }

        const result = await geminiResponse.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
             return response.status(500).json({ error: 'Invalid response from Gemini API' });
        }
        
        // Send the successful result back to your frontend
        return response.status(200).json({ result: text.trim() });

    } catch (error) {
        console.error("Internal Server Error:", error);
        return response.status(500).json({ error: 'An internal error occurred' });
    }
}

