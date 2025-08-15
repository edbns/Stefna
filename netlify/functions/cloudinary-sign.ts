import crypto from 'crypto'

export async function handler(event) {
  const { folder = 'stefna/sources' } = JSON.parse(event.body || '{}')

  const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!
  const API_KEY    = process.env.CLOUDINARY_API_KEY!
  const API_SECRET = process.env.CLOUDINARY_API_SECRET!

  const timestamp = Math.floor(Date.now() / 1000)

  // if you add params to the client, add them here too (alphabetically)
  const toSign = `folder=${folder}&timestamp=${timestamp}`
  const signature = crypto
    .createHash('sha1')
    .update(toSign + API_SECRET)
    .digest('hex')

  return {
    statusCode: 200,
    body: JSON.stringify({
      cloud_name: CLOUD_NAME,
      api_key: API_KEY,
      folder,
      timestamp,
      signature,
    }),
  }
}
