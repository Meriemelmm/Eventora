

export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CANCELED = 'CANCELED',
}

export interface Event {
  _id: string;
  id?: string;
  title: string;
  description: string;
  dateTime: string;
  location: string;
  maxCapacity: number;
  currentBookings: number;
  status?: EventStatus;
  category?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEventDto {
  title: string;
  description: string;
  dateTime: string;
  location: string;
  maxCapacity: number;
  category?: string;
  image?: string;
}


export interface UpdateEventDto extends Partial<CreateEventDto> {
  status?: EventStatus;
}


export interface EventsResponse {
  success: boolean;
  data: Event[];
  message?: string;
}

export interface EventResponse {
  success: boolean;
  data: Event;
  message?: string;
}
