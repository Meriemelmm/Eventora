import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsService } from 'src/reservations/reservations.service';
import { getModelToken } from '@nestjs/mongoose';
import { Reservation } from 'src/reservations/schemas/reservation.schema';
import { Event } from 'src/events/schemas/event.schema';
import { User } from 'src/users/schemas/user.schema';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { EventStatus, ReservationStatus } from 'src/common/enums';
import { Types } from 'mongoose';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let reservationModel;
  let eventModel;
  let userModel;

  // ==========================================
  // CONSTANTES - IDs fixes pour cohérence
  // ==========================================
  const MOCK_EVENT_ID = '507f1f77bcf86cd799439011';
  const MOCK_USER_ID = '507f1f77bcf86cd799439012';
  const MOCK_RESERVATION_ID = '507f1f77bcf86cd799439013';

  // ==========================================
  // FACTORY FUNCTIONS
  // ==========================================
  const createMockEvent = (overrides = {}) => ({
    _id: MOCK_EVENT_ID,
    title: 'Test Event',
    status: EventStatus.PUBLISHED,
    currentBookings: 5,
    maxCapacity: 10,
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
    ...overrides,
  });

  const createMockReservation = (overrides = {}) => ({
    _id: MOCK_RESERVATION_ID,
    eventId: MOCK_EVENT_ID,
    participantId: new Types.ObjectId(MOCK_USER_ID),
    status: ReservationStatus.PENDING,
    reservedAt: new Date('2026-01-01'),
    confirmedAt: null,
    canceledAt: null,
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
    ...overrides,
  });

  // ==========================================
  // MOCKS DES MODÈLES
  // ==========================================
  const mockReservationModel = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
  };

  const mockEventModel = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  const mockUserModel = {
    find: jest.fn(),
    findById: jest.fn(),
  };

  // ==========================================
  // CONFIGURATION
  // ==========================================
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        {
          provide: getModelToken(Reservation.name),
          useValue: mockReservationModel,
        },
        {
          provide: getModelToken(Event.name),
          useValue: mockEventModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
    reservationModel = module.get(getModelToken(Reservation.name));
    eventModel = module.get(getModelToken(Event.name));
    userModel = module.get(getModelToken(User.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  describe('create', () => {
    const createDto = { eventId: MOCK_EVENT_ID };

    it('should successfully create a reservation and increment event bookings', async () => {
      
      const event = createMockEvent();
      const reservation = createMockReservation();

      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(event),
      });

      mockReservationModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      mockReservationModel.create.mockResolvedValue(reservation);

  
      const result = await service.create(createDto, MOCK_USER_ID);

      
      expect(mockEventModel.findById).toHaveBeenCalledTimes(1);
      expect(mockEventModel.findById).toHaveBeenCalledWith(MOCK_EVENT_ID);

      expect(mockReservationModel.findOne).toHaveBeenCalledTimes(1);
      expect(mockReservationModel.findOne).toHaveBeenCalledWith({
        eventId: MOCK_EVENT_ID,
        participantId: MOCK_USER_ID,
        status: {
          $in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
        },
      });

      expect(mockReservationModel.create).toHaveBeenCalledTimes(1);
      expect(mockReservationModel.create).toHaveBeenCalledWith({
        eventId: MOCK_EVENT_ID,
        participantId: MOCK_USER_ID,
        reservedAt: expect.any(Date),
      });

      expect(event.currentBookings).toBe(6);
      expect(event.save).toHaveBeenCalledTimes(1);

   
      expect(result).toEqual(reservation);
    });

    it('should throw NotFoundException if event not found', async () => {
     
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

    
      await expect(
        service.create(createDto, MOCK_USER_ID),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.create(createDto, MOCK_USER_ID),
      ).rejects.toThrow('event not found');

    
      expect(mockReservationModel.create).not.toHaveBeenCalled();
      expect(mockEventModel.findById).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException if event is not published', async () => {
   
      const draftEvent = createMockEvent({ status: EventStatus.DRAFT });

      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(draftEvent),
      });

   
      await expect(
        service.create(createDto, MOCK_USER_ID),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create(createDto, MOCK_USER_ID),
      ).rejects.toThrow('Can only reserve published events');

      expect(mockReservationModel.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if event is fully booked', async () => {
     
      const fullEvent = createMockEvent({
        currentBookings: 10,
        maxCapacity: 10,
      });

      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(fullEvent),
      });

     
      await expect(
        service.create(createDto, MOCK_USER_ID),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create(createDto, MOCK_USER_ID),
      ).rejects.toThrow('Event is fully booked');

      expect(mockReservationModel.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if user already has an active reservation', async () => {
     
      const event = createMockEvent();
      const existingReservation = createMockReservation();

      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(event),
      });

      mockReservationModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingReservation),
      });

      await expect(
        service.create(createDto, MOCK_USER_ID),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.create(createDto, MOCK_USER_ID),
      ).rejects.toThrow('You already have a reservation for this event');

      expect(mockReservationModel.create).not.toHaveBeenCalled();
    });
  });

 
  describe('findAll', () => {
    it('should return all reservations without filter', async () => {
     
      const mockReservations = [
        createMockReservation(),
        createMockReservation({ _id: '507f1f77bcf86cd799439014' }),
      ];

      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockReservations),
      };

      mockReservationModel.find.mockReturnValue(mockChain);

    
      const result = await service.findAll({});

      
      expect(mockReservationModel.find).toHaveBeenCalledTimes(1);
      expect(mockReservationModel.find).toHaveBeenCalledWith({});
      expect(mockChain.populate).toHaveBeenCalledTimes(2);
      expect(mockChain.sort).toHaveBeenCalledWith({ reservedAt: -1 });
      expect(result).toEqual(mockReservations);
      expect(result).toHaveLength(2);
    });

    it('should return filtered reservations by eventId', async () => {
      // ARRANGE
      const filter = { eventId: MOCK_EVENT_ID };
      const mockReservations = [createMockReservation()];

      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockReservations),
      };

      mockReservationModel.find.mockReturnValue(mockChain);

     
      const result = await service.findAll(filter);

   
      expect(mockReservationModel.find).toHaveBeenCalledWith({
        eventId: MOCK_EVENT_ID,
      });
      expect(result).toEqual(mockReservations);
    });

    it('should return filtered reservations by participantId and status', async () => {
   
      const filter = {
        participantId: MOCK_USER_ID,
        status: ReservationStatus.CONFIRMED,
      };
      const mockReservations = [
        createMockReservation({ status: ReservationStatus.CONFIRMED }),
      ];

      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockReservations),
      };

      mockReservationModel.find.mockReturnValue(mockChain);

     
      const result = await service.findAll(filter);

      expect(mockReservationModel.find).toHaveBeenCalledWith({
        participantId: MOCK_USER_ID,
        status: ReservationStatus.CONFIRMED,
      });
      expect(result).toEqual(mockReservations);
    });
  });


  describe('findById', () => {
    it('should return a reservation by id', async () => {
      // ARRANGE
      const mockReservation = createMockReservation();

      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockReservation),
      };

      mockReservationModel.findById.mockReturnValue(mockChain);

      // ACT
      const result = await service.findById(MOCK_RESERVATION_ID);

      // ASSERT
      expect(mockReservationModel.findById).toHaveBeenCalledTimes(1);
      expect(mockReservationModel.findById).toHaveBeenCalledWith(
        MOCK_RESERVATION_ID,
      );
      expect(mockChain.populate).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockReservation);
    });

    it('should return null if reservation not found', async () => {
      // ARRANGE
      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };

      mockReservationModel.findById.mockReturnValue(mockChain);

      // ACT
      const result = await service.findById('invalidId');

      // ASSERT
      expect(result).toBeNull();
    });
  });

 
  describe('cancelMaReservation', () => {
    it('should successfully cancel the user own reservation', async () => {
      // ARRANGE
      const reservation = createMockReservation({
        status: ReservationStatus.PENDING,
      });

      mockReservationModel.findById.mockResolvedValue(reservation);
      mockEventModel.findByIdAndUpdate.mockResolvedValue({});

      // ACT
      const result = await service.cancelMaReservation(
        MOCK_USER_ID,
        MOCK_RESERVATION_ID,
      );

      // ASSERT
      expect(mockReservationModel.findById).toHaveBeenCalledTimes(1);
      expect(mockReservationModel.findById).toHaveBeenCalledWith(
        MOCK_RESERVATION_ID,
      );

    
      expect(reservation.status).toBe(ReservationStatus.CANCELED);

    
      expect(reservation.canceledAt).toBeInstanceOf(Date);

      expect(reservation.save).toHaveBeenCalledTimes(1);

   
      expect(mockEventModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
      expect(mockEventModel.findByIdAndUpdate).toHaveBeenCalledWith(
        MOCK_EVENT_ID,
        { $inc: { currentBookings: -1 } },
        { new: true },
      );

      expect(result).toEqual(reservation);
    });

    it('should throw NotFoundException if reservation not found', async () => {
      // ARRANGE
      mockReservationModel.findById.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(
        service.cancelMaReservation(MOCK_USER_ID, MOCK_RESERVATION_ID),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.cancelMaReservation(MOCK_USER_ID, MOCK_RESERVATION_ID),
      ).rejects.toThrow('reservation not found');

      expect(mockEventModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user tries to cancel someone else reservation', async () => {
      // ARRANGE
      const otherUserId = '507f1f77bcf86cd799439099';
      const reservation = createMockReservation({
        participantId: new Types.ObjectId(otherUserId),
      });

      mockReservationModel.findById.mockResolvedValue(reservation);

      // ACT & ASSERT
      await expect(
        service.cancelMaReservation(MOCK_USER_ID, MOCK_RESERVATION_ID),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.cancelMaReservation(MOCK_USER_ID, MOCK_RESERVATION_ID),
      ).rejects.toThrow('You can only cancel your own reservations');

      expect(reservation.save).not.toHaveBeenCalled();
      expect(mockEventModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if reservation is already canceled', async () => {
      // ARRANGE
      const reservation = createMockReservation({
        status: ReservationStatus.CANCELED,
      });

      mockReservationModel.findById.mockResolvedValue(reservation);

      // ACT & ASSERT
      await expect(
        service.cancelMaReservation(MOCK_USER_ID, MOCK_RESERVATION_ID),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.cancelMaReservation(MOCK_USER_ID, MOCK_RESERVATION_ID),
      ).rejects.toThrow('Reservation is already canceled');

      expect(reservation.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if reservation is refused', async () => {
      // ARRANGE
      const reservation = createMockReservation({
        status: ReservationStatus.REFUSED,
      });

      mockReservationModel.findById.mockResolvedValue(reservation);

      // ACT & ASSERT
      await expect(
        service.cancelMaReservation(MOCK_USER_ID, MOCK_RESERVATION_ID),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.cancelMaReservation(MOCK_USER_ID, MOCK_RESERVATION_ID),
      ).rejects.toThrow('Cannot cancel a refused reservation');

      expect(reservation.save).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should allow admin to CONFIRM a PENDING reservation', async () => {
      // ARRANGE
      const reservation = createMockReservation({
        status: ReservationStatus.PENDING,
      });

      mockReservationModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(reservation),
      });

      // ACT
      const result = await service.updateStatus(MOCK_RESERVATION_ID, {
        status: ReservationStatus.CONFIRMED,
      });

      // ASSERT
      expect(mockReservationModel.findById).toHaveBeenCalledTimes(1);
      expect(reservation.status).toBe(ReservationStatus.CONFIRMED);

      // ✅ Vérifier que confirmedAt est défini
      expect(reservation.confirmedAt).toBeInstanceOf(Date);

      expect(reservation.save).toHaveBeenCalledTimes(1);

      // ✅ Pas de décrémentation pour PENDING → CONFIRMED
      expect(mockEventModel.findByIdAndUpdate).not.toHaveBeenCalled();

      expect(result).toEqual(reservation);
    });

    it('should decrement bookings when transitioning from PENDING to REFUSED', async () => {
      // ARRANGE
      const reservation = createMockReservation({
        status: ReservationStatus.PENDING,
      });

      mockReservationModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(reservation),
      });

      mockEventModel.findByIdAndUpdate.mockResolvedValue({});

      // ACT
      await service.updateStatus(MOCK_RESERVATION_ID, {
        status: ReservationStatus.REFUSED,
      });

      // ASSERT
      expect(reservation.status).toBe(ReservationStatus.REFUSED);
      expect(mockEventModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
      expect(mockEventModel.findByIdAndUpdate).toHaveBeenCalledWith(
        MOCK_EVENT_ID,
        { $inc: { currentBookings: -1 } },
        { new: true },
      );
      expect(reservation.save).toHaveBeenCalledTimes(1);
    });

    it('should decrement bookings when transitioning from CONFIRMED to CANCELED', async () => {
      // ARRANGE
      const reservation = createMockReservation({
        status: ReservationStatus.CONFIRMED,
      });

      mockReservationModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(reservation),
      });

      mockEventModel.findByIdAndUpdate.mockResolvedValue({});

      // ACT
      await service.updateStatus(MOCK_RESERVATION_ID, {
        status: ReservationStatus.CANCELED,
      });

      // ASSERT
      expect(reservation.status).toBe(ReservationStatus.CANCELED);

      // ✅ Vérifier que canceledAt est défini
      expect(reservation.canceledAt).toBeInstanceOf(Date);

      expect(mockEventModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
      expect(reservation.save).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if reservation not found', async () => {
      // ARRANGE
      mockReservationModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      // ACT & ASSERT
      await expect(
        service.updateStatus(MOCK_RESERVATION_ID, {
          status: ReservationStatus.CONFIRMED,
        }),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.updateStatus(MOCK_RESERVATION_ID, {
          status: ReservationStatus.CONFIRMED,
        }),
      ).rejects.toThrow('Reservation not found');
    });

    it('should throw BadRequestException if status is already the same', async () => {
      // ARRANGE
      const reservation = createMockReservation({
        status: ReservationStatus.CONFIRMED,
      });

      mockReservationModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(reservation),
      });

      // ACT & ASSERT
      await expect(
        service.updateStatus(MOCK_RESERVATION_ID, {
          status: ReservationStatus.CONFIRMED,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.updateStatus(MOCK_RESERVATION_ID, {
          status: ReservationStatus.CONFIRMED,
        }),
      ).rejects.toThrow('Reservation is already CONFIRMED');

      expect(reservation.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if transition is not allowed', async () => {
      // ARRANGE
      const reservation = createMockReservation({
        status: ReservationStatus.REFUSED,
      });

      mockReservationModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(reservation),
      });

      // ACT & ASSERT
      await expect(
        service.updateStatus(MOCK_RESERVATION_ID, {
          status: ReservationStatus.CONFIRMED,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.updateStatus(MOCK_RESERVATION_ID, {
          status: ReservationStatus.CONFIRMED,
        }),
      ).rejects.toThrow('Cannot change status from REFUSED to CONFIRMED');

      expect(reservation.save).not.toHaveBeenCalled();
    });
  });


  describe('findMyReservations', () => {
    it('should return sorted reservations for the user without status filter', async () => {
      // ARRANGE
      const mockReservations = [
        createMockReservation(),
        createMockReservation({ _id: '507f1f77bcf86cd799439014' }),
      ];

      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockReservations),
      };

      mockReservationModel.find.mockReturnValue(mockChain);

      // ACT
      const result = await service.findMyReservations(MOCK_USER_ID);

      // ASSERT
      expect(mockReservationModel.find).toHaveBeenCalledTimes(1);
      expect(mockReservationModel.find).toHaveBeenCalledWith({
        participantId: MOCK_USER_ID,
      });
      expect(mockChain.sort).toHaveBeenCalledWith({ reservedAt: -1 });
      expect(result).toEqual(mockReservations);
      expect(result).toHaveLength(2);
    });

    it('should return reservations filtered by status', async () => {
      // ARRANGE
      const status = ReservationStatus.CONFIRMED;
      const mockReservations = [
        createMockReservation({ status: ReservationStatus.CONFIRMED }),
      ];

      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockReservations),
      };

      mockReservationModel.find.mockReturnValue(mockChain);

      // ACT
      const result = await service.findMyReservations(MOCK_USER_ID, status);

      // ASSERT
      expect(mockReservationModel.find).toHaveBeenCalledWith({
        participantId: MOCK_USER_ID,
        status: ReservationStatus.CONFIRMED,
      });
      expect(result).toEqual(mockReservations);
    });

    it('should return empty array if no reservations found', async () => {
      // ARRANGE
      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      mockReservationModel.find.mockReturnValue(mockChain);

      // ACT
      const result = await service.findMyReservations(MOCK_USER_ID);

      // ASSERT
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });
});