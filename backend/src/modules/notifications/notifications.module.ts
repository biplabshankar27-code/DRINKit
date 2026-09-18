import { Module } from '@nestjs/common';
import { SharedModule } from '../../common/shared.module';
import { TrackingGateway } from './tracking.gateway';

@Module({
  imports: [SharedModule],
  providers: [TrackingGateway],
  exports: [TrackingGateway],
})
export class NotificationsModule {}
