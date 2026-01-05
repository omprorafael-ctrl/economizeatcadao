
import { GoogleGenAI, Type } from "@google/genai";

// Inicialização segura para evitar quebra do app no import
const getAI = () => {
  const key = process.env.API_KEY || process.env.GEMINI_API_KEY;
  return new GoogleGenAI({ apiKey: key || 'dummy_key' });
};

export const extractProductsFromPdf = async (base64Pdf: string) => {
  const ai = getAI();
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

export const searchProductImage = async (productDescription: string): Promise<string | null> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Encontre uma URL direta de imagem de alta qualidade para o seguinte produto do Atacadão: "${productDescription}". 
      A imagem deve ser profissional, preferencialmente em fundo branco. 
      Retorne APENAS a URL da imagem encontrada. Se não encontrar, retorne uma string vazia.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const url = response.text?.trim();
    if (url && (url.startsWith('http') || url.startsWith('https'))) {
      return url;
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar imagem via IA:", error);
    return null;
  }
};
