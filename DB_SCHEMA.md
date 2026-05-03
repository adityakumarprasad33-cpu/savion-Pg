# Savion Complete Database Schema
This document outlines the complete 0-to-Final Firestore database architecture for the Savion platform.

## 1. Core Entities

### `users` (Profiles & Roles)
```typescript
{
  uid: string;           // Document ID (matches Firebase Auth)
  role: "tenant" | "owner" | "admin" | "caretaker" | "student";
  name: string;
  email?: string;
  phone?: string;
  upiId?: string;        // Owners only (for rent collection)
  isVerified?: boolean;  // KYC completion status
  createdAt: number;
}
```

### `pgs` (Properties)
```typescript
{
  id: string;            // Document ID
  ownerId: string;
  caretakerId?: string;  // Assigned caretaker
  name: string;
  description: string;
  type: "Boys" | "Girls" | "Co-living";
  rating: number;
  city: string;
  location: string;      // Full display address
  lat?: number;
  lng?: number;
  price: string;         // Auto-set to lowest room rent
  img: string;           // Main thumbnail
  images?: string[];     // Gallery
  facilities: string[];  // e.g., ["WiFi", "AC"]
  rules: string[];       // e.g., ["No smoking"]
  nearbyPlaces: string[];
  totalRooms: number;    // Computed total capacity
  availableRooms: number;// Computed available capacity
  createdAt: number;
  rooms: [               // Embedded Sub-Array
    {
      id: string;
      roomNumber: string;
      type: "Single" | "Double" | "Triple" | "Studio" | "Dormitory";
      monthlyRent: number;
      capacity: number;
      currentOccupancy: number;
      available: number;
      floor?: string;
      amenities: string[];
      image?: string;
    }
  ]
}
```

## 2. Operations & Tenancy

### `bookings` (Reservation lifecycle)
```typescript
{
  id: string;
  tenantId: string;
  tenantName: string;
  ownerId: string;
  pgId: string;
  pgName: string;
  roomId?: string;
  roomNo?: string;
  roomType: string;
  moveInDate: string;    // "YYYY-MM-DD"
  moveOutDate?: string;  
  amount: number;
  paymentChoice?: "payNow" | "payLater";
  status: "pending" | "approved" | "confirmed" | "cancelled" | "disputed" | "notice_given" | "notice_approved";
  aadhaarUrl: string;    // KYC Upload
  extraDocUrl?: string;  
  signatureUrl: string;  // Tenant e-signature
  contractId: string;    // Link to generated contract
  createdAt: number;
}
```

### `contracts` (Digital Legal Agreements)
```typescript
{
  id: string;
  bookingId: string;
  pgId: string;
  pgName: string;
  pgLocation: string;
  ownerId: string;
  tenantId: string;
  tenantName: string;
  tenantAadhaarUrl: string;
  tenantAadhaarNumber?: string; // Extracted via OCR
  tenantDob?: string;           // Extracted via OCR
  monthlyRent: string;
  moveInDate: string;
  securityDeposit: string;
  lockInMonths: number;
  noticePeriodDays: number;
  createdAt: number;
}
```

## 3. Financials

### `paymentSessions` (Security lock for checkout)
```typescript
{
  id: string;
  type: "rent" | "security_deposit";
  tenantId: string;      // Locked to prevent tampering
  tenantName: string;
  tenantAadhaar: string;
  ownerId: string;
  ownerName: string;
  ownerUpiId: string;
  pgId: string;
  pgName: string;
  roomNo: string;
  bookingId: string;
  contractId: string;
  amount: number;        // Immutable server-side amount
  month: string;         // "YYYY-MM"
  expiresAt: number;     // 5-minute countdown limit
  createdAt: number;
}
```

### `payments` (Completed Transactions)
```typescript
{
  id: string;
  tenantId: string;
  ownerId: string;
  pgId: string;
  bookingId: string;
  contractId: string;
  tenantName: string;
  tenantAadhaar: string; // Masked (e.g., "XXXX-XXXX-1234")
  ownerName: string;
  ownerUpiId: string;
  pgName: string;
  roomNo: string;
  amount: number;
  month: string;         // "YYYY-MM"
  utrNumber: string;     // UPI Transaction Reference
  status: "pending_verification" | "verified" | "rejected";
  createdAt: number;
}
```

## 4. Admin & Support

### `complaints` (Ticketing System)
```typescript
{
  id: string;
  tenantId: string;
  tenantName?: string;
  ownerId?: string;
  pgId: string;
  pgName: string;
  roomNo?: string;
  category: string;      // e.g., "Plumbing", "Electrical"
  description: string;
  status: "open" | "in-progress" | "resolved";
  createdAt: number;
}
```

### `verifications` (KYC processing)
```typescript
{
  id: string;            // Matches userId
  userEmail: string;
  fullName: string;
  idType: "Aadhaar" | "Driving License" | "Passport";
  idUrl: string;
  selfieUrl?: string;
  status: "pending" | "verified" | "rejected";
  rejectionReason?: string;
  mlConfidence?: number; // Internal logic
  faceMatchScore?: number;
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

## 5. Community & Analytics

### `platformStats` (Global Counters)
```typescript
{
  id: "global",
  count: number;         // Tenants
  rating: number;        // Average global rating
  reviews: number;       // Review count
  cities: number;        // Active cities
  pgs: number;           // Active properties
  lastUpdated: number;
  topCities: [{ city: string, places: string, img: string, tag: string }]
}
```

### `reviews` (Public Feedback)
```typescript
{
  id: string;
  tenantId: string;
  tenantName: string;
  pgId: string;
  pgName: string;
  rating: number;        // 1-5
  comment: string;
  createdAt: number;
}
```

### `notifications` (In-app alerts)
```typescript
{
  id: string;
  userId: string;        // Target user
  title: string;
  message: string;
  type: "booking" | "complaint" | "system";
  read: boolean;
  createdAt: number;
}
```

### `caretakers` (Staff Mapping)
```typescript
{
  id: string;
  uid: string;           // Custom login ID
  email: string;         // Hidden auth email
  name: string;
  ownerId: string;
  pgIds: string[];       // Array of assigned PGs
  saved: boolean;
  createdAt: number;
}
```
