import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { Reservation, ReservationSchema } from './schemas/reservation.schema';
import { Event, EventSchema } from '../events/schemas/event.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reservation.name, schema: ReservationSchema },
      { name: Event.name, schema: EventSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}