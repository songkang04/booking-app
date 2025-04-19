export interface CreateReviewDto {
  homestayId: number;
  rating: number;
  comment: string;
}

export interface UpdateReviewDto {
  rating?: number;
  comment?: string;
}

export interface ReviewResponse {
  id: number;
  userId: number;
  homestayId: number;
  rating: number;
  comment: string;
  response?: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: number;
    fullName: string;
    avatar?: string;
  };
}

export interface ReviewSearchParams {
  homestayId?: number;
  userId?: number;
  minRating?: number;
  maxRating?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
