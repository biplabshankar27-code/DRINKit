import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/tracking' })
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(TrackingGateway.name);
  private userSockets = new Map<string, Set<string>>();

  handleConnection(client: Socket): void {
    const userId = String(client.handshake.auth?.userId ?? '');
    if (userId) {
      if (!this.userSockets.has(userId)) this.userSockets.set(userId, new Set());
      this.userSockets.get(userId)!.add(client.id);
      client.join(`user:${userId}`);
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = String(client.handshake.auth?.userId ?? '');
    this.userSockets.get(userId)?.delete(client.id);
    if (this.userSockets.get(userId)?.size === 0) this.userSockets.delete(userId);
  }

  @SubscribeMessage('track')
  track(@MessageBody() body: { userId: string }): string {
    return body.userId;
  }

  emitOrderStatus(userId: string, payload: { orderId: string; status: string; etaMinutes?: number }): void {
    this.server.to(`user:${userId}`).emit('order:status', payload);
  }
}
