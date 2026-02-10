import Tesseract from 'tesseract.js'
import pdfParse from "pdf-parse";
import mammoth from 'mammoth'
import JSZip from 'jszip'
import { readFile } from 'fs/promises'
import path from 'path'

export async function extractTextFromBuffer(filePath: string): Promise<string> {
  const buffer = await readFile(filePath)
  const ext = path.extname(filePath).toLowerCase()
  
  if (ext === '.pdf') {
    try {
      const data = await pdfParse(buffer)
      return data.text
    } catch {
      const image = await Tesseract.recognize(buffer, 'por')
      return image.data.text
    }
  }
  
  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }
  
  if (['.png', '.jpg', '.jpeg'].includes(ext)) {
    const image = await Tesseract.recognize(buffer, 'por')
    return image.data.text
  }
  
  throw new Error('Formato de arquivo não suportado')
}

export function extractEntities(text: string): Record<string, any> {
  const entities: Record<string, any> = {}
  
  const medicamentos = text.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || []
  entities.medicamentos = medicamentos.slice(0, 5)
  
  const principios = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(\d+mg|\d+g|\d+mcg)/gi) || []
  entities.principios_ativos = principios.slice(0, 5)
  
  const dosagens = text.match(/\d+(?:\.\d+)?\s*(mg|g|mcg|ml|UI)/gi) || []
  entities.dosagens = dosagens.slice(0, 5)
  
  return entities
}
