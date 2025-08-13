import { v2 as cloudinary } from 'cloudinary';

export function assertCloudinaryEnv() {
	const missing = [
		['CLOUDINARY_CLOUD_NAME', process.env.CLOUDINARY_CLOUD_NAME],
		['CLOUDINARY_API_KEY', process.env.CLOUDINARY_API_KEY],
		['CLOUDINARY_API_SECRET', process.env.CLOUDINARY_API_SECRET],
	].filter(([k, v]) => !v).map(([k]) => k as string);
	if (missing.length) {
		const msg = `Missing Cloudinary env: ${missing.join(', ')}`;
		console.error('[cloudinary] ' + msg);
		const err: any = new Error(msg);
		err.code = 'ENV_MISSING';
		throw err;
	}
}

export function initCloudinary() {
	assertCloudinaryEnv();
	cloudinary.config({
		cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
		api_key: process.env.CLOUDINARY_API_KEY!,
		api_secret: process.env.CLOUDINARY_API_SECRET!,
		secure: true,
	});
	return cloudinary;
}
