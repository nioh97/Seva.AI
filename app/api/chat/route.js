import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs"; // Node.js APIs for file handling

export async function POST(req) {
  try {
    const formData = await req.formData();
    const userMessage = formData.get("message") || "";
    const selectedLang = formData.get("lang") || "en-IN"; // only allow en-IN, hi-IN, mr-IN
    const imageFile = formData.get("image");

    // Validate language
    const allowedLangs = ["en-IN", "hi-IN", "mr-IN"];
    if (!allowedLangs.includes(selectedLang)) {
      return NextResponse.json(
        { error: "Unsupported language." },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(" AIzaSyATVfSGnGUmbLJKT9yKM0nG13ZtlspYHvI");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const langInstruction = `Please reply in the following language: ${selectedLang}.`;

    let promptParts;
    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const imageData = buffer.toString("base64");
      promptParts = [
        { text: `${userMessage} ${langInstruction}` },
        { inlineData: { data: imageData, mimeType: imageFile.type } },
      ];
    } else {
      promptParts = [{ text: `${userMessage} ${langInstruction}` }];
    }

    const result = await model.generateContent(promptParts);

    const reply =
      result.response.candidates[0]?.content?.parts[0]?.text ||
      "I couldn't generate a reply.";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: "50mb",
  },
};
