
import { GoogleGenAI, Type } from "@google/genai";

export const extractProductsFromPdf = async (base64Pdf: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          text: `Analise este arquivo PDF de catálogo ou tabela de preços. 
          Extraia todos os produtos encontrados. 
          Para cada produto, identifique: 
          1. Código (se houver, senão crie um sequencial)
          2. Descrição completa
          3. Grupo/Categoria (ex: Grãos, Limpeza, Bebidas)
          4. Preço unitário (apenas números).
          Retorne estritamente um array JSON válido.`
        },
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64Pdf.split(',')[1] || base64Pdf
          }
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            code: { type: Type.STRING },
            description: { type: Type.STRING },
            group: { type: Type.STRING },
            price: { type: Type.NUMBER }
          },
          required: ["code", "description", "group", "price"]
        }
      }
    }
  });

  try {
    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (e) {
    console.error("Erro ao parsear JSON da IA:", e);
    return [];
  }
};
