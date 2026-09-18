import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'wishlists' })
export class Wishlist {
  @Prop({ required: true, unique: true, index: true })
  userId!: string;

  @Prop({ type: [String], default: [] })
  productIds!: string[];
}

export type WishlistDocument = HydratedDocument<Wishlist>;
export const WishlistSchema = SchemaFactory.createForClass(Wishlist);
