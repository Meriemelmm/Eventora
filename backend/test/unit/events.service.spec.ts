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
    it('should create an event successfully', async () => {
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
    it("should update an event successfullys",async()=>{
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
    it(" should throw NotFoundException if event does not exists ",async()=>{
        mockEventModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(service.update(mockEventId, {})).rejects.toThrow(NotFoundException);

    })
     it(" should throw BadRequestException if event is canceled ",async()=>{
        const cancelEvent={...mockEvent,status: EventStatus.CANCELED};
         mockEventModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(cancelEvent),
    });
        await  expect(service.update(mockEventId,{})).rejects.toThrow(BadRequestException);
           await expect(
        service.update(mockEventId, { title: 'New Title' }),
      ).rejects.toThrow('Cannot update a cancelled event');
     })
   
  it('should throw BadRequestException if maxCapacity is less than currentBookings', async () => {
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
     it("should update event status from DRAFT to PUBLISHED",async()=>{
        const newStatus=EventStatus.PUBLISHED;
     mockEventModel.findById.mockReturnValue({exec:jest.fn().mockResolvedValue(mockEvent)});
      mockEvent.save.mockResolvedValue({...mockEvent,status:newStatus});
      const result= await service.updateStatus(mockEventId,newStatus);
       
      expect(mockEventModel.findById).toHaveBeenCalledWith(mockEventId);
    expect(mockEvent.save).toHaveBeenCalled();
    expect(result.status).toBe(EventStatus.PUBLISHED);

  


     })
      it("should throw NotFoundException if event does not exist",async()=>{
        mockEventModel.findById.mockReturnValue({exec:jest.fn().mockResolvedValue(null)});
        expect(service.updateStatus(mockEventId,EventStatus.PUBLISHED)).rejects.toThrow(NotFoundException);
      })
       it('should throw BadRequestException when transitioning from PUBLISHED to DRAFT ',async()=>{
          const publishedEvent = { ...mockEvent, status: EventStatus.PUBLISHED };
    mockEventModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(publishedEvent),
    });
     await expect(service.updateStatus(mockEventId, EventStatus.DRAFT))
      .rejects
      .toThrow(BadRequestException);
       })
        it('should throw BadRequestException when changing status of a canceled event', async () => {
    const canceledEvent = { ...mockEvent, status: EventStatus.CANCELED };
    mockEventModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(canceledEvent),
    });

    await expect(service.updateStatus(mockEventId, EventStatus.PUBLISHED))
      .rejects
      .toThrow(BadRequestException);
  });
   it('should throw BadRequestException for invalid transition from DRAFT', async () => {
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

  it("should soft delete an existing event", async () => {
  
    mockEventModel.findByIdAndUpdate.mockResolvedValue({ ...mockEvent, isDeleted: true });

    const result = await service.delete(mockEventId);

    expect(mockEventModel.findByIdAndUpdate).toHaveBeenCalledWith(
      mockEventId,
      { isDeleted: true },
      { new: true }
    );

    expect(result.isDeleted).toBe(true);
  });

  it("should throw NotFoundException if event does not exist", async () => {
   
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
  it("should return an event by its id", async () => {
  
    mockEventModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockEvent),
    });

    const result = await service.findById(mockEventId);

    
    expect(mockEventModel.findById).toHaveBeenCalledWith(mockEventId);

  
    expect(result).toEqual(mockEvent);
  });

  it("should return null if event does not exist", async () => {
    mockEventModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    const result = await service.findById("unknownId");

    expect(mockEventModel.findById).toHaveBeenCalledWith("unknownId");
    expect(result).toBeNull();
  });
});
 describe('getAllEvents', () => {
    it('should return all non-deleted events', async () => {
      const mockEvents = [mockEvent];
      mockEventModel.find.mockResolvedValue(mockEvents);

      const result = await service.getAllEvents();

      expect(mockEventModel.find).toHaveBeenCalledWith({ isDeleted: false });
      expect(result).toEqual(mockEvents);
    });
  });

  describe('getPublishEvents', () => {
    it('should return only published events', async () => {
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
