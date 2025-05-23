export interface CreateReviewDto {
  homestayId: string;
  rating: number;
  comment: string;
}

export interface UpdateReviewDto {
  rating?: number;
  comment?: string;
}

export interface ReviewResponse {
  id: string;
  userId: string;
  homestayId: string;
  rating: number;
  comment: string;
  response?: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    fullName: string;
    profilePicture?: string;
  };
}

export interface ReviewSearchParams {
  userId?: string;
  minRating?: number;
  maxRating?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
