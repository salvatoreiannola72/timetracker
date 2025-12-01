import { GoogleGenAI } from "@google/genai";
import { TimesheetEntry, Project, User } from "../types";

// Safety check for API Key. In a real app, this should be handled gracefully.
// For this demo, we assume process.env.API_KEY is available.
const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export const generateSmartSummary = async (
  entries: TimesheetEntry[],
  projects: Project[]
): Promise<string> => {
  if (!apiKey) return "API Key missing. Cannot generate summary.";

  try {
    const projectMap = new Map(projects.map(p => [p.id, p.name]));
    
    // Format data for the model
    const dataSummary = entries.map(e => ({
      date: e.date,
      project: projectMap.get(e.projectId) || 'Unknown',
      hours: e.hours,
      desc: e.description
    }));

    const prompt = `
      You are an executive assistant. Analyze the following timesheet data for the week.
      Provide a concise 3-bullet point summary of what was achieved, highlighting the main focus areas.
      Do not format as markdown, just plain text with unicode bullets.
      
      Data: ${JSON.stringify(dataSummary)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No summary generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate summary at this time.";
  }
};

export const detectAnomalies = async (
  entries: TimesheetEntry[],
  projects: Project[],
  users: User[]
): Promise<string> => {
  if (!apiKey) return "API Key missing.";

  try {
     const projectMap = new Map(projects.map(p => [p.id, p.name]));
     const userMap = new Map(users.map(u => [u.id, u.name]));

     const data = entries.map(e => ({
       user: userMap.get(e.userId),
       project: projectMap.get(e.projectId),
       hours: e.hours,
       date: e.date
     }));

     const prompt = `
      Analyze this timesheet data for a small team.
      Identify any anomalies such as:
      1. Excessive hours (burnout risk).
      2. Missing time for active days.
      3. Unusual project distribution.

      Keep it brief and professional. Return HTML-safe string (no markdown blocks), using <strong> for emphasis.
      
      Data: ${JSON.stringify(data)}
     `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No anomalies detected.";

  } catch (error) {
    console.error("Gemini Error", error);
    return "Error analyzing data.";
  }
}