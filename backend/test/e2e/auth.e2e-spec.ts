import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../../src/app.module';
import { Role } from '../../src/common/enums';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import * as jwt from 'jsonwebtoken';

describe('AuthController (E2E) - Complete', () => {
  let app: INestApplication;
  let mongoConnection: Connection;

  const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
    role: Role.PARTICIPANT,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    mongoConnection = app.get(getConnectionToken());
  });

  afterAll(async () => {
    await mongoConnection.collection('users').deleteMany({
      email: { $regex: /test-.*@example.com/ },
    });
    await app.close();
  });

  // --- REGISTER ---
  describe('/auth/register (POST)', () => {
    it('should register a user successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Registration succeeded');
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.role).toBe(Role.PARTICIPANT);
      expect(res.body.data.user).not.toHaveProperty('password');
      expect(res.body.data.token).toBeDefined();
    });

    it('should fail for duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('should fail for invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...testUser, email: 'invalid-email' })
        .expect(400);
    });

    it('should default role to PARTICIPANT if not provided', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          firstName: 'NoRole',
          lastName: 'User',
          email: `norole-${Date.now()}@example.com`,
          password: 'password123',
        })
        .expect(201);

      expect(res.body.data.user.role).toBe(Role.PARTICIPANT);
    });

    it('should fail if required fields are missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'test@example.com' }) // missing password, firstName, lastName
        .expect(400);
    });
  });

  // --- LOGIN ---
  describe('/auth/login (POST)', () => {
    it('should login successfully with correct credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Login succeeded');
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email);

      // decode token to check payload
      const decoded = jwt.decode(res.body.data.token) as any;
      expect(decoded).toHaveProperty('sub');
      expect(decoded).toHaveProperty('email', testUser.email);
      expect(decoded).toHaveProperty('role', Role.PARTICIPANT);
    });

    it('should fail login with wrong password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' })
        .expect(401);
    });

    it('should fail login with non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nouser@example.com', password: 'anypassword' })
        .expect(401);
    });

    it('should fail login if required fields are missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email })
        .expect(400);
    });
  });
});
