import { Worker } from 'bullmq'
import IORedis from 'ioredis'
import { prisma } from '@/lib/prisma'
import { extractTextFromBuffer, extractEntities } from '@/lib/ocr'
import { popQueue, type PopJobData } from '@/lib/queue'

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379')

const worker = new Worker<PopJobData>(
  'pop-processing',
  async (job) => {
    const { popId, filePath } = job.data
    
    console.log(`[Worker] Processando POP ${popId}...`)
    
    try {
      await prisma.pop.update({
        where: { id: popId },
        data: { status: 'PROCESSANDO' }
      })
      
      const texto = await extractTextFromBuffer(filePath)
      console.log(`[Worker] Texto extraído: ${texto.length} caracteres`)
      
      const entidades = extractEntities(texto)
      console.log('[Worker] Entidades:', entidades)
      
      await prisma.pop.update({
        where: { id: popId },
        data: {
          status: 'EM_REVISAO',
          conteudo: texto,
          metadados: { entities: entidades }
        }
      })
      
      console.log(`[Worker] POP ${popId} processado com sucesso!`)
    } catch (error) {
      console.error(`[Worker] Erro ao processar POP ${popId}:`, error)
      await prisma.pop.update({
        where: { id: popId },
        data: { status: 'REJEITADO' }
      })
      throw error
    }
  },
  { connection }
)

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err)
})

worker.on('completed', (job) => {
  console.log(`Job ${job?.id} completed`)
})

console.log('🚀 Worker de processamento de POPs iniciado...')
