import { Controller, Get,Put, Post, Body, Patch, Param, Delete,UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import {Role,EventStatus}  from '../common/enums';
import { Roles } from '../common/decorators/roles.decorator';


@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}
 
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)

  @Post()
   async create(@Body() createEventData: CreateEventDto) {
    console.log("data created ",createEventData)
    const  newEvent=  await this.eventsService.create(createEventData);

    return {
      succes:true,
      message:"event created succefuly",
      data:newEvent
    }
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
  @Put(':id')
  async update (@Param('id') id: string,@Body() updateData:UpdateEventDto){
    const event= await this.eventsService.update(id,updateData);
    return {
      succes:true,
      message:"updated succefuly ",
      data:event
    }

  }
  @UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Patch(':id/status')
async updateStatus(
  @Param('id') id: string,
  @Body() body,
) {
 

  const event = await this.eventsService.updateStatus(id, body.status);

  return {
    succes: true,
    message: 'updated status successfully',
    data: event,
  };
}
 @UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Get()
async AllEvents(){
  const events=await this.eventsService.getAllEvents();
  return {
    succes:true,
    message:"listes des events  ",
    data:events
  }
}
@Get('public') 
async PublishEvents(){
  const events=  await this .eventsService.getPublishEvents();
  return {
    succes:true,
    message:"listes des events  public ",
    data:events
  }
}
 @Get(':id')
async findById(@Param('id') id: string) {
  const event = await this.eventsService.findById(id);

  return {
    success: true,
    message: 'Event found successfully',
    data: event,
  };
} @Get(':id')

@Delete(':id')
async delete(@Param('id') id: string) {
  const event = await this.eventsService.delete(id);

  return {
    success: true,
    message: 'deleted successfully',
    data: event,
  };
}







}
