// netlify/functions/cloudinary-sign.ts
import { json } from '@netlify/functions'
import crypto from 'crypto'

export default async () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!
  const apiKey = process.env.CLOUDINARY_API_KEY!
  const apiSecret = process.env.CLOUDINARY_API_SECRET!
  const timestamp = Math.floor(Date.now() / 1000)
  const folder = 'stefna/sources' // single source of truth

  const toSign = `folder=${folder}&timestamp=${timestamp}`
  const signature = crypto.createHash('sha1').update(toSign + apiSecret).digest('hex')

  return json({ cloudName, apiKey, timestamp, signature, folder })
}
