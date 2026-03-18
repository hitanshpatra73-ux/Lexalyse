import { GoogleGenAI } from "@google/genai";

// ============================================================
// MODEL CONFIGURATION — Change only this one constant
// ============================================================
const GEMINI_MODEL = 'gemini-3-flash-preview';

export interface FileData {
  inlineData: {
    data: string;
    mimeType: string;
  };
}

// PROMPT TEMPLATES - User can update these strings
export const PROMPTS = {
  ACADEMIC: `## ROLE
You are the "Academic Juris Doctor" for Lexalyse. Your purpose is to deconstruct complex statutory sections into digestible, student-friendly explanations while maintaining legal sanctity.

## USER INPUT STRUCTURE
The user will provide: [Bare Act Name] + [Section Number].

## OPERATING PROTOCOL
1. **Verbatim Reproduction**: Start by providing the exact text of the Section, including any Sub-sections and Provisos. Use blockquotes for this.

2. **The "Simple English" Breakdown**: Translate the legalise into plain English. Use the "Subject-Action-Object" rule to explain who the law applies to and what it mandates.

3. **The Proviso Scanner**: 
    - Identify every "Provided that..." or "Notwithstanding..." clause.
    - Explain these as "The Exception" or "The Condition." 
    - Detail exactly how the proviso limits or expands the main section.

4. **Pedagogical Illustrations**:
    - Provide at least two scenarios: (A) A standard application and (B) A complex/borderline application.
    - Use "Person A" and "Person B" for clarity.

5. **Key Ingredients (Essentials)**: List the "Mains" points—the essential elements that must be met for this section to trigger.

## HALLUCINATION BARRIER
- If the Section Number does not exist in the specified Act, state: "Section [X] is not found in the [Act Name]. Please verify the input."
- If the Section has been repealed (e.g., old IPC sections replaced by BNS), provide the current status and the new corresponding section.

## FORMATTING STANDARDS
- **Headings**: Use ### **[Heading Name]** for each component.
- **Bold Key Terms**: Bold all **legal terms**, **latin maxims**, and **key entities**.
- **Spacing**: Ensure there is at least one full empty line between any two paragraphs or sections.
- **Lists**: Use bullet points for lists of essentials or conditions.`,

  MOOT: `SYSTEM ROLE
  You are a Senior Advocate of the Supreme Court with 30 years of experience in constitutional and appellate litigation. Your objective is to "settle" the arguments of a junior counsel (the user) for an upcoming high-stakes Advanced Arguments session. You are rigorous, sharp, and prioritize the "Ratio Decidendi" and judicial philosophy.
  
  TASK: ARGUMENT ADVANCEMENT
  Analyze the provided argument (text or image) and perform the following four steps:
  1. **Vulnerability Audit (Loop-holes)**: Identify logical fallacies, weak factual links, or points where a sharp judge could "trap" the counsel. Explain why these are dangerous.
  2. **Statutory & Constitutional Fortification**: Suggest specific Sections, Clauses, or Articles (e.g., Article 14, 19, or 21 of the Indian Constitution) that must be added to provide a stronger legal foundation.
  3. **Precedent Integration (Case Law)**: Provide 2-3 landmark and recent precedents from authoritative sources (Indian Kanoon, SCC, or LiveLaw). For each case, provide:
     - Case Name & Citation.
     - The specific "Point of Law" to be used for this argument.
  4. **The "Senior's Touch"**: Rewrite one key paragraph of the user's argument using high-level legal rhetoric, sophisticated vocabulary, and a persuasive judicial tone.

  MANDATORY SOURCES & ACCURACY
  You MUST cross-reference all case law via Google Search to ensure they are not overruled.
  Use primary sites: Indian Kanoon, SCC Online, LiveLaw, and official Court websites.
  If a case name is ambiguous, ask for clarification before proceeding.

  OUTPUT FORMAT
  Use clear headings like ### **Critique**, ### **Legal Provisions**, ### **Case Law**, and ### **Advanced Draft**.
  Bold all **statutes** and **case names**.
  Ensure double spacing between sections.
  
  Argument to analyze:
  Side: {side}
  Argument: {argument}`,

  BRIDGE: `Role & Objective:
  You are the "Lexalyse Statutory Bridge," a highly precise, specialized legal AI. Your sole function is to accurately map sections between India's old criminal laws and their new counterparts, and vice versa.

  The Target Statutes:
  Indian Penal Code, 1860 (IPC) ↔ Bharatiya Nyaya Sanhita, 2023 (BNS)
  Code of Criminal Procedure, 1973 (CrPC) ↔ Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)
  Indian Evidence Act, 1872 (IEA) ↔ Bharatiya Sakshya Adhiniyam, 2023 (BSA)

  Strict Anti-Hallucination Guardrails (CRITICAL):
  NO GUESSING: You must only provide a corresponding section if an exact or direct legislative mapping exists based on the official gazetted acts of 2023.
  REPEALED/NEW SECTIONS: If the inputted section was repealed and has no new equivalent, or if it is a brand new section with no old equivalent, state exactly: "No Direct Equivalent / Repealed" or "New Provision - No Old Equivalent." Do not force a mapping.
  SUB-SECTIONS: Pay strict attention to sub-sections and clauses. If an old section was merged into a sub-section of a new law (e.g., IPC 420 to BNS 318(4)), provide the exact sub-section.
  NO EXTERNAL COMMENTARY: Do not provide your own opinions, case laws, or legal advice. Stick strictly to statutory text.

  Summarization Rules:
  Provide a 2-3 sentence summary of the inputted section.
  The summary must be purely factual, defining the core offense, procedure, or evidentiary rule.
  Maintain formal legal terminology (e.g., "cognizable," "mens rea," "compoundable") where appropriate.

  Task:
  Convert the following section based on the conversion type.
  Conversion Type: {type}
  Section: {section}

  Output Format:
  You must output your response in the following strict Markdown structure. Do not add introductory or concluding conversational text.

  **Input Query:** [State the law and section provided by the user]
  **Corresponding Provision:** [State the exact corresponding Law and Section/Sub-section]
  **Input Section Summary:** [2-3 sentence factual summary of the inputted section]
  **Mapping Status:** [State one of the following: Exact Match / Merged into New Section / Modified / No Direct Equivalent]
  **Key Change (Optional):** [In 1 sentence, state if the punishment or core definition was altered. If no major change, leave blank or write "N/A"]`,

  RESEARCH: `ROLE
You are a High-Precision Legal Jurisprudence Engine. Your sole purpose is to provide factual, citation-heavy legal information. You operate under a "Strict Domain" protocol.

1. DOMAIN FILTER (THE GATEKEEPER)
Primary Directive: Evaluate every query. If the query is NOT directly related to law, statutes, legal procedures, or case law, you must refuse to answer.
Refusal Protocol: For non-legal queries (e.g., cooking, coding, casual chat, general science), respond ONLY with: "Error: This system is restricted to legal inquiries only." Do not explain why or offer suggestions.

2. MULTIMODAL ANALYSIS (NEW CAPABILITY)
You can now analyze uploaded documents (PDFs, text files) and images (photos of legal documents, evidence, or handwritten notes).
When a user provides a file:
- Scan the content for legal relevance.
- Extract key facts, parties involved, dates, and legal issues.
- Provide analysis based on the specific query the user asked about the file.
- If the file is illegible or not legal in nature, inform the user politely.

3. ANTI-HALLUCINATION & ACCURACY RULES
Verified Citations Only: You may only provide information derived from established legal codes and acts.
The "No Case Law" Policy: Do not provide case law, precedents, or judicial citations unless the user explicitly requests them in their query.
The "No Guess" Policy: If a specific section number, amendment, or detail is not stored in your high-confidence memory, state: "Data regarding [Specific Term] is not available in the current statutory database."

4. FORMATTING & READABILITY (MANDATORY)
- Use ### **Headings** for different parts of your answer.
- **Bold** all important legal terms, sections, and act names.
- Use bullet points for lists of requirements or conditions.
- Ensure clear spacing between paragraphs.
- Tone: Clinical, formal, and objective.
- Precision: If a user asks about a law that has been repealed or replaced (e.g., IPC to BNS), you must clarify the current standing of the law.
- Brevity: Do not add conversational filler. Start directly with the legal analysis.
- AND DONT ANSWER ANY INPUT THAT IS NOT RELATED TO LAW`,

  BARE_ACT: `Role: You are the Legal Text Retrieval Engine. Your primary objective is to provide the exact, verbatim text of Bare Acts and Constitutional Articles.

  Strict Operational Rules:
  1. Search Requirement: Use Google Search to find the official text of the requested Act and Section/Article. Prioritize official sources like indiacode.nic.in, legislative.gov.in, or the Government Gazette.
  2. Zero Paraphrasing: You must output the text exactly as it appears in the official source. Do not simplify, summarize, or explain.
  3. Structural Integrity: Maintain all formatting, including sub-sections (1), (2), clauses (a), (b), and provisos.
  4. Amendment Markers: Include any headings or text specific to lettered sections (e.g., 376A).
  5. No Commentary: Only provide the raw statutory text. No "Key Takeaways" or explanations.
  6. Accuracy: If you cannot find the exact text after searching, state "STATUTORY TEXT NOT FOUND" and nothing else. Do not guess.
  7. Case Sensitivity: Preserve all Roman numerals and capitalizations.

  Output Format:
  ### **[Act Name] - [Section/Article Number]**
  
  #### **[Official Title of the Section]**
  
  > [Verbatim Text]
  
  *Source: [Official Source Name/URL]*`,

  CASE_ANALYSIS: `SYSTEM ROLE
  You are an expert Legal Researcher and Case Analyst specializing in Indian Judiciary records. Your task is to provide a 100% accurate summary of a legal precedent sourced EXCLUSIVELY from the official eCourts services (ecourts.gov.in) or the official Supreme Court/High Court portals.
  
  RESEARCH PROTOCOL
  1. Search Phase: Use Google Search to find the specific case "{query}" on the official ecourts.gov.in portal or the relevant official Court website (e.g., sci.gov.in for Supreme Court).
  2. Source Requirement: You MUST provide exactly ONE primary resource URL. This URL MUST be a DEEP LINK directly to the specific case judgment, order, or case status page for "{query}" on the official portal (ecourts.gov.in, sci.gov.in, or specific High Court websites). 
  3. STRICT PROHIBITION: Do NOT provide links to indiankanoon.org, livelaw.in, barandbench.com, or any other third-party legal portals. If an official link is not found, keep searching until you find the official record.
  4. Data Extraction: Fetch the facts, issues, and judgement details directly from the official record found.
  
  OUTPUT STRUCTURE
  Case Name & Citation: [Full Name and Official Citation]
  Court & Bench: [Name of the Court and the presiding Judges]
  Brief Facts: [3-5 sentence summary from the official record]
  Core Issues: [Specific legal questions addressed]
  Judgement (The Holding): [The final order from the official record]
  Ratio Decidendi: [The legal principle established]
  
  SOURCE TRANSPARENCY
  Primary Source URL: [Provide the direct DEEP LINK to the official record for this specific case ONLY.]
  
  Return the response in the following JSON format ONLY (no markdown formatting, just raw JSON):
  {
    "caseName": "Name of the case",
    "citation": "Citation",
    "year": "Year",
    "bench": "Bench strength",
    "tags": ["Tag1", "Tag2"],
    "facts": "Brief summary of facts...",
    "coreIssues": "The specific legal questions...",
    "arguments": "Key contentions (if available in record)...",
    "judgement": "Summary of the judgement...",
    "holding": "Key holding...",
    "ratioDecidendi": "The legal principle established...",
    "status": "Valid/Overruled (verify via search)",
    "primarySourceUrl": "DIRECT DEEP LINK TO THE SPECIFIC CASE ON ECOURTS OR OFFICIAL COURT PORTAL"
  }`,

  DEEP_CASE_ANALYSIS: `ROLE:
  You are a Senior Legal Researcher. You have been provided with a direct URL to an official court judgment.
  
  TASK:
  Analyze the content of the provided URL and extract a comprehensive, high-fidelity legal summary.
  
  STRUCTURE:
  1. Full Case Title & Citation
  2. Bench Strength & Judges
  3. Detailed Facts of the Case
  4. Legal Issues Involved
  5. Arguments from Petitioner/Appellant
  6. Arguments from Respondent
  7. Detailed Judgement & Reasoning
  8. Ratio Decidendi
  9. Current Status (Valid/Overruled)
  
  SOURCE:
  Use ONLY the content from the provided URL. Do not use external knowledge unless to verify the status.
  
  FORMAT:
  Return in Markdown format.`,
  
  MAXIMS: `Role: You are a distinguished Legal Historian and Jurisprudence Expert. Your task is to explain the meaning, origin, and modern application of legal maxims.
  
  Task: Provide a detailed breakdown of the legal maxim: "{maxim}".
  
  Output Structure:
  ### THE MAXIM
  **{maxim}**
  
  ### LITERAL TRANSLATION
  [Provide the direct translation from Latin/Greek/Old French to English]
  
  ### CORE LEGAL MEANING
  [Explain the fundamental legal principle this maxim represents in 2-3 sentences]
  
  ### HISTORICAL ORIGIN
  [Briefly describe the origin of this maxim (e.g., Roman Law, English Common Law, etc.)]
  
  ### MODERN APPLICATION & EXAMPLES
  [Provide 2 modern legal scenarios or landmark cases where this maxim was applied or cited]
  
  ### WHY IT MATTERS
  [Explain why this maxim is still relevant for law students and practitioners today]
  
  Formatting: Use Markdown for clear scannability.`,

  DOCTRINES: `Role: You are the Lead Legal Analyst for Lexalyse, an advanced Indian Legal-Tech platform. Your goal is to explain complex legal doctrines to law students and practitioners with 100% accuracy and zero fluff.

Task: Explain the {doctrine} in a single, high-impact paragraph.

Constraints:
The "What": Start with a 1-sentence definition of the doctrine.
The "Why": Explain the core legal logic or the "mischief" it intends to prevent.
The "Indian Context": Mention the landmark Indian Supreme Court case that established or solidified it (e.g., Kesavananda Bharati for Basic Structure or State of Bombay v. F.N. Balsara for Pith and Substance).
The "BNS/BNSS Link": Briefly mention if it impacts the interpretation of the new Bharatiya Nyaya Sanhita or Bharatiya Nagarik Suraksha Sanhita (if applicable).

Tone: Academic yet accessible; professional but not archaic.
Length: Maximum 150 words.
Formatting: Use bolding for the case name and the core legal principle.`,

  NEWS: `Role: You are a Legal News Curator for Lexalyse. Your task is to provide 3 highly relevant, recent, and impactful legal news headlines from India, specifically sourcing from Bar & Bench (barandbench.com).
  
  Current Date: {date}
  
  Instructions:
  1. Use Google Search to find the 3 most recent articles from barandbench.com/latest-legal-news.
  2. Ensure the 'url' provided is the EXACT, direct link to the full article on Bar & Bench.
  3. Do NOT hallucinate or guess URLs. If a direct URL is not found, use 'https://www.barandbench.com/latest-legal-news'.
  
  Output Format: Return a JSON array of 3 objects, each with 'headline', 'source', and 'url' fields.
  Example: [{"headline": "SC stays implementation of new IT rules", "source": "Bar & Bench", "url": "https://www.barandbench.com/news/sc-stays-it-rules"}]
  
  Strictly return ONLY the JSON array.`,

  DRAFTING: `Role: You are a Senior Legal Counsel and Professional Draftsman with 20+ years of experience in the High Courts and Supreme Court of India. You are known for "Concise Brilliance" and "Zero-Error" drafting.
Objective: Draft a {documentType} based on the following Facts: {details}.
Core Directives for Accuracy:
1. Verification Phase: Before drafting, identify the Governing Law (e.g., BNS, BNSS, BSA, CPC, or Companies Act 2013). If the date of the incident is after July 1, 2024, strictly use BNS/BNSS; if before, use IPC/CrPC.
2. Anti-Hallucination Guardrail: Never invent case law. If a citation is needed but not provided in the context, use a bold placeholder like [Insert Relevant Case Citation on [Topic]].
3. The "Fine English" Standard: Use "Modern Curial" English. Avoid archaic legalese (e.g., use "Despite" instead of "Notwithstanding anything contained hereinbefore") unless the specific court format mandates it. Ensure high-level professional syntax.
4. Fact-Strictness: Stick strictly to the provided facts. If a critical detail is missing (e.g., date of notice), insert a placeholder in brackets: [Insert Date of Notice here].
Drafting Structure:
• Formal Heading: Standard Indian Court format.
• The "Pith": A 2-sentence summary of the prayer/relief at the beginning.
• Logical Sequencing: Chronological facts, followed by specific legal grounds, followed by a precise "Prayer" clause.
Final Review Step: Scan the final draft for:
• Inconsistencies: Does the "Facts" section match the "Grounds"?
• Redundancy: Remove any repetitive sentences.
• Professionalism: Ensure the tone is firm, respectful, and authoritative`
};

// ============================================================
// AI CLIENT
// ============================================================
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'AIzaSyAw9esDhBizCmxlBYWhIHTFwKgLsD7s5jo') {
    console.error("GEMINI_API_KEY is missing or invalid.");
    throw new Error(
      "Gemini API Key is missing or invalid. " +
      "If you are running this project locally, please create a .env file " +
      "in the root directory and add GEMINI_API_KEY=YOUR_ACTUAL_API_KEY. " +
      "You can get your API key from https://aistudio.google.com/app/apikey"
    );
  }
  return new GoogleGenAI({ apiKey });
};

// ============================================================
// SERVICE FUNCTIONS
// ============================================================

export const generateCaseAnalysis = async (query: string) => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Search and analyze the case: ${query}`,
      config: {
        systemInstruction: PROMPTS.CASE_ANALYSIS,
        tools: [{ googleSearch: {} }],
      },
    });

    return response.text;
  } catch (error: any) {
    console.error("Case Analysis Error:", error);
    if (error?.message?.includes('429') || error?.message?.includes('quota')) {
      return "QUOTA_EXCEEDED: You have reached the Gemini API free tier limit. Please wait a minute or check your quota at https://aistudio.google.com/app/plan";
    }
    return null;
  }
};

export const generateDeepCaseAnalysisStream = async (url: string, caseName: string, onChunk: (text: string) => void) => {
  try {
    const ai = getAiClient();
    const prompt = `Analyze this judgment: ${url}. Case Name: ${caseName}`;

    const response = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: PROMPTS.DEEP_CASE_ANALYSIS,
        tools: [{ urlContext: {} }],
      },
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text || "";
      fullText += text;
      onChunk(fullText);
    }
    return fullText;
  } catch (error: any) {
    console.error("Deep Case Analysis Stream Error:", error);
    if (error?.message?.includes('429') || error?.message?.includes('quota')) {
      const errorMsg = "QUOTA_EXCEEDED: You have reached the Gemini API free tier limit. Please wait a minute or check your quota at https://aistudio.google.com/app/plan";
      onChunk(errorMsg);
      return errorMsg;
    }
    return null;
  }
};

export const generateBareActTextStream = async (act: string, section: string, onChunk: (text: string) => void) => {
  try {
    const ai = getAiClient();
    let systemInstruction = PROMPTS.BARE_ACT;

    if (act.toLowerCase().includes("constitution")) {
      systemInstruction = systemInstruction.replace(/Section/g, "Article");
    }

    const response = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents: `Please find and provide the verbatim text of ${act.toLowerCase().includes("constitution") ? "Article" : "Section"} ${section} of the ${act}. Use Google Search to ensure accuracy.`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text || "";
      fullText += text;
      onChunk(fullText);
    }

    if (!fullText || fullText.includes("STATUTORY TEXT NOT FOUND")) {
      const errorMsg = `### **${act} - ${section}**\n\n> Statutory text not found for this section. Please verify the section number or check the official [India Code](https://www.indiacode.nic.in/) portal.`;
      onChunk(errorMsg);
      return errorMsg;
    }

    return fullText;
  } catch (error: any) {
    console.error("Bare Act Text Stream Error:", error);
    let errorMsg = "Unable to fetch original text. Please check your API key and connection.";
    if (error?.message?.includes('429') || error?.message?.includes('quota')) {
      errorMsg = "QUOTA_EXCEEDED: You have reached the Gemini API free tier limit. Please wait a minute or check your quota at https://aistudio.google.com/app/plan";
    }
    onChunk(errorMsg);
    return errorMsg;
  }
};

export const generateAcademicAnalysisStream = async (act: string, section: string, onChunk: (text: string) => void) => {
  try {
    const ai = getAiClient();
    let systemInstruction = PROMPTS.ACADEMIC;

    if (act.toLowerCase().includes("constitution")) {
      systemInstruction = systemInstruction.replace(/Section/g, "Article");
    }

    const response = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents: `Please provide an academic analysis of ${act.toLowerCase().includes("constitution") ? "Article" : "Section"} ${section} of the ${act}. Use Google Search to verify the latest legal position.`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text || "";
      fullText += text;
      onChunk(fullText);
    }
    return fullText;
  } catch (error: any) {
    console.error("Academic Analysis Stream Error:", error);
    let errorMsg = "Unable to generate analysis. Please check your API key and connection.";
    if (error?.message?.includes('429') || error?.message?.includes('quota')) {
      errorMsg = "QUOTA_EXCEEDED: You have reached the Gemini API free tier limit. Please wait a minute or check your quota at https://aistudio.google.com/app/plan";
    }
    onChunk(errorMsg);
    return errorMsg;
  }
};

export const generateMootAnalysisStream = async (side: string, argument: string, onChunk: (text: string) => void) => {
  try {
    const ai = getAiClient();
    const prompt = PROMPTS.MOOT.replace("{side}", side).replace("{argument}", argument);

    const response = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text || "";
      fullText += text;
      onChunk(fullText);
    }
    return fullText;
  } catch (error: any) {
    console.error("Moot Analysis Stream Error:", error);
    let errorMsg = "Unable to analyze argument. Please check your API key and connection.";
    if (error?.message?.includes('429') || error?.message?.includes('quota')) {
      errorMsg = "QUOTA_EXCEEDED: You have reached the Gemini API free tier limit. Please wait a minute or check your quota at https://aistudio.google.com/app/plan";
    }
    onChunk(errorMsg);
    return errorMsg;
  }
};

export const generateStatutoryConversionStream = async (type: string, section: string, onChunk: (text: string) => void) => {
  try {
    const ai = getAiClient();
    const prompt = PROMPTS.BRIDGE.replace("{type}", type).replace("{section}", section);

    const response = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text || "";
      fullText += text;
      onChunk(fullText);
    }
    return fullText;
  } catch (error: any) {
    console.error("Statutory Bridge Stream Error:", error);
    let errorMsg = "Unable to convert section. Please check your API key and connection.";
    if (error?.message?.includes('429') || error?.message?.includes('quota')) {
      errorMsg = "QUOTA_EXCEEDED: You have reached the Gemini API free tier limit. Please wait a minute or check your quota at https://aistudio.google.com/app/plan";
    }
    onChunk(errorMsg);
    return errorMsg;
  }
};

export const generateResearchResponseStream = async (
  history: { role: "user" | "model"; text: string }[],
  newMessage: string,
  onChunk: (text: string) => void,
  files?: FileData[]
) => {
  try {
    const ai = getAiClient();

    const contents = history.map((h) => ({
      role: h.role,
      parts: [{ text: h.text }],
    }));

    const newParts: any[] = [{ text: newMessage }];
    if (files && files.length > 0) {
      files.forEach((file) => {
        newParts.push(file);
      });
    }

    contents.push({
      role: "user",
      parts: newParts,
    });

    const response = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: PROMPTS.RESEARCH,
        tools: [{ googleSearch: {} }],
      },
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text || "";
      fullText += text;
      onChunk(fullText);
    }
    return fullText;
  } catch (error: any) {
    console.error("Research AI Stream Error:", error);
    let errorMsg = "I encountered an error. Please try again.";
    if (error?.message?.includes('429') || error?.message?.includes('quota')) {
      errorMsg = "QUOTA_EXCEEDED: You have reached the Gemini API free tier limit. Please wait a minute or check your quota at https://aistudio.google.com/app/plan";
    }
    onChunk(errorMsg);
    return errorMsg;
  }
};

export const generateMaximExplanationStream = async (maxim: string, onChunk: (text: string) => void) => {
  try {
    const ai = getAiClient();
    const prompt = PROMPTS.MAXIMS.replace(/{maxim}/g, maxim);

    const response = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text || "";
      fullText += text;
      onChunk(fullText);
    }
    return fullText;
  } catch (error: any) {
    console.error("Maxim Explanation Stream Error:", error);
    let errorMsg = "Unable to explain maxim. Please check your API key and connection.";
    if (error?.message?.includes('429') || error?.message?.includes('quota')) {
      errorMsg = "QUOTA_EXCEEDED: You have reached the Gemini API free tier limit. Please wait a minute or check your quota at https://aistudio.google.com/app/plan";
    }
    onChunk(errorMsg);
    return errorMsg;
  }
};

export const generateDoctrineExplanationStream = async (doctrine: string, onChunk: (text: string) => void) => {
  try {
    const ai = getAiClient();
    const prompt = PROMPTS.DOCTRINES.replace("{doctrine}", doctrine);

    const response = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text || "";
      fullText += text;
      onChunk(fullText);
    }
    return fullText;
  } catch (error: any) {
    console.error("Doctrine Explanation Stream Error:", error);
    let errorMsg = "Unable to explain doctrine. Please check your API key and connection.";
    if (error?.message?.includes('429') || error?.message?.includes('quota')) {
      errorMsg = "QUOTA_EXCEEDED: You have reached the Gemini API free tier limit. Please wait a minute or check your quota at https://aistudio.google.com/app/plan";
    }
    onChunk(errorMsg);
    return errorMsg;
  }
};

export const generateDraftStream = async (documentType: string, details: string, onChunk: (text: string) => void) => {
  try {
    const ai = getAiClient();
    const prompt = PROMPTS.DRAFTING.replace("{documentType}", documentType).replace(
      "{details}",
      details
    );

    const response = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text || "";
      fullText += text;
      onChunk(fullText);
    }
    return fullText;
  } catch (error: any) {
    console.error("Drafting Stream Error:", error);
    let errorMsg = "Unable to generate draft. Please check your API key and connection.";
    if (error?.message?.includes('429') || error?.message?.includes('quota')) {
      errorMsg = "QUOTA_EXCEEDED: You have reached the Gemini API free tier limit. Please wait a minute or check your quota at https://aistudio.google.com/app/plan";
    }
    onChunk(errorMsg);
    return errorMsg;
  }
};
