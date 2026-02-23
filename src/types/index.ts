export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "admin" | "librarian" | "member";
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  genre: string;
  description: string | null;
  cover_image_url: string | null;
  publication_year: number | null;
  page_count: number | null;
  status: "available" | "borrowed" | "reserved" | "lost";
  added_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Checkout {
  id: string;
  book_id: string;
  borrower_id: string;
  checked_out_at: string;
  due_date: string;
  returned_at: string | null;
  checked_out_by: string | null;
  checked_in_by: string | null;
  status: "active" | "returned" | "overdue";
  created_at: string;
  book?: Book;
  borrower?: Profile;
}

export interface ReadingHistory {
  id: string;
  user_id: string;
  book_id: string;
  rating: number | null;
  review: string | null;
  finished_at: string;
  created_at: string;
  book?: Book;
}

export interface AIConversation {
  id: string;
  user_id: string;
  messages: AIMessage[];
  feature: "assistant" | "search" | "recommendations";
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}
