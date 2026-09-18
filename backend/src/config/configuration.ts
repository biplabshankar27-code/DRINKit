export interface AppConfig {
  port: number;
  jwtSecret: string;
  jwtExpiresIn: string;
  xaiApiKey?: string;
  xaiBaseUrl: string;
  xaiModel: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
}

export const appConfig = (): AppConfig => ({
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  xaiApiKey: process.env.XAI_API_KEY,
  xaiBaseUrl: process.env.XAI_BASE_URL ?? 'https://api.x.ai/v1',
  xaiModel: process.env.XAI_MODEL ?? 'grok-3-mini',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
});
