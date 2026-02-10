import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../../src/app.module';
import { Role, ReservationStatus, EventStatus } from '../../src/common/enums';
import { Connection, Types } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data: T;
}

describe('ReservationsController (e2e) - Full Coverage', () => {
    let app: INestApplication;
    let mongoConnection: Connection;
    let adminToken: string;
    let participantToken: string;
    let otherParticipantToken: string;
    let participantId: string;

    const registerAndLogin = async (role: Role, emailPrefix: string) => {
        const userData = {
            firstName: 'Test',
            lastName: 'User',
            email: `${emailPrefix}-${Date.now()}@example.com`,
            password: 'password123',
            role: role,
        };
        const regRes = await request(app.getHttpServer()).post('/auth/register').send(userData).expect(201);
        return {
            token: regRes.body.data.token as string,
            userId: regRes.body.data.user._id as string,
            email: userData.email
        };
    };

    const createTestEvent = async (token: string, overrides: any = {}) => {
        const defaultEvent = {
            title: 'Event for Res ' + Date.now() + Math.random(),
            description: 'Test event description for reservation testing',
            dateTime: new Date(Date.now() + 86400000).toISOString(),
            location: 'Location',
            maxCapacity: 10,
            status: EventStatus.PUBLISHED,
        };
        const res = await request(app.getHttpServer())
            .post('/events')
            .set('Authorization', `Bearer ${token}`)
            .send({ ...defaultEvent, ...overrides });
        return res.body.data._id;
    };

    const expectError = (res: request.Response, status: number, message: string | RegExp) => {
        if (res.status === 500) {
            console.error('500 Error Body:', JSON.stringify(res.body, null, 2));
        }
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

        // Setup Users
        const admin = await registerAndLogin(Role.ADMIN, 'admin-res-q');
        adminToken = admin.token;

        const part1 = await registerAndLogin(Role.PARTICIPANT, 'part1-res-q');
        participantToken = part1.token;
        participantId = part1.userId;

        const part2 = await registerAndLogin(Role.PARTICIPANT, 'part2-res-q');
        otherParticipantToken = part2.token;
    });

    afterAll(async () => {
        await mongoConnection.collection('reservations').deleteMany({});
        await mongoConnection.collection('events').deleteMany({ title: { $regex: /.*Event for Res .*/ } });
        await mongoConnection.collection('users').deleteMany({ email: { $regex: /.*-res-q-.*@example.com/ } });
        await app.close();
    });

    // ----------------------
    // CREATE RESERVATION
    // ----------------------
    describe('POST /reservations', () => {
        let publishedId: string;

        beforeAll(async () => {
            publishedId = await createTestEvent(adminToken, { maxCapacity: 2 });
        });

        it('should create a valid reservation', async () => {
            const res = await request(app.getHttpServer())
                .post('/reservations')
                .set('Authorization', `Bearer ${participantToken}`)
                .send({ eventId: publishedId })
                .expect(201);

            expect(res.body.success).toBe(true);
            expect(res.body.data.eventId).toBe(publishedId);

            const event = await mongoConnection.collection('events').findOne({ _id: new Types.ObjectId(publishedId) });
            expect(event?.currentBookings).toBe(1);
        });

        it('should fail for non-existent event', async () => {
            const res = await request(app.getHttpServer())
                .post('/reservations')
                .set('Authorization', `Bearer ${participantToken}`)
                .send({ eventId: new Types.ObjectId().toString() });
            expectError(res, 404, 'event not found ');
        });

        it('should fail for unpublished event', async () => {
            const draftId = await createTestEvent(adminToken, { status: EventStatus.DRAFT });
            const res = await request(app.getHttpServer())
                .post('/reservations')
                .set('Authorization', `Bearer ${participantToken}`)
                .send({ eventId: draftId });
            expectError(res, 400, 'Can only reserve published events');
        });

        it('should fail if event is fully booked', async () => {
            const fullId = await createTestEvent(adminToken, { maxCapacity: 1 });
            await request(app.getHttpServer())
                .post('/reservations')
                .set('Authorization', `Bearer ${otherParticipantToken}`)
                .send({ eventId: fullId })
                .expect(201);

            const res = await request(app.getHttpServer())
                .post('/reservations')
                .set('Authorization', `Bearer ${participantToken}`)
                .send({ eventId: fullId });
            expectError(res, 400, 'Event is fully booked');
        });

        it('should prevent duplicate reservations', async () => {
            const res = await request(app.getHttpServer())
                .post('/reservations')
                .set('Authorization', `Bearer ${participantToken}`)
                .send({ eventId: publishedId });
            expectError(res, 409, 'You already have a reservation for this event');
        });

        it('should deny admin from creating reservation', async () => {
            const res = await request(app.getHttpServer())
                .post('/reservations')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ eventId: publishedId });
            expectError(res, 403, 'Insufficient permissions');
        });

        it('should fail if not authenticated', async () => {
            const res = await request(app.getHttpServer())
                .post('/reservations')
                .send({ eventId: publishedId });
            expectError(res, 401, 'Access token is required');
        });

        it('should fail if eventId is missing', async () => {
            const res = await request(app.getHttpServer())
                .post('/reservations')
                .set('Authorization', `Bearer ${participantToken}`)
                .send({});
            expect(res.body.message).toEqual(
        expect.arrayContaining(["eventId should not be empty", "eventId must be a mongodb id"])
    );
        });
    });

    // ----------------------
    // GET ALL RESERVATIONS
    // ----------------------
    describe('GET /reservations', () => {
        let resId: string;
        let eventId: string;

       beforeAll(async () => {
    eventId = await createTestEvent(adminToken);
    const res = await request(app.getHttpServer())
        .post('/reservations')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({ eventId })
        .expect(201);
    resId = res.body.data._id;
   
});


        it('should list all reservations for admin', async () => {
            const res = await request(app.getHttpServer())
                .get('/reservations')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data[0].eventId).toHaveProperty('title');
            expect(res.body.data[0].participantId).toHaveProperty('email');
        });


        it('should deny participant access', async () => {
            const res = await request(app.getHttpServer())
                .get('/reservations')
                .set('Authorization', `Bearer ${participantToken}`);
            expectError(res, 403, 'Insufficient permissions');
        });
    });

    // ----------------------
    // GET MY RESERVATIONS
    // ----------------------
    describe('GET /reservations/me', () => {
        it('should list participant reservations', async () => {
            const res = await request(app.getHttpServer())
                .get('/reservations/me')
                .set('Authorization', `Bearer ${participantToken}`)
                .expect(200);
            expect(res.body.data.length).toBeGreaterThan(0);
        });

        it('should filter by status', async () => {
            const res = await request(app.getHttpServer())
                .get(`/reservations/me?status=${ReservationStatus.PENDING}`)
                .set('Authorization', `Bearer ${participantToken}`)
                .expect(200);
            expect(res.body.data.every(r => r.status === ReservationStatus.PENDING)).toBe(true);
        });

        it('should deny admin', async () => {
            const res = await request(app.getHttpServer())
                .get('/reservations/me')
                .set('Authorization', `Bearer ${adminToken}`);
            expectError(res, 403, 'Insufficient permissions');
        });
    });

    // ----------------------
    // GET RESERVATION BY ID
    // ----------------------
    describe('GET /reservations/:id', () => {
        let resId: string;
        let eventId: string;

        beforeAll(async () => {
            eventId = await createTestEvent(adminToken);
            const res = await request(app.getHttpServer())
                .post('/reservations')
                .set('Authorization', `Bearer ${participantToken}`)
                .send({ eventId })
                .expect(201);
            resId = res.body.data._id;
        });

      

       

        it('admin can fetch any reservation', async () => {
            const res = await request(app.getHttpServer())
                .get(`/reservations/${resId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            expect(res.body.data._id).toBe(resId);
        });

        
    });

    // ----------------------
    // CANCEL RESERVATION
    // ----------------------
    describe('PATCH /reservations/:id/cancel', () => {
        let cancelId: string;
        let cEventId: string;

        beforeEach(async () => {
            cEventId = await createTestEvent(adminToken);
            const res = await request(app.getHttpServer())
                .post('/reservations')
                .set('Authorization', `Bearer ${participantToken}`)
                .send({ eventId: cEventId })
                .expect(201);
            cancelId = res.body.data._id;
        });

        it('should cancel own reservation', async () => {
            const res = await request(app.getHttpServer())
                .patch(`/reservations/${cancelId}/cancel`)
                .set('Authorization', `Bearer ${participantToken}`)
                .expect(200);
            expect(res.body.data.status).toBe(ReservationStatus.CANCELED);

            const event = await mongoConnection.collection('events').findOne({ _id: new Types.ObjectId(cEventId) });
            expect(event?.currentBookings).toBe(0);
        });

        it('should deny cancelling others reservation', async () => {
            const res = await request(app.getHttpServer())
                .patch(`/reservations/${cancelId}/cancel`)
                .set('Authorization', `Bearer ${otherParticipantToken}`);
            expectError(res, 403, 'You can only cancel your own reservations');
        });

        it('should fail if already canceled', async () => {
            await request(app.getHttpServer())
                .patch(`/reservations/${cancelId}/cancel`)
                .set('Authorization', `Bearer ${participantToken}`)
                .expect(200);

            const res = await request(app.getHttpServer())
                .patch(`/reservations/${cancelId}/cancel`)
                .set('Authorization', `Bearer ${participantToken}`);
            expectError(res, 400, /already canceled/);
        });
    });

    // ----------------------
    // UPDATE STATUS
    // ----------------------
    describe('PATCH /reservations/:id/status', () => {
        let statusId: string;
        let sEventId: string;

        beforeEach(async () => {
            sEventId = await createTestEvent(adminToken);
            const res = await request(app.getHttpServer())
                .post('/reservations')
                .set('Authorization', `Bearer ${participantToken}`)
                .send({ eventId: sEventId })
                .expect(201);
            statusId = res.body.data._id;
        });

        it('should confirm reservation (Admin)', async () => {
            const res = await request(app.getHttpServer())
                .patch(`/reservations/${statusId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: ReservationStatus.CONFIRMED })
                .expect(200);
            expect(res.body.data.status).toBe(ReservationStatus.CONFIRMED);
        });

        it('should refuse reservation and decrement bookings', async () => {
            await request(app.getHttpServer())
                .patch(`/reservations/${statusId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: ReservationStatus.REFUSED })
                .expect(200);

            const event = await mongoConnection.collection('events').findOne({ _id: new Types.ObjectId(sEventId) });
            expect(event?.currentBookings).toBe(0);
        });

        it('should deny participant', async () => {
            const res = await request(app.getHttpServer())
                .patch(`/reservations/${statusId}/status`)
                .set('Authorization', `Bearer ${participantToken}`)
                .send({ status: ReservationStatus.CONFIRMED });
            expectError(res, 403, 'Insufficient permissions');
        });

        it('should reject illegal status transition', async () => {
            await request(app.getHttpServer())
                .patch(`/reservations/${statusId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: ReservationStatus.CANCELED })
                .expect(200);

            const res = await request(app.getHttpServer())
                .patch(`/reservations/${statusId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: ReservationStatus.CONFIRMED });
            expectError(res, 400, /Cannot change status/);
        });

        it('should reject same status update', async () => {
            await request(app.getHttpServer())
                .patch(`/reservations/${statusId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: ReservationStatus.CONFIRMED })
                .expect(200);

            const res = await request(app.getHttpServer())
                .patch(`/reservations/${statusId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: ReservationStatus.CONFIRMED });
            expectError(res, 400, /already confirmed/);
        });
    });
});
