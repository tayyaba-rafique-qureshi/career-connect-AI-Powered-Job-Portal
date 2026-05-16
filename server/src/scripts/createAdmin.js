require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })
const mongoose = require('mongoose')
const User = require('../models/User')

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI)
    console.log('Connected to MongoDB')

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@careerconnect.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123'

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail })
    if (existingAdmin) {
      console.log('Admin user already exists:', adminEmail)
      process.exit(0)
    }

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      onboardingComplete: true,
      avatar: 'https://ui-avatars.com/api/?name=Admin&background=2557a7&color=fff'
    })

    console.log('✅ Admin user created successfully!')
    console.log('Email:', adminEmail)
    console.log('Password:', adminPassword)
    console.log('⚠️  Please change the password after first login')

    process.exit(0)
  } catch (error) {
    console.error('Error creating admin:', error.message)
    process.exit(1)
  }
}

createAdmin()
