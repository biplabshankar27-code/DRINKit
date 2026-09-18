import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'products' })
export class Product {
  @Prop({ required: true, index: true })
  name!: string;

  @Prop({ required: true, index: true })
  category!: string;

  @Prop({ required: true })
  subCategory!: string;

  @Prop({ required: true })
  brand!: string;

  @Prop({ required: true })
  origin!: string;

  @Prop({ required: true })
  abv!: number;

  @Prop({ required: true })
  volumeMl!: number;

  @Prop({ required: true, index: true })
  price!: number;

  @Prop({ default: 0 })
  compareAtPrice?: number;

  @Prop({ required: true })
  image!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ type: [String], required: true, index: true })
  flavorTags!: string[];

  @Prop({ required: true })
  tastingNotes!: string;

  @Prop({ type: [String], default: [] })
  foodPairings!: string[];

  @Prop({ type: [String], default: [] })
  occasionTags!: string[];

  @Prop({ type: [String], default: [] })
  cocktailUses!: string[];

  @Prop({ required: true, default: 0, index: true })
  stock!: number;

  @Prop({ default: 0 })
  popularity!: number;

  @Prop({ default: 0 })
  rating!: number;

  @Prop({ default: true })
  isActive!: boolean;
}

export type ProductDocument = HydratedDocument<Product>;
export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ name: 'text', brand: 'text', description: 'text' });

export interface CatalogFilters {
  category?: string;
  subCategory?: string;
  flavors?: string[];
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  origin?: string;
  abvMin?: number;
  abvMax?: number;
  page: number;
  limit: number;
}
