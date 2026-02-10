import { Injectable, NotFoundException, ForbiddenException,BadRequestException, ConflictException } from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { Reservation, ReservationDocument } from './schemas/reservation.schema';
import { Event, EventDocument } from 'src/events/schemas/event.schema';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { EventStatus, ReservationStatus } from 'src/common/enums';
import { Types } from 'mongoose';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) { }
   private async decrementEventBookings(eventId:Types.ObjectId): Promise<void> {
    await this.eventModel.findByIdAndUpdate(
      eventId,
      { $inc: { currentBookings: -1 } }, 
      { new: true },
    );
  }
   private allowedTransitions: Record<ReservationStatus, ReservationStatus[]> = {
  [ReservationStatus.PENDING]: [
    ReservationStatus.CONFIRMED,
    ReservationStatus.REFUSED,
    ReservationStatus.CANCELED,
  ],
  [ReservationStatus.CONFIRMED]: [
    ReservationStatus.REFUSED,
    ReservationStatus.CANCELED,
  ],
  [ReservationStatus.REFUSED]: [],
  [ReservationStatus.CANCELED]: [],
};

  async create(ReservationData: CreateReservationDto, userId: string) {
    const { eventId } = ReservationData;
    const event = await this.eventModel.findById(eventId).exec();
    if (!event) {
      throw new NotFoundException('event not found ');

    }

    if (event.status !== EventStatus.PUBLISHED) {
      throw new BadRequestException('Can only reserve published events');
    }
    if (event.currentBookings >= event.maxCapacity) {
      throw new BadRequestException('Event is fully booked');
    }
    const existingReservation = await this.reservationModel
      .findOne({
        eventId,
        participantId: userId,
        status: { $in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
      })
      .exec();

    if (existingReservation) {
      throw new ConflictException('You already have a reservation for this event');
    }
    const reservation = await this.reservationModel.create({ eventId: eventId, participantId: userId, reservedAt: new Date() });
    event.currentBookings += 1;
    await event.save();

    return reservation;



  }


  async findAll(filter:{ eventId?: string;
  participantId?: string;
  status?: ReservationStatus;}){
    const query:any={};
     if (filter?.eventId) query.eventId = filter.eventId;
    if (filter?.participantId) query.participantId = filter.participantId;
    if (filter?.status) query.status = filter.status;
     const  reservations=await this.reservationModel.find(query).populate(
      'eventId',
      'title dateTime location status maxCapacity currentBookings',
    )
    .sort({ reservedAt: -1 })
    .exec();
    return reservations;
  }
  async findById(id:string){
        const reservation = await this.reservationModel
      .findById(id)
      .populate('eventId', 'title dateTime location createdBy')
      .populate('participantId', 'firstName lastName email')
      .exec();
      return reservation;

  }
   async cancelMaReservation(participantId:string,reservationId:string){
    const reservation= await this.reservationModel.findById(reservationId);
    if(!reservation){
      throw new NotFoundException(" reservation not found");
    }
    if(reservation.participantId.toString() !== participantId){
           throw new ForbiddenException('You can only cancel your own reservations');

    }
    if (reservation.status === ReservationStatus.CANCELED) {
      throw new BadRequestException('Reservation is already canceled');
    }

    if (reservation.status === ReservationStatus.REFUSED) {
      throw new BadRequestException('Cannot cancel a refused reservation');
    }
    reservation.status=ReservationStatus.CANCELED;
    reservation.canceledAt=new Date();
    reservation.status = ReservationStatus.CANCELED;
    reservation.canceledAt = new Date();
    await reservation.save();

   
    await this.decrementEventBookings(reservation.eventId);

    return reservation;



   }
  async updateStatus(
    reservationId: string,
    updateStatusDto: UpdateReservationDto,
  ) {
   
    const reservation = await this.reservationModel
      .findById(reservationId)
      .populate('eventId')
      .exec();

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    const oldStatus = reservation.status;
    const newStatus = updateStatusDto.status;

   
    if (oldStatus === newStatus) {
      throw new BadRequestException(`Reservation is already ${newStatus}`);
    }

   
    if (!this.allowedTransitions[oldStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Cannot change status from ${oldStatus} to ${newStatus}`,
      );
    }

   
    reservation.status = newStatus;

  
    if (newStatus === ReservationStatus.CONFIRMED) {
      reservation.confirmedAt = new Date();
    } else if (newStatus === ReservationStatus.CANCELED) {
      reservation.canceledAt = new Date();
    }

   
    if (
      (oldStatus === ReservationStatus.PENDING ||
        oldStatus === ReservationStatus.CONFIRMED) &&
      (newStatus === ReservationStatus.REFUSED ||
        newStatus === ReservationStatus.CANCELED)
    ) {
      await this.decrementEventBookings(reservation.eventId);
    }

  
    await reservation.save();

    return reservation;
  }


















 async findMyReservations(
  participantId: string,
  status?: ReservationStatus,
) {
  const query: any = {
    participantId: participantId,
  };

  if (status) {
    query.status = status;
  }

  console.log("query",query);
  const reservations = await this.reservationModel
    .find(query)
    .populate(
      'eventId',
      'title description dateTime location status maxCapacity currentBookings',
    )
    .sort({ reservedAt: -1 })
    .exec();
  

  return reservations;
}

}
