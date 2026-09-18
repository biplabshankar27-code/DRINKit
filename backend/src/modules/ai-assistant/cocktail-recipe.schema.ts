import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'cocktail_recipes' })
export class CocktailRecipe {
  @Prop({ required: true, index: true })
  name!: string;

  @Prop({ required: true })
  baseSpirit!: string;

  @Prop({ type: [String], required: true })
  ingredients!: string[];

  @Prop({ required: true })
  instructions!: string;

  @Prop({ type: [String], default: [] })
  flavorTags!: string[];
}

export type CocktailRecipeDocument = HydratedDocument<CocktailRecipe>;
export const CocktailRecipeSchema = SchemaFactory.createForClass(CocktailRecipe);
