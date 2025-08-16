// Debug function to check environment variables (remove after testing)

exports.handler = async (event) => {
  try {
    const hasJwtSecret = !!process.env.JWT_SECRET;
    const jwtSecretLength = process.env.JWT_SECRET?.length || 0;
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
const hasNeonDatabaseUrl = !!process.env.NEON_DATABASE_URL;
    const hasCloudinaryName = !!process.env.CLOUDINARY_CLOUD_NAME;
    const hasCloudinaryKey = !!process.env.CLOUDINARY_API_KEY;
    const hasCloudinarySecret = !!process.env.CLOUDINARY_API_SECRET;
    
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        environment: {
          JWT_SECRET: hasJwtSecret ? `set (${jwtSecretLength} chars)` : 'NOT SET',
              DATABASE_URL: hasDatabaseUrl ? 'set' : 'NOT SET',
    NEON_DATABASE_URL: hasNeonDatabaseUrl ? 'set' : 'NOT SET',
          CLOUDINARY_CLOUD_NAME: hasCloudinaryName ? 'set' : 'NOT SET',
          CLOUDINARY_API_KEY: hasCloudinaryKey ? 'set' : 'NOT SET',
          CLOUDINARY_API_SECRET: hasCloudinarySecret ? 'set' : 'NOT SET'
        },
        note: "Delete this function after debugging"
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message })
    };
  }
};
