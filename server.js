import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { OpenAI } from "openai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const client = new OpenAI({
    baseURL: "https://router.huggingface.co/v1",
    apiKey: process.env.HF_API_TOKEN,
});

app.post("/analyze", async (req, res) => {
    const { data, prompt, model } = req.body;

    const modelsToTry = model
        ? (Array.isArray(model) ? model : [model])
        : ["openai/gpt-oss-120b",
            "openai/gpt-oss-20b",
            "gpt-4-turbo",
            "gpt-4o",
            "gpt-3.5-turbo",
            "meta-llama/Meta-Llama-3-70B-Instruct",
            "mistralai/Mixtral-8x7B-Instruct-v0.1"];

    let completion = null;
    let errorMessages = [];

    for (const m of modelsToTry) {
        try {
            completion = await client.chat.completions.create({
                model: m,
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: `${prompt}\n\nData:\n${JSON.stringify(data)}` }
                ]
            });
            break;
        } catch (err) {
            errorMessages.push(`Model ${m} failed: ${err.message}`);
        }
    }

    if (!completion) {
        return res.status(500).json({ error: "All models failed", details: errorMessages });
    }

    res.json({
        model: completion.model,
        result: completion.choices[0].message.content
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
