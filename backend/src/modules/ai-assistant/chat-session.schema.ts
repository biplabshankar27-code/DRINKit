import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  recommendedProductIds?: string[];
  createdAt: Date;
}

@Schema({ collection: 'chat_history' })
export class ChatSession {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ type: [], default: [] })
  messages!: ChatMessage[];
}

export type ChatSessionDocument = HydratedDocument<ChatSession>;
export const ChatSessionSchema = SchemaFactory.createForClass(ChatSession);
