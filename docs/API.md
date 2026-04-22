# Worbid API Documentation

Base URL (local): http://localhost:8080
Base URL (production): https://api.worbid.in

---

## Users

### Register a new user
POST /api/users/register

Request body:
{
  "phone": "9999999999",
  "name": "Rahul Yadav",
  "area": "Banjara Hills",
  "city": "Hyderabad",
  "bio": "Available for home services"
}

Response 200 — user created:
{
  "id": 1,
  "phone": "9999999999",
  "name": "Rahul Yadav",
  "isVerified": false,
  "createdAt": "2026-04-18T16:57:29"
}

Response 400 — phone already registered.

---

### Get user by ID
GET /api/users/{id}

Response 200:
{
  "id": 1,
  "name": "Rahul Yadav",
  "area": "Banjara Hills",
  "city": "Hyderabad"
}

Response 404 — user not found.

---

## Listings

### Get all listings (with optional filters)
GET /api/listings
GET /api/listings?city=Hyderabad
GET /api/listings?category=Home Services

Response 200 — array of listings.

---

### Create a listing
POST /api/listings

Request body:
{
  "user": { "id": 1 },
  "title": "Available for car cleaning today",
  "description": "Professional cleaning at your location",
  "category": "Home Services",
  "type": "offering",
  "area": "Banjara Hills",
  "city": "Hyderabad",
  "budgetMin": 200,
  "budgetMax": 500
}

Response 200 — listing created with id and timestamps.

---

### Get listings by user
GET /api/listings/user/{userId}

Response 200 — array of listings belonging to that user.
