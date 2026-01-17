

export interface Property {
  id: number;
  address: string;
  city: string;
  price: number;
  rentPrice?: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  description: string;
  imageUrls: string[]; 
  imageUrl360?: string; 
  type: string; 
  listingType: 'sale' | 'rent';
  status: 'approved' | 'pending' | 'booked'; 
  bookedByUserId: number | null;
}

export interface Language {
  code: string;
  name: string;
}

export interface ChatMessage {
    id: string;
    sender: 'user' | 'bot';
    text: string;
}

export interface User {
    id: number;
    type: 'admin' | 'user';
    name: string;
    username: string;
    password?: string; // Password for login
}

export interface Filter {
    searchTerm: string;
    minPrice: string;
    maxPrice: string;
    type: string;
    listingType: 'all' | 'sale' | 'rent';
}

export interface Feedback {
  _id: string; // from MongoDB
  message: string;
  userId?: number;
  userName?: string;
  createdAt: string; // ISO date string
}