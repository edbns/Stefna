import { sql } from './_db';
export const handler = async () => {
    try {
        // Simple database connection test
        const result = await sql `SELECT 1 as test, NOW() as timestamp`;
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                message: 'Database connection successful',
                result: result[0],
                timestamp: new Date().toISOString()
            })
        };
    }
    catch (error) {
        console.error('❌ Database test failed:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: 'DATABASE_CONNECTION_FAILED',
                message: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
};
