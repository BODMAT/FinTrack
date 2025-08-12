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
    const { data, prompt } = req.body;

    try {
        const completion = await client.chat.completions.create({
            model: "openai/gpt-oss-120b:cerebras",
            messages: [
                {
                    role: "user",
                    content: `Here is the data: ${JSON.stringify(data)}. ${prompt}`,
                },
            ],
        });

        res.json(completion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
