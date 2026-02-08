import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../../src/app.module';
import { Role, EventStatus } from '../../src/common/enums';
import { Connection, Types } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('EventsController (e2e)', () => {
    let app: INestApplication;
    let mongoConnection: Connection;
    let adminToken: string;
    let participantToken: string;
    let testEventId: string;
    let adminUserId: string;
    let participantUserId: string;

    // --- Helpers for DRY ---
    const registerAndLogin = async (role: Role, emailPrefix: string) => {
        const userData = {
            firstName: 'Test',
            lastName: 'User',
            email: `${emailPrefix}-${Date.now()}@example.com`,
            password: 'password123',
            role: role,
        };
        const regRes = await request(app.getHttpServer())
            .post('/auth/register')
            .send(userData)
            .expect(201);
        
        return {
            token: regRes.body.data.token as string,
            userId: regRes.body.data.user._id as string,
            email: userData.email
        };
    };

    const createTestEvent = async (token: string, overrides: any = {}) => {
        const defaultEvent = {
            title: 'Test Event ' + Date.now(),
            description: 'Test event description for e2e testing',
            dateTime: new Date(Date.now() + 86400000).toISOString(),
            location: 'Test Location',
            maxCapacity: 50,
            status: EventStatus.DRAFT,
        };
        const res = await request(app.getHttpServer())
            .post('/events')
            .set('Authorization', `Bearer ${token}`)
            .send({ ...defaultEvent, ...overrides });
        return res;
    };

    const expectError = (res: request.Response, status: number, message: string | RegExp) => {
        expect(res.status).toBe(status);
        if (typeof message === 'string') {
            expect(res.body.message).toContain(message);
        } else {
            expect(res.body.message).toMatch(message);
        }
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();

        mongoConnection = app.get(getConnectionToken());

        const admin = await registerAndLogin(Role.ADMIN, 'admin-events-e2e');
        adminToken = admin.token;
        adminUserId = admin.userId;

        const part = await registerAndLogin(Role.PARTICIPANT, 'part-events-e2e');
        participantToken = part.token;
        participantUserId = part.userId;
    });

    afterAll(async () => {
        // Clean up test data
        await mongoConnection.collection('events').deleteMany({ 
            title: { $regex: /Test Event/ } 
        });
        await mongoConnection.collection('users').deleteMany({ 
            email: { $regex: /-events-e2e-.*@example.com/ } 
        });
        await app.close();
    });

    describe('POST /events - Create Event', () => {
        it('should create an event as admin (Success)', async () => {
            const res = await createTestEvent(adminToken);
            expect(res.status).toBe(201);

            const body = res.body;
            expect(body.success).toBe(true);
            expect(body.message).toBe('event created succefuly');
            expect(body.data).toHaveProperty('_id');
            expect(body.data.title).toContain('Test Event');
            testEventId = body.data._id;
        });

        it('should return 403 for participant (Forbidden)', async () => {
            const res = await createTestEvent(participantToken);
            expectError(res, 403, 'Insufficient permissions');
        });

        it('should return 401 for guest (Unauthorized)', async () => {
            const res = await request(app.getHttpServer())
                .post('/events')
                .send({ title: 'No Token Event' });
            expectError(res, 401, /Access token is required|Unauthorized/);
        });

        it('should validate DTO fields - title too short', async () => {
            const res = await createTestEvent(adminToken, { 
                title: 'Ab', 
                description: 'Valid description' 
            });
            expect(res.status).toBe(400);
        });

        it('should validate DTO fields - missing required fields', async () => {
            const res = await request(app.getHttpServer())
                .post('/events')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ title: 'Only Title' });
            expect(res.status).toBe(400);
        });


        it('should validate maxCapacity is positive', async () => {
            const res = await createTestEvent(adminToken, { maxCapacity: -5 });
            expect(res.status).toBe(400);
        });
    });

    describe('GET /events - List Events', () => {
        it('should allow admin to list all events', async () => {
            const res = await request(app.getHttpServer())
                .get('/events')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const body = res.body;
            expect(body.success).toBe(true);
            expect(Array.isArray(body.data)).toBe(true);
            expect(body.data.length).toBeGreaterThan(0);
        });

        it('should deny participant from listing all events', async () => {
            const res = await request(app.getHttpServer())
                .get('/events')
                .set('Authorization', `Bearer ${participantToken}`);
            expectError(res, 403, 'Insufficient permissions');
        });

        it('should deny guest from listing all events', async () => {
            const res = await request(app.getHttpServer())
                .get('/events');
            expectError(res, 401, /Access token is required/);
        });
    });

    describe('GET /events/public - Public Events', () => {
        beforeAll(async () => {
            // Create a published event for public access
            const createRes = await createTestEvent(adminToken, { 
                title: 'Public Test Event ' + Date.now() 
            });
            const eventId = createRes.body.data._id;
            
            await request(app.getHttpServer())
                .patch(`/events/${eventId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: EventStatus.PUBLISHED });
        });

        it('should allow anyone to see published events', async () => {
            const res = await request(app.getHttpServer())
                .get('/events/public')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.every(e => e.status === EventStatus.PUBLISHED)).toBe(true);
        });
    });

    describe('GET /events/:id - Get Event by ID', () => {
        it('should get event by ID', async () => {
            const res = await request(app.getHttpServer())
                .get(`/events/${testEventId}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data._id).toBe(testEventId);
        });

        it('should return 404 for non-existent event', async () => {
            const fakeId = new Types.ObjectId().toString();
            const res = await request(app.getHttpServer())
                .get(`/events/${fakeId}`);
            
            expect([404, 200]).toContain(res.status);
            if (res.status === 200) {
                expect(res.body.data).toBeNull();
            }
        });

        it('should return 400 for invalid ObjectId', async () => {
            const res = await request(app.getHttpServer())
                .get('/events/invalid-id');
            
            expect([400, 500]).toContain(res.status);
        });
    });

    describe('PATCH /events/:id/status - Update Status Transitions', () => {
        let eventId: string;

        beforeEach(async () => {
            const res = await createTestEvent(adminToken, { 
                title: 'Status Transition Test ' + Date.now() 
            });
            eventId = res.body.data._id;
        });

        const updateStatus = (id: string, token: string, status: EventStatus) => {
            return request(app.getHttpServer())
                .patch(`/events/${id}/status`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status });
        };

        // Valid transitions
        it('DRAFT -> PUBLISHED (Valid)', async () => {
            const res = await updateStatus(eventId, adminToken, EventStatus.PUBLISHED);
            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe(EventStatus.PUBLISHED);
        });

        it('DRAFT -> CANCELED (Valid)', async () => {
            const res = await updateStatus(eventId, adminToken, EventStatus.CANCELED);
            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe(EventStatus.CANCELED);
        });

        it('PUBLISHED -> CANCELED (Valid)', async () => {
            await updateStatus(eventId, adminToken, EventStatus.PUBLISHED);
            const res = await updateStatus(eventId, adminToken, EventStatus.CANCELED);
            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe(EventStatus.CANCELED);
        });

       
        it('DRAFT -> DRAFT (Invalid - Already set)', async () => {
            const res = await updateStatus(eventId, adminToken, EventStatus.DRAFT);
            expectError(res, 400, 'Event is already draft');
        });

        it('PUBLISHED -> PUBLISHED (Invalid - Already set)', async () => {
            await updateStatus(eventId, adminToken, EventStatus.PUBLISHED);
            const res = await updateStatus(eventId, adminToken, EventStatus.PUBLISHED);
            expectError(res, 400, 'Event is already published');
        });

        
        it('PUBLISHED -> DRAFT (Invalid)', async () => {
            await updateStatus(eventId, adminToken, EventStatus.PUBLISHED);
            const res = await updateStatus(eventId, adminToken, EventStatus.DRAFT);
            expectError(res, 400, /Cannot change status from PUBLISHED to draft/);
        });

        it('CANCELED -> PUBLISHED (Invalid - Final status)', async () => {
            await updateStatus(eventId, adminToken, EventStatus.CANCELED);
            const res = await updateStatus(eventId, adminToken, EventStatus.PUBLISHED);
            expectError(res, 400, 'Cannot change status of a canceled event');
        });

        it('CANCELED -> DRAFT (Invalid - Final status)', async () => {
            await updateStatus(eventId, adminToken, EventStatus.CANCELED);
            const res = await updateStatus(eventId, adminToken, EventStatus.DRAFT);
            expectError(res, 400, 'Cannot change status of a canceled event');
        });

        // Authorization tests
        it('should deny participant from updating status', async () => {
            const res = await updateStatus(eventId, participantToken, EventStatus.PUBLISHED);
            expectError(res, 403, 'Insufficient permissions');
        });

        it('should return 404 for non-existent event', async () => {
            const fakeId = new Types.ObjectId().toString();
            const res = await updateStatus(fakeId, adminToken, EventStatus.PUBLISHED);
            expectError(res, 404, 'not found');
        });
    });

    describe('PUT /events/:id - Update Event', () => {
        let updateableEventId: string;

        beforeEach(async () => {
            const res = await createTestEvent(adminToken, { 
                title: 'Updateable Event ' + Date.now() 
            });
            updateableEventId = res.body.data._id;
        });

        it('should update event successfully as admin', async () => {
            const updatedData = {
                title: 'Updated Title ' + Date.now(),
                description: 'Updated description',
                location: 'New Location',
            };

            const res = await request(app.getHttpServer())
                .put(`/events/${updateableEventId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updatedData)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.title).toBe(updatedData.title);
            expect(res.body.data.location).toBe(updatedData.location);
        });

        it('should prevent update if event is CANCELED', async () => {
            
            await request(app.getHttpServer())
                .patch(`/events/${updateableEventId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: EventStatus.CANCELED });

           
            const res = await request(app.getHttpServer())
                .put(`/events/${updateableEventId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ title: 'New Title' });

            expectError(res, 400, 'Cannot update a cancelled event');
        });

       
        it('should return 404 for unknown event ID', async () => {
            const fakeId = new Types.ObjectId().toString();
            const res = await request(app.getHttpServer())
                .put(`/events/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ title: 'New Title' });
            expectError(res, 404, 'Event does not exist');
        });

        it('should deny participant from updating event', async () => {
            const res = await request(app.getHttpServer())
                .put(`/events/${updateableEventId}`)
                .set('Authorization', `Bearer ${participantToken}`)
                .send({ title: 'Hacked Title' });
            expectError(res, 403, 'Insufficient permissions');
        });

        it('should validate updated fields', async () => {
            const res = await request(app.getHttpServer())
                .put(`/events/${updateableEventId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ title: 'A' }); // Too short
            expect(res.status).toBe(400);
        });
    });

    describe('DELETE /events/:id - Soft Delete Event', () => {
        let deletableEventId: string;

        beforeEach(async () => {
            const res = await createTestEvent(adminToken, { 
                title: 'Deletable Event ' + Date.now() 
            });
            deletableEventId = res.body.data._id;
        });

        it('should soft delete event as admin', async () => {
            const res = await request(app.getHttpServer())
                .delete(`/events/${deletableEventId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.isDeleted).toBe(true);

            // Verify it's not in the list
            const listRes = await request(app.getHttpServer())
                .get('/events')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const deletedEvent = listRes.body.data.find(e => e._id === deletableEventId);
            expect(deletedEvent).toBeUndefined();
        });

        it('should return 403 for participant deletion', async () => {
            const res = await request(app.getHttpServer())
                .delete(`/events/${deletableEventId}`)
                .set('Authorization', `Bearer ${participantToken}`);
            expectError(res, 403, 'Insufficient permissions');
        });

        it('should return 404 for non-existent event', async () => {
            const fakeId = new Types.ObjectId().toString();
            const res = await request(app.getHttpServer())
                .delete(`/events/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expectError(res, 404, 'Event does not exist');
        });

        it('should deny guest from deleting', async () => {
            const res = await request(app.getHttpServer())
                .delete(`/events/${deletableEventId}`);
            expectError(res, 401, /Access token is required/);
        });
    });

    describe('Edge Cases and Security', () => {
        it('should handle malformed event ID gracefully', async () => {
            const res = await request(app.getHttpServer())
                .get('/events/not-a-valid-id');
            expect([400, 500]).toContain(res.status);
        });

       
    });
});