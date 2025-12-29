export interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}