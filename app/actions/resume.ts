"use server"

import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai'
import { renderToBuffer } from '@react-pdf/renderer'
import { ResumeTemplate, ResumeData } from '@/components/resume/ResumeTemplate'
import React from 'react'

const polishSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    professionalSummary: { 
      type: SchemaType.STRING, 
      description: "A polished, professional summary paragraph (3-4 sentences max)."
    },
    workExperience: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          company: { type: SchemaType.STRING },
          title: { type: SchemaType.STRING },
          startDate: { type: SchemaType.STRING },
          endDate: { type: SchemaType.STRING },
          currentlyWorking: { type: SchemaType.BOOLEAN },
          polishedResponsibilities: { 
            type: SchemaType.ARRAY, 
            items: { type: SchemaType.STRING },
            description: "An array of 3-5 polished, action-oriented bullet points summarizing the responsibilities and achievements."
          },
        },
        required: ["company", "title", "startDate", "polishedResponsibilities"]
      }
    }
  },
  required: ["professionalSummary", "workExperience"]
}

export async function generateResumePdf(profile: any) {
  try {
    // 1. Polish content using Gemini
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY")
      return { success: false, error: "AI configuration missing" }
    }

    // Guard: without real content the AI just emits a "no data" placeholder,
    // producing the empty resume the user saw. Require some substance first.
    const hasContent =
      (profile.current_title && String(profile.current_title).trim()) ||
      (Array.isArray(profile.skills) && profile.skills.length > 0) ||
      (Array.isArray(profile.work_experience) && profile.work_experience.length > 0)
    if (!hasContent) {
      return {
        success: false,
        error: "Your profile is empty. Add your job title, skills, and work experience (or upload a resume) and save before generating a resume.",
      }
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: polishSchema,
      }
    })

    const rawInput = {
      currentTitle: profile.current_title,
      skills: profile.skills,
      experienceLevel: profile.experience_level,
      workExperience: profile.work_experience,
    }

    const prompt = `
      You are an expert resume writer. Given the following raw profile data, rewrite it into highly polished, professional resume content.
      1. Write a compelling professional summary (3-4 sentences).
      2. For each work experience entry, rewrite the responsibilities into 3-5 strong, action-oriented bullet points. Use metrics where implied or focus on impact. Ensure the output strictly follows the schema.
      
      Raw Data:
      ${JSON.stringify(rawInput, null, 2)}
    `

    // Retry transient overload (503) / rate-limit (429) errors with backoff.
    let result
    let retries = 3
    let delay = 2000
    while (retries > 0) {
      try {
        result = await model.generateContent(prompt)
        break
      } catch (e: any) {
        const transient = e?.status === 503 || e?.status === 429 ||
          e?.message?.includes("503") || e?.message?.includes("429") || e?.message?.includes("overloaded")
        retries--
        if (!transient || retries === 0) throw e
        console.warn(`Gemini resume-polish transient error (status ${e?.status}). Retrying in ${delay}ms...`)
        await new Promise(res => setTimeout(res, delay))
        delay *= 2
      }
    }

    const text = result!.response.text()
    if (!text) {
      throw new Error("AI returned empty response")
    }

    const polishedData = JSON.parse(text)

    // 2. Combine raw data with polished data
    const resumeData: ResumeData = {
      fullName: profile.full_name || '',
      email: profile.email || '',
      phone: profile.phone,
      location: profile.location,
      linkedinUrl: profile.linkedin_url,
      portfolioUrl: profile.portfolio_url,
      professionalSummary: polishedData.professionalSummary,
      workExperience: polishedData.workExperience,
      education: profile.education || [],
      skills: profile.skills || [],
    }

    // 3. Render PDF
    const pdfBuffer = await renderToBuffer(React.createElement(ResumeTemplate, { data: resumeData }) as any)

    // 4. Return as base64 string
    const base64Pdf = Buffer.from(pdfBuffer).toString('base64')

    return { success: true, base64Pdf }
  } catch (error: any) {
    console.error("Failed to generate resume:", error)
    return { success: false, error: error?.message || "An unexpected error occurred while generating the resume." }
  }
}
