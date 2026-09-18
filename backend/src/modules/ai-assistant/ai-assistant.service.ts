import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import OpenAI from 'openai';

type ChatMsg = OpenAI.Chat.Completions.ChatCompletionMessageParam;
import { appConfig } from '../../config/configuration';
import { CatalogService } from '../catalog/catalog.service';
import { Product, type ProductDocument } from '../catalog/product.schema';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { SOMMELIER_SYSTEM_PROMPT } from './assistant.prompts';
import { ChatSession, type ChatSessionDocument, type ChatMessage } from './chat-session.schema';

export interface ChatReply {
  reply: string;
  recommendedProductIds: string[];
  recommendations: ProductDocument[];
}

const HISTORY_LIMIT = 12;

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'what', 'you', 'your', 'me', 'give', 'some',
  'have', 'has', 'can', 'recommend', 'suggest', 'best', 'good', 'any', 'want',
  'need', 'buy', 'get', 'help', 'drink', 'drinks', 'please', 'would', 'like',
]);

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);
  private client?: OpenAI;

  constructor(
    @InjectModel(ChatSession.name) private readonly chatModel: Model<ChatSessionDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    private readonly catalog: CatalogService,
    private readonly recs: RecommendationsService,
  ) {
    const cfg = appConfig();
    if (cfg.groqApiKey) {
      this.client = new OpenAI({ apiKey: cfg.groqApiKey, baseURL: cfg.groqBaseUrl });
    } else {
      this.logger.warn('GROQ_API_KEY not set â€” AI assistant will use the fallback recommendation engine');
    }
  }

  async chat(userId: string, message: string): Promise<ChatReply> {
    const session = await this.ensureSession(userId);

    let reply: string;
    let modelIds: string[] = [];

    if (appConfig().groqApiKey) {
      const catalogContext = await this.buildCatalogContext(message);
      const history: ChatMessage[] = session.messages.slice(-HISTORY_LIMIT);

      const messages: ChatMsg[] = [
        { role: 'system', content: SOMMELIER_SYSTEM_PROMPT },
        ...history.map((m): ChatMsg => ({ role: m.role, content: m.content })),
        {
          role: 'system',
          content: `CATALOG CONTEXT (currently in stock, most relevant to the user's last message):\n${catalogContext}\n\nIf none of these fit the user's need, say so and give general guidance instead.`,
        },
        { role: 'user', content: message },
      ];

      try {
        const completion = await this.client!.chat.completions.create({
          model: appConfig().groqModel,
          messages,
          temperature: 0.7,
          max_tokens: 700,
        });
        const raw = completion.choices[0]?.message?.content ?? 'Sorry, I could not answer that.';
        const parsed = this.parseRecommendationIds(raw);
        reply = parsed.text;
        modelIds = parsed.ids;
      } catch (error) {
        this.logger.error(`Groq chat failed: ${String(error)}`);
        reply = await this.fallbackReply(userId, message);
      }
    } else {
      reply = await this.fallbackReply(userId, message);
    }

    const recommendations = await this.hydrateRecommendations(modelIds, message);
    const recommendedProductIds = recommendations.map((p) => String(p._id));

    session.messages.push({ role: 'user', content: message, createdAt: new Date() });
    session.messages.push({
      role: 'assistant',
      content: reply,
      recommendedProductIds,
      createdAt: new Date(),
    });
    await session.save();

    return { reply, recommendedProductIds, recommendations };
  }

  async getHistory(userId: string): Promise<ChatMessage[]> {
    const session = await this.chatModel.findOne({ userId }).exec();
    return session?.messages ?? [];
  }

  async clearHistory(userId: string): Promise<void> {
    await this.chatModel.findOneAndDelete({ userId }).exec();
  }

  private async ensureSession(userId: string): Promise<ChatSessionDocument> {
    const found = await this.chatModel.findOne({ userId }).exec();
    if (found) return found;
    return this.chatModel.create({ userId, messages: [] });
  }

  private parseRecommendationIds(raw: string): { text: string; ids: string[] } {
    const marker = /RECOMMENDED_ids:\s*(.+)/i;
    const match = raw.match(marker);
    if (!match) return { text: raw.trim(), ids: [] };
    const ids = match[1]
      .split(',')
      .map((id) => id.trim())
      .filter((id) => /^[0-9a-fA-F]{24}$/.test(id))
      .slice(0, 6);
    return { text: raw.replace(marker, '').trim(), ids };
  }

  private async buildCatalogContext(message: string): Promise<string> {
    const keywordProducts = await this.keywordSearch(message, 6);
    const list = keywordProducts.length > 0 ? keywordProducts : await this.recs.popular(4);
    return list
      .map(
        (p) =>
          `id: ${String(p._id)} | ${p.name} | ${p.category} (${p.subCategory}) | ${p.brand} | origin: ${p.origin} | ABV ${p.abv}% | Rs ${p.price} | flavors: ${p.flavorTags.join(', ')} | notes: ${p.tastingNotes.slice(0, 140)}`,
      )
      .join('\n');
  }

  async keywordSearch(query: string, limit: number): Promise<ProductDocument[]> {
    const words = query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
      .slice(0, 6);

    if (words.length === 0) return [];

    const or = words.flatMap((w) => [
      { name: new RegExp(w, 'i') },
      { brand: new RegExp(w, 'i') },
      { flavorTags: w },
      { category: new RegExp(w, 'i') },
      { subCategory: new RegExp(w, 'i') },
    ]);

    return this.productModel
      .find({ isActive: true, stock: { $gt: 0 }, $or: or })
      .sort({ popularity: -1, rating: -1 })
      .limit(limit)
      .exec();
  }

  private async hydrateRecommendations(ids: string[], message: string): Promise<ProductDocument[]> {
    const valid = ids.filter((id) => /^[0-9a-fA-F]{24}$/.test(id));
    const found: ProductDocument[] = [];
    for (const id of valid.slice(0, 4)) {
      const p = await this.catalog.getById(id);
      if (p && p.stock > 0) found.push(p);
    }
    if (found.length > 0) return found;
    return this.keywordSearch(message, 3);
  }

  private async fallbackReply(userId: string, message: string): Promise<string> {
    const picks = await this.keywordSearch(message, 3);
    const list = picks.length > 0 ? picks : await this.recs.popular(3);
    const lines = list.map(
      (p) =>
        `â€¢ **${p.name}** â€” Rs ${p.price}, ABV ${p.abv}%. ${p.tastingNotes.split('.')[0].trim()}. Pairings: ${(p.foodPairings ?? []).slice(0, 2).join(', ') || 'versatile'}.`,
    );
    return "Here are some drinks I think you'll enjoy based on your message:\n" + lines.join('\n');
  }
}
