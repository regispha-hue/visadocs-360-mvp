import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/prisma'
import { popQueue } from '@/lib/queue'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadsDir = join(process.cwd(), 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    const fileName = `${uuidv4()}-${file.name}`
    const filePath = join(uploadsDir, fileName)
    await writeFile(filePath, buffer)

    const pop = await prisma.pop.create({
      data: {
        codigo: `POP-${Date.now()}`,
        titulo: file.name.replace(/\.[^/.]+$/, ''),
        setor: 'Farmácia',
        conteudo: "PENDENTE",
        status: 'RASCUNHO',
        filePath,
        autorId: 'default-user-id',
      }
    })

    await popQueue.add('process-pop', {
      popId: pop.id,
      filePath
    })

    return NextResponse.json({
      success: true,
      pop: {
        id: pop.id,
        codigo: pop.codigo,
        titulo: pop.titulo,
        setor: pop.setor,
        status: pop.status,
        createdAt: pop.createdAt
      }
    })
  } catch (error) {
    console.error('Erro ao fazer upload:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
