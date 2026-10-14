const fs = require('fs');

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
    .map(l => l.split('='))
);
const key = env.GEMINI_API_KEY;

(async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch({ headless: true, channel: 'msedge' });
  const p = await b.newPage();
  await p.goto('http://localhost:3000');

  const pdfBuf = fs.readFileSync('C:/Users/nathaphat/.gemini/antigravity/brain/82ac165c-57d1-452c-ba17-cfd4425cb1c4/.user_uploaded/media_1791938569863_98eb2182.pdf');
  await p.locator('input[type=file]').setInputFiles({ name: 'chapter7.pdf', mimeType: 'application/pdf', buffer: pdfBuf });
  await p.waitForTimeout(3000);

  const pageImages = await p.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('[data-workspace="source"] img'));
    return imgs.map(i => i.src);
  });

  const page3 = pageImages[2];
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(page3);

  const systemPrompt = `You are an expert Thai examination visual diagram and table extractor.
Analyze this Thai exam page image and detect ALL figures, apparatus diagrams, data tables, framed boxes (ตารางโจทย์ หรือ กรอบปิดสี่เหลี่ยม), experiment illustrations, and choice diagrams.

CRITICAL INSTRUCTIONS:
1. CHOICE DIAGRAMS / MULTI-OPTION FIGURES:
   When choices (1, 2, 3, 4 or ก, ข, ค, ง) contain individual images or illustrations (e.g. crystal shapes, circuit diagrams, geometric forms):
   - You MUST extract EACH choice image as a separate item with type: "choice".
   - Set "choiceKey": "ก" (for choice 1), "ข" (for choice 2), "ค" (for choice 3), "ง" (for choice 4).
   - "questionNumber": the question number (e.g. 16).
   - "bbox": bounding box tightly enclosing ONLY that specific choice's image (not the choice number text).
   - DO NOT combine all choices into one single question box!

2. SHARED CONTEXT TABLES & FIGURES (โจทย์ร่วม):
   - When a table or diagram is used for multiple questions (e.g. "ใช้ข้อมูลในตารางต่อไปนี้ตอบคำถามข้อ 17-18" or "ใช้รูปต่อไปนี้ตอบคำถามข้อ 28-29"):
   - Set type: "shared_context".
   - "questionNumber": the FIRST question number in the range (e.g. 17).
   - "bbox": bounding box enclosing the ENTIRE framed table (all outer border strokes, inner rows/columns, and headers) with a 4px margin.

3. QUESTION FIGURES (รูปโจทย์):
   - Single question prompt illustrations or apparatus diagrams: type: "question", "questionNumber": integer.

Return JSON format:
{
  "diagrams": [
    {
      "type": "question" | "shared_context" | "choice" | "explanation",
      "questionNumber": number,
      "choiceKey": "ก" | "ข" | "ค" | "ง" | null,
      "description": string in Thai,
      "bbox": [ymin, xmin, ymax, xmax] (normalized 0..1000)
    }
  ]
}`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [
        {
          role: 'user',
          parts: [
            { text: 'Page 3: Extract individual choice crystal images for Question 16 (ก, ข, ค, ง), and the shared context table for Question 17-18.' },
            { inlineData: { mimeType: `image/${match[1]}`, data: match[2] } }
          ]
        }
      ],
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
        maxOutputTokens: 4096
      }
    })
  });

  console.log('Status:', res.status);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  console.log('Result:\n', text);

  await b.close();
})();
