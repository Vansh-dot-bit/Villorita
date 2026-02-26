# Purple Bite Backend - README

Complete backend implementation for Purple Bite cake e-commerce platform.

## 🚀 Quick Start

1. **Configure MongoDB**
   ```bash
   # Edit .env.local with your MongoDB connection string
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/purplebite
   JWT_SECRET=your-secret-key-here
   ```

2. **Start Server**
   ```bash
   npm run dev
   ```

3. **Test APIs**
   - Open `API_TESTING.md` for test scripts
   - Use Postman/Thunder Client for API testing
   - Check `walkthrough.md` for complete documentation

## 📦 What's Included

### Models
- **User** - Authentication, profile, addresses
- **Product** - Cake products with features & weights
- **Cart** - Shopping cart with item management
- **Order** - Order processing & tracking
- **Coupon** - Discount code system

### API Routes
- `/api/auth/*` - Register, Login
- `/api/products` - Product CRUD
- `/api/cart` - Cart management
- `/api/orders` - Order processing
- `/api/coupons` - Coupon validation
- `/api/user/*` - Profile & addresses
- `/api/admin/*` - Admin dashboard & controls

## 🔒 Security
- bcrypt password hashing
- JWT token authentication
- Protected routes with middleware
- Input validation on all endpoints

## 📚 Documentation
See [walkthrough.md](file:///C:/Users/Hp/.gemini/antigravity/brain/2a45128d-e7b2-40c6-9829-e8a46246e075/walkthrough.md) for complete API documentation.

## 🛠️ Tech Stack
- Next.js 16 API Routes
- MongoDB + Mongoose
- JWT + bcrypt
- TypeScript/JavaScript
