import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from 'src/events/events.service';
import { getModelToken } from '@nestjs/mongoose';
import { Event } from 'src/events/schemas/event.schema';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EventStatus } from 'src/common/enums';

describe('EventsService', () => {
    let service: EventsService;
    let model: any;

    const mockEventId = '64f1a2b3c4d5e6f7a8b9c0d1';

   const mockEvent = {
    _id: mockEventId,
    title: 'Test Event',
    description: 'Test Description',
    dateTime: new Date('2026-12-31'),
    location: 'Test Location',
    maxCapacity: 100,
    currentBookings: 100,
    status: EventStatus.DRAFT,
    isDeleted: false,
     save: jest.fn(),
   
  };

    const mockEventModel = {
        create: jest.fn(),
        findById: jest.fn(),
        find: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EventsService,
                {
                    provide: getModelToken(Event.name),
                    useValue: mockEventModel,
                },
            ],
        }).compile();

        service = module.get<EventsService>(EventsService);
        model = module.get(getModelToken(Event.name));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
    it('devrait créer un événement avec succès', async () => {
      const createEventDto = {
        title: 'Test Event',
        description: 'Test Description',
        dateTime: new Date('2026-12-31'),
        location: 'Test Location',
        maxCapacity: 100,
      };

      mockEventModel.create.mockResolvedValue(mockEvent);

      const result = await service.create(createEventDto);

      expect(mockEventModel.create).toHaveBeenCalledWith(createEventDto);
      expect(result).toEqual(mockEvent);
    });
  });

  describe("update event",()=>{
    it("devrait  modifier  un événement avec succès",async()=>{
         const updateEventDto = {
        title: 'Test Event',
    description: 'Test Description',
    dateTime: new Date('2026-12-31'),
    location: 'Test Location',
      };
      mockEventModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockEvent),
    });
    mockEvent.save.mockResolvedValue({...mockEvent,updateEventDto});
    const result=await service.update(mockEventId,updateEventDto);
     expect(mockEventModel.findById).toHaveBeenCalledWith(mockEventId);

    
    expect(mockEvent.save).toHaveBeenCalled();

   
    expect(result.title).toBe(updateEventDto.title);
    expect(result.description).toBe(updateEventDto.description);
    expect(result.location).toBe(updateEventDto.location);
    
      
    })
    it(" devrait lever NotFoundException si l’événement n’existe pas ",async()=>{
        mockEventModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(service.update(mockEventId, {})).rejects.toThrow(NotFoundException);

    })
     it(" devrait lever BadRequestException si l’événement est annulé ",async()=>{
        const cancelEvent={...mockEvent,status: EventStatus.CANCELED};
         mockEventModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(cancelEvent),
    });
        await  expect(service.update(mockEventId,{})).rejects.toThrow(BadRequestException);
     })
   
  it('devrait lever BadRequestException si maxCapacity < currentBookings', async () => {
    const event = { ...mockEvent, currentBookings: 50, maxCapacity: 100 };
    mockEventModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(event),
    });

    await expect(
      service.update(mockEventId, { maxCapacity: 20 })
    ).rejects.toThrow(BadRequestException);
  });
  })
   describe("update status event",()=>{
     it("devrait modifier le status de evenement",async()=>{
        const newStatus=EventStatus.PUBLISHED;
     mockEventModel.findById.mockReturnValue({exec:jest.fn().mockResolvedValue(mockEvent)});
      mockEvent.save.mockResolvedValue({...mockEvent,status:newStatus});
      const result= await service.updateStatus(mockEventId,newStatus);
       
      expect(mockEventModel.findById).toHaveBeenCalledWith(mockEventId);
    expect(mockEvent.save).toHaveBeenCalled();
    expect(result.status).toBe(EventStatus.PUBLISHED);

  


     })
      it("devrait lever NotFoundException si l’événement n’existe pas",async()=>{
        mockEventModel.findById.mockReturnValue({exec:jest.fn().mockResolvedValue(null)});
        expect(service.updateStatus(mockEventId,EventStatus.PUBLISHED)).rejects.toThrow(NotFoundException);
      })
       it('devrait lever BadRequestException si on tente de changer le status d’un publish a draft ',async()=>{
          const publishedEvent = { ...mockEvent, status: EventStatus.PUBLISHED };
    mockEventModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(publishedEvent),
    });
     await expect(service.updateStatus(mockEventId, EventStatus.DRAFT))
      .rejects
      .toThrow(BadRequestException);
       })
        it('devrait lever BadRequestException si on tente de changer le status d’un CANCELED', async () => {
    const canceledEvent = { ...mockEvent, status: EventStatus.CANCELED };
    mockEventModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(canceledEvent),
    });

    await expect(service.updateStatus(mockEventId, EventStatus.PUBLISHED))
      .rejects
      .toThrow(BadRequestException);
  });
   it('devrait lever BadRequestException pour une transition invalide DRAFT → DRAFT', async () => {
    const draftEvent = { ...mockEvent, status: EventStatus.DRAFT };
    mockEventModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(draftEvent),
    });

    await expect(service.updateStatus(mockEventId, 'INVALID_STATUS' as any))
      .rejects
      .toThrow(BadRequestException);
  });

     

   })
   describe("delete event", () => {
  const mockEvent = {
    _id: mockEventId,
    title: "Test Event",
    isDeleted: false,
  };

  it("devrait soft delete un événement existant", async () => {
  
    mockEventModel.findByIdAndUpdate.mockResolvedValue({ ...mockEvent, isDeleted: true });

    const result = await service.delete(mockEventId);

    expect(mockEventModel.findByIdAndUpdate).toHaveBeenCalledWith(
      mockEventId,
      { isDeleted: true },
      { new: true }
    );

    expect(result.isDeleted).toBe(true);
  });

  it("devrait lever NotFoundException si l'événement n'existe pas", async () => {
   
    mockEventModel.findByIdAndUpdate.mockResolvedValue(null);

    await expect(service.delete(mockEventId))
      .rejects
      .toThrow(NotFoundException);

    expect(mockEventModel.findByIdAndUpdate).toHaveBeenCalledWith(
      mockEventId,
      { isDeleted: true },
      { new: true }
    );
  });
});
 describe("details events", () => {
  it("devrait afficher l'événement par son id", async () => {
    // Mock findById().exec() pour retourner mockEvent
    mockEventModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockEvent),
    });

    const result = await service.findById(mockEventId);

    // Vérifie que findById a été appelé avec le bon id
    expect(mockEventModel.findById).toHaveBeenCalledWith(mockEventId);

    // Vérifie que le résultat est bien l'événement mocké
    expect(result).toEqual(mockEvent);
  });

  it("devrait retourner null si l'événement n'existe pas", async () => {
    mockEventModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    const result = await service.findById("unknownId");

    expect(mockEventModel.findById).toHaveBeenCalledWith("unknownId");
    expect(result).toBeNull();
  });
});
 describe('getAllEvents', () => {
    it('devrait retourner tous les événements non supprimés', async () => {
      const mockEvents = [mockEvent];
      mockEventModel.find.mockResolvedValue(mockEvents);

      const result = await service.getAllEvents();

      expect(mockEventModel.find).toHaveBeenCalledWith({ isDeleted: false });
      expect(result).toEqual(mockEvents);
    });
  });

  describe('getPublishEvents', () => {
    it('devrait retourner uniquement les événements publiés', async () => {
      const publishedEvent = { ...mockEvent, status: EventStatus.PUBLISHED };
      mockEventModel.find.mockResolvedValue([publishedEvent]);

      const result = await service.getPublishEvents();

      expect(mockEventModel.find).toHaveBeenCalledWith({
        status: EventStatus.PUBLISHED,
      });
      expect(result).toEqual([publishedEvent]);
    });
  });

})
