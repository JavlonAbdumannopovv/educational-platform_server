import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { disconnect, Types } from 'mongoose';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { CreateReviewDto, EditReviewDto } from 'src/review/dto/review.dto';

const courseId = new Types.ObjectId().toHexString();

const createReviewDto: CreateReviewDto = {
  author: new Types.ObjectId().toHexString(),
  course: courseId,
  rating: 5,
  summary: 'Cool',
};

const editReviewDto: EditReviewDto = {
  rating: 3,
  summary: 'Good',
};

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let createdReviewId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/review/create (POST)', async () => {
    return request(app.getHttpServer())
      .post('/review/create')
      .send(createReviewDto)
      .expect(201)
      .then(({ body }: request.Response) => {
        createdReviewId = body;
        expect(createdReviewId).toBeDefined();
      });
  });

  it('/review/edit (PUT)', async () => {
    return request(app.getHttpServer())
      .put('/review/edit/' + createdReviewId)
      .send(createReviewDto)
      .expect(200)
      .then(({ body }: request.Response) => {
        createdReviewId = body;
        expect(createdReviewId).toBeDefined();
      });
  });

  it('/review/get (GET)', () => {
    return request(app.getHttpServer())
      .get('/review/get/' + courseId)
      .expect(200);
  });

  it('/review/delete (DELETE)', () => {
    return request(app.getHttpServer())
      .delete('/review/delete/' + createdReviewId)
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
    await disconnect();
  });
});
