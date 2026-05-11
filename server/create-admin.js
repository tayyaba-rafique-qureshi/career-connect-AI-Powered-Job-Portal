const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config()

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message)
    process.exit(1)
  }
}

// User Schema (simplified for this script)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String },
  role: { type: String, enum: ['applicant', 'recruiter', 'employer', 'admin'], default: 'applicant' },
  onboardingComplete: { type: Boolean, default: false },
  isProfileComplete: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
})

const User = mongoose.model('User', userSchema)

// Create Admin User
const createAdmin = async () => {
  try {
    console.log('🔍 Checking if admin already exists...')
    
    const adminEmail = 'admin@careerconnect.com'
    const existingAdmin = await User.findOne({ email: adminEmail })
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!')
      console.log('📧 Email:', existingAdmin.email)
      console.log('👤 Name:', existingAdmin.name)
      console.log('🔑 Role:', existingAdmin.role)
      console.log('')
      console.log('💡 To update password, delete the existing admin first:')
      console.log('   Use MongoDB Compass or Atlas to delete the user')
      console.log('   Then run this script again')
      return
    }
    
    console.log('✨ Creating new admin user...')
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    // Create admin user
    const admin = await User.create({
      name: 'Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      onboardingComplete: true,
      isProfileComplete: true
    })
    
    console.log('✅ Admin user created successfully!')
    console.log('=' .repeat(60))
    console.log('📊 Admin Credentials:')
    console.log('   Email:    admin@careerconnect.com')
    console.log('   Password: admin123')
    console.log('   Role:     admin')
    console.log('=' .repeat(60))
    console.log('🔒 IMPORTANT: Change the password after first login!')
    console.log('=' .repeat(60))
    
  } catch (error) {
    console.error('❌ Error creating admin:', error.message)
    if (error.code === 11000) {
      console.error('💡 Email already exists in database')
    }
  }
}

// Main execution
const main = async () => {
  console.log('🚀 Admin User Creation Script')
  console.log('=' .repeat(60))
  
  await connectDB()
  await createAdmin()
  
  console.log('')
  console.log('✅ Script completed!')
  await mongoose.disconnect()
  console.log('👋 Disconnected from MongoDB')
  process.exit(0)
}

main()
