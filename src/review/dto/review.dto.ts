export interface CreateReviewDto {
  course: string;
  author: string;
  rating: number;
  summary: string;
}

export interface EditReviewDto {
  rating: number;
  summary: string;
}

export interface GetByUserDto {
  course: string;
  author: string;
}
