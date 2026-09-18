import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export interface CartLine {
  productId: string;
  name: string;
  image: string;
  price: number;
  category: string;
  quantity: number;
  stock: number;
}

@Schema({ collection: 'carts' })
export class Cart {
  @Prop({ required: true, unique: true, index: true })
  userId!: string;

  @Prop({ type: [], default: [] })
  items!: CartLine[];
}

export type CartDocument = HydratedDocument<Cart>;
export const CartSchema = SchemaFactory.createForClass(Cart);
