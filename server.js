import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { OpenAI } from "openai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const tokens = Object.keys(process.env)
    .filter(key => key.startsWith("HF_API_TOKEN"))
    .map(key => process.env[key])
    .filter(Boolean);

if (tokens.length === 0) {
    console.error("❌ No tokens found in HF_API_TOKEN .env");
    process.exit(1);
}

const DEFAULT_MODEL = "openai/gpt-oss-120b";

app.post("/analyze", async (req, res) => {
    const { data, prompt, model } = req.body;
    const modelToUse = model ?? DEFAULT_MODEL;

    let errorMessages = [];

    for (const token of tokens) {
        const client = new OpenAI({
            baseURL: "https://router.huggingface.co/v1",
            apiKey: token,
        });

        try {
            const completion = await client.chat.completions.create({
                model: modelToUse,
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: `${prompt}\n\nData:\n${JSON.stringify(data)}` }
                ]
            });

            return res.json({
                model: completion.model,
                result: completion.choices[0].message.content
            });
        } catch (err) {
            console.error("Model error with token:", token, err.message);
            errorMessages.push(`Token failed: ${err.message}`);
        }
    }

    return res.status(500).json({
        error: "All tokens failed",
        details: errorMessages.join("\n")
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
