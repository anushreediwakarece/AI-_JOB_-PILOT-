"use server"

import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai"

const profileSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    full_name: { type: SchemaType.STRING, description: "Full name of the candidate" },
    email: { type: SchemaType.STRING, description: "Email address" },
    phone: { type: SchemaType.STRING, description: "Phone number" },
    location: { type: SchemaType.STRING, description: "City, State, or Country" },
    current_title: { type: SchemaType.STRING, description: "Current or most recent job title" },
    experience_level: { type: SchemaType.STRING, description: "One of: junior, mid, senior, lead based on years of experience" },
    years_experience: { type: SchemaType.INTEGER, description: "Total years of relevant experience" },
    skills: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "List of technical and soft skills" },
    industries: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "List of industries the candidate has worked in" },
    work_experience: {
      type: SchemaType.ARRAY,
      description: "List of previous jobs",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          company: { type: SchemaType.STRING },
          title: { type: SchemaType.STRING },
          startDate: { type: SchemaType.STRING },
          endDate: { type: SchemaType.STRING },
          currentlyWorking: { type: SchemaType.BOOLEAN },
          responsibilities: { type: SchemaType.STRING },
        },
        required: ["company", "title", "startDate"]
      }
    },
    education: {
      type: SchemaType.ARRAY,
      description: "List of degrees",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          degree: { type: SchemaType.STRING },
          fieldOfStudy: { type: SchemaType.STRING },
          institution: { type: SchemaType.STRING },
          graduationYear: { type: SchemaType.STRING },
        },
        required: ["degree", "fieldOfStudy", "institution"]
      }
    },
    linkedin_url: { type: SchemaType.STRING },
    portfolio_url: { type: SchemaType.STRING },
  },
}

export async function extractProfileFromResume(formData: FormData) {
  try {
    const file = formData.get("file") as File
    if (!file) {
      return { success: false, error: "No file provided" }
    }

    if (file.type !== "application/pdf") {
      return { success: false, error: "Only PDF files are supported" }
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY environment variable")
      return { success: false, error: "AI configuration is missing" }
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: profileSchema,
      }
    })

    const arrayBuffer = await file.arrayBuffer()
    const base64String = Buffer.from(arrayBuffer).toString("base64")

    let result;
    let retries = 3;
    let delay = 2000;

    while (retries > 0) {
      try {
        result = await model.generateContent([
          {
            inlineData: {
              data: base64String,
              mimeType: "application/pdf",
            }
          },
          "Extract the candidate's profile information from this resume. Be as thorough as possible. Output must conform to the JSON schema."
        ]);
        break; // Success
      } catch (e: any) {
        // Retry transient overload (503) and rate-limit (429) errors with backoff.
        const transient = e.status === 503 || e.status === 429 ||
          e.message?.includes("503") || e.message?.includes("429") || e.message?.includes("High demand");
        if (transient) {
          retries--;
          if (retries === 0) throw e;
          console.warn(`Gemini API transient error (status ${e.status}). Retrying in ${delay}ms...`);
          await new Promise(res => setTimeout(res, delay));
          delay *= 2; // Exponential backoff
        } else {
          throw e;
        }
      }
    }

    if (!result) {
      return { success: false, error: "AI returned empty response after retries" }
    }

    const text = result.response.text()
    if (!text) {
      return { success: false, error: "AI returned empty response text" }
    }

    const parsedData = JSON.parse(text)
    return { success: true, data: parsedData }
  } catch (error: any) {
    console.error("Failed to extract profile from resume:", error)
    // Give a clear, actionable message when the Gemini quota is exhausted
    // (free tier = 20 requests/day) rather than a generic failure.
    const isQuota = error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("quota")
    if (isQuota) {
      return { success: false, error: "AI quota exceeded for today. The Gemini API key has hit its daily limit — please try again later or update the API key." }
    }
    const errorMessage = error?.message || "The file may be unreadable or too large."
    return { success: false, error: `Failed to extract profile from resume. ${errorMessage}` }
  }
}
