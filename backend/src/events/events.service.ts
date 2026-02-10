import { Injectable ,BadRequestException,NotFoundException} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { InjectModel } from '@nestjs/mongoose';
import {Event,EventDocument} from './schemas/event.schema';
import { Model } from 'mongoose';
import { EventStatus } from 'src/common/enums';


@Injectable()
export class EventsService {


   constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
  ) {}
  async  create(createEventData: CreateEventDto) {
    

   const event= await this.eventModel.create({...createEventData});
   console.log("event",event);
   return  event;


   







  }
 
  async update(id: string, updateEventData: UpdateEventDto): Promise<Event> {
   console.log("id de event est :",id);
    const event = await this.eventModel.findById(id).exec();
    if (!event) {
      throw new NotFoundException('Event does not exist');
    }
 if(event.status===EventStatus.CANCELED){
  throw new BadRequestException('Cannot update a cancelled event');
 }
  
    if (
      updateEventData.maxCapacity  &&
      updateEventData.maxCapacity < event.currentBookings
    ) {
      throw new BadRequestException(
        `Cannot reduce capacity below current bookings (${event.currentBookings})`,
      );
    }

  
    Object.assign(event, updateEventData);

    
    return await event.save();
  }
  async updateStatus(
  id: string,
  newStatus: EventStatus,
 
) {
  console.log(" new status de event",newStatus);
  
  const event = await this.eventModel.findById(id).exec();

  if (!event) {
    throw new NotFoundException(`Event with ID ${id} not found`);
  }

 
  if (event.status === newStatus) {
    throw new BadRequestException(`Event is already ${newStatus}`);
  }

  
  const currentStatus = event.status;

  
  if (currentStatus === EventStatus.DRAFT) {
    if (newStatus !== EventStatus.PUBLISHED && newStatus !== EventStatus.CANCELED) {
      throw new BadRequestException(
        `Cannot change status from DRAFT to ${newStatus}. Allowed: PUBLISHED, CANCELED`
      );
    }
  }

 
  if (currentStatus === EventStatus.PUBLISHED) {
    if (newStatus !== EventStatus.CANCELED) {
      throw new BadRequestException(
        `Cannot change status from PUBLISHED to ${newStatus}. Only CANCELED is allowed`
      );
    }
  }

 
  if (currentStatus === EventStatus.CANCELED) {
    throw new BadRequestException(
      'Cannot change status of a canceled event. Canceled is a final status'
    );
  }

 
  // if (newStatus === EventStatus.PUBLISHED) {
   
  //   if (!event.title || !event.description || !event.dateTime || !event.location) {
  //     throw new BadRequestException(
  //       'Cannot publish event with incomplete information'
  //     );
  //   }

  //   // Vérifier que la date est dans le futur
  //   if (new Date(event.dateTime) <= new Date()) {
  //     throw new BadRequestException(
  //       'Cannot publish event with a past date'
  //     );
  //   }
  // }

  
  event.status = newStatus;
  const updatedEvent = await event.save();

  return updatedEvent;
}
async getAllEvents(){
  const AllEvents= this.eventModel.find({isDeleted:false});
   return AllEvents;
}
 async getPublishEvents(){


  const events= await this.eventModel.find({status:EventStatus.PUBLISHED});
  return events;
 }
 async findById(id:string){
   return   await this.eventModel.findById(id).exec();
 }
 async delete(id: string) {
  const event = await this.eventModel.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true } 
  );

  if (!event) {
    throw new NotFoundException('Event does not exist');
  }

  return event;
}




  }















































 
