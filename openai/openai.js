import express from "express";
import multer from "multer";
import FormData from "form-data";
import fetch from "node-fetch";
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
const model = "gpt-4o";
const FASTAPI_URL = process.env["FASTAPI_URL"] || "http://localhost:8000";

const app = express();
const upload = multer({ dest: "uploads/" });

// Initialize AI client
const client = ModelClient(endpoint, new AzureKeyCredential(token));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Enhanced inference endpoint that calls FastAPI backend and adds AI recommendations
app.post("/infer", upload.single("image_file"), async (req, res) => {
  let tempFilePath = null;
  
  try {
    const { crop_type, region, soilMoisture, temperature } = req.body;

    if (!crop_type || !req.file) {
      return res.status(400).json({
        error: "Missing required parameters: crop_type and image_file are required"
      });
    }

    tempFilePath = req.file.path;

    console.log("\n📤 Posting image to FastAPI server...");
    console.log(`   Crop Type: ${crop_type}`);
    console.log(`   Image: ${req.file.originalname}`);
    console.log(`   FastAPI URL: ${FASTAPI_URL}/ai/infer`);

    // Call FastAPI backend for disease detection
    const formData = new FormData();
    formData.append("crop_type", crop_type);
    formData.append("image_file", fs.createReadStream(tempFilePath), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const backendResponse = await fetch(`${FASTAPI_URL}/ai/infer`, {
      method: "POST",
      body: formData,
      headers: formData.getHeaders()
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      throw new Error(`FastAPI error: ${errorText}`);
    }

    const diseaseData = await backendResponse.json();
    
    console.log("\n✅ Received response from FastAPI:");
    console.log(`   Scan ID: ${diseaseData.scan_id}`);
    console.log(`   Disease: ${diseaseData.disease}`);
    console.log(`   Confidence: ${(diseaseData.confidence * 100).toFixed(2)}%`);
    console.log(`   Severity: ${diseaseData.severity}`);

    console.log("\n🤖 Using FastAPI response for AI inference...");

    // Build prompt with disease detection results
    const prompt = buildPrompt({
      crop_type,
      disease: diseaseData.disease,
      confidence: diseaseData.confidence,
      severity: diseaseData.severity,
      recommendation: diseaseData.recommendation,
      region,
      soilMoisture,
      temperature
    });

    // Get AI-enhanced recommendations
    const aiResponse = await client.path("/chat/completions").post({
      body: {
        model: model,
        messages: [
          {
            role: "system",
            content:
              "You are an agricultural expert AI assistant. Provide actionable, evidence-based recommendations for crop disease management."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.4
      }
    });

    if (isUnexpected(aiResponse)) {
      throw aiResponse.body.error;
    }

    const aiRecommendation = aiResponse.body.choices[0].message.content;
    const cleanedRecommendation = cleanMarkdown(aiRecommendation);
    
    // Log AI response to console
    console.log("\n=== AI Enhanced Recommendation ===");
    console.log(cleanedRecommendation);
    console.log("==================================\n");

    // Return combined results
    res.json({
      scan_id: diseaseData.scan_id,
      disease_detection: {
        disease: diseaseData.disease,
        confidence: diseaseData.confidence,
        severity: diseaseData.severity,
        basic_recommendation: diseaseData.recommendation
      },
      ai_enhanced_recommendation: cleanedRecommendation,
      context: {
        crop_type,
        region,
        soilMoisture,
        temperature
      }
    });

  } catch (error) {
    console.error("Inference failed:", error);
    res.status(500).json({
      error: "Inference failed",
      details: error.message
    });
  } finally {
    // Clean up uploaded file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
});

function buildPrompt(data) {
  return `
You are an agricultural decision support AI providing enhanced recommendations based on disease detection results.

Disease Detection Results:
- Crop: ${data.crop_type}
- Detected Disease: ${data.disease}
- Detection Confidence: ${(data.confidence * 100).toFixed(2)}%
- Severity Level: ${data.severity}
- Basic Recommendation: ${data.recommendation}

Additional Context:
${data.region ? `- Region: ${data.region}` : ""}
${data.soilMoisture ? `- Soil Moisture: ${data.soilMoisture}` : ""}
${data.temperature ? `- Temperature: ${data.temperature}°C` : ""}

Task:
Based on the disease detection results and environmental context, provide:
1. Immediate action steps for disease management
2. Preventive measures to avoid disease spread
3. Treatment recommendations (organic and chemical options if applicable)
4. Timeline for expected recovery
5. Monitoring guidelines

Provide clear, actionable advice that farmers can implement immediately.
`;
}

function cleanMarkdown(text) {
  // Remove markdown code blocks
  text = text.replace(/```[\s\S]*?```/g, '');
  
  // Remove markdown headers
  text = text.replace(/#{1,6}\s+/g, '');
  
  // Remove markdown bold
  text = text.replace(/\*\*(.+?)\*\*/g, '$1');
  text = text.replace(/__(.+?)__/g, '$1');
  
  // Remove markdown italic
  text = text.replace(/\*(.+?)\*/g, '$1');
  text = text.replace(/_(.+?)_/g, '$1');
  
  // Remove markdown links
  text = text.replace(/\[(.+?)\]\(.*?\)/g, '$1');
  
  // Remove extra whitespace
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.trim();
  
  return text;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AI Enhancement server running on port ${PORT}`);
  console.log(`FastAPI backend URL: ${FASTAPI_URL}`);
});
