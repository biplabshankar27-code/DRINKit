export interface AppConfig {
  port: number;
  jwtSecret: string;
  jwtExpiresIn: string;
  groqApiKey?: string;
  groqBaseUrl: string;
  groqModel: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
}

export const appConfig = (): AppConfig => ({
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  groqApiKey: process.env.GROQ_API_KEY,
  groqBaseUrl: process.env.GROQ_BASE_URL ?? 'https://api.groq.com/openai/v1',
  groqModel: process.env.GROQ_MODEL ?? 'openai/gpt-oss-120b',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
});
