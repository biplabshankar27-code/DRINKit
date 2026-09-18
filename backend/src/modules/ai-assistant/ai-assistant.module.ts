import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedModule } from '../../common/shared.module';
import { CatalogModule } from '../catalog/catalog.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { AiAssistantController } from './ai-assistant.controller';
import { AiAssistantService } from './ai-assistant.service';
import { ChatSession, ChatSessionSchema } from './chat-session.schema';
import { CocktailRecipe, CocktailRecipeSchema } from './cocktail-recipe.schema';
import { Product, ProductSchema } from '../catalog/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatSession.name, schema: ChatSessionSchema },
      { name: CocktailRecipe.name, schema: CocktailRecipeSchema },
    ]),
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    SharedModule,
    forwardRef(() => CatalogModule),
    forwardRef(() => RecommendationsModule),
  ],
  controllers: [AiAssistantController],
  providers: [AiAssistantService],
  exports: [AiAssistantService],
})
export class AiAssistantModule {}
