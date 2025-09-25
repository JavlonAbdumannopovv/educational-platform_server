import { InjectModel } from '@nestjs/mongoose';
import { Review, ReviewDocument } from './review.model';
import { Model } from 'mongoose';
import { CreateBookDto } from 'src/books/dto/create-book.dto';
import { CreateReviewDto, EditReviewDto } from './review.dto';

export class ReviewService {
  constructor(@InjectModel(Review.name) private reviewModel: Model<ReviewDocument>) {}

  async createReview(dto: CreateReviewDto) {
    const review = await this.reviewModel.create(dto);

    return review._id;
  }

  async deleteReview(reviewId: string) {
    await this.reviewModel.findByIdAndRemove(reviewId);

    return reviewId;
  }

  async editReview(reviewId: string, dto: EditReviewDto) {
    const review = await this.reviewModel.findByIdAndUpdate(
      reviewId,
      {
        $set: {
          rating: dto.rating,
          summary: dto.summary,
        },
      },
      { new: true },
    );

    return review._id;
  }

  async getReview(courseId: string) {
    const reviews = await this.reviewModel.find({ course: courseId });

    return reviews; 
  }
}
