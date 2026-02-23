export const ROLES = {
  ADMIN: "admin",
  LIBRARIAN: "librarian",
  MEMBER: "member",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const BOOK_STATUSES = {
  AVAILABLE: "available",
  BORROWED: "borrowed",
  RESERVED: "reserved",
  LOST: "lost",
} as const;

export type BookStatus = (typeof BOOK_STATUSES)[keyof typeof BOOK_STATUSES];

export const GENRES = [
  "Fiction",
  "Non-Fiction",
  "Mystery",
  "Thriller",
  "Romance",
  "Science Fiction",
  "Fantasy",
  "Historical Fiction",
  "Horror",
  "Biography",
  "History",
  "Science",
  "Self-Help",
  "Business",
  "Children",
  "Poetry",
  "Art",
  "Cooking",
  "Travel",
  "Religion",
  "Philosophy",
  "Other",
] as const;

export const CHECKOUT_STATUSES = {
  ACTIVE: "active",
  RETURNED: "returned",
  OVERDUE: "overdue",
} as const;
