import { Controller, Get, Post, Body,Query, Patch, Param, Delete, UseGuards,Request } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import {ReservationStatus, Role} from '../common/enums';
import {Roles} from '../common/decorators/roles.decorator';



@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}
   @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PARTICIPANT)
 
   async create(@Body() createReservationDto: CreateReservationDto,@Request()req) {

   
     const reservation=  await  this.reservationsService.create(createReservationDto,req.user.userId);
     return {
      succes:true,
      message:" Reserved successfully",
      data:reservation
     }
  }
@Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)

async allReservations(
  @Query('eventId') eventId?: string,
  @Query('participantId') participantId?: string,
  @Query('status') status?: ReservationStatus,
) {
  const reservations = await this.reservationsService.findAll({
    eventId,
    participantId,
    status,
  });
  console.log("controller reserve",reservations);

  return {
    success: true,
    data: reservations,
  };
} 
@Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PARTICIPANT)
 
  async MesReservations(@Request() req,@Query('status') status?: ReservationStatus){
    const reservations= await this.reservationsService.findMyReservations(req.user.userId,status);
    return {
     success: true,
      message: 'Your reservations listes successfully',
      data: reservations,

    }

  }
  @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PARTICIPANT,Role.ADMIN)
  
  async getReservationById(@Param('id') id: string,) {
    const reservation = await this.reservationsService.findById(
      id,
     
    );

    return {
      success: true,
      message: 'Reservation retrieved successfully',
      data: reservation,
    };
  } 
  @Patch(':id/cancel')
    @UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PARTICIPANT)

  async cancelMaReservation(@Param('id')id:string,@Request()req){
    const reservation= await this.reservationsService.cancelMaReservation(req.user.userId,id);
    return {
      succes:true,
      message:"cancelled reservation succefulyy",
      data:reservation
    }
  }
  @Patch(':id/status')
   @UseGuards(JwtAuthGuard, RolesGuard)

@Roles( Role.ADMIN) 
async updateReservationStatus(
  @Param('id') id: string, 
  @Body() updateStatusDto: UpdateReservationDto, 
  @Request() req,
) {
  const reservation = await this.reservationsService.updateStatus(
    id,
    updateStatusDto 
  );

  return {
    success: true,
    message: 'Reservation status updated successfully',
    data: reservation,
  };
}
}

