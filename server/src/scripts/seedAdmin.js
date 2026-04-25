/**
 * Run once to create the admin account:
 *   node src/scripts/seedAdmin.js
 */
require('dotenv').config()
const mongoose = require('mongoose')
const User = require('../models/User')

const ADMIN = {
  name:     'Super Admin',
  email:    'tayyabarafique170@gmail.com',
  password: 'Admin@1234',
  role:     'admin'
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI)

  const existing = await User.findOne({ email: ADMIN.email })
  if (existing) {
    console.log('Admin already exists:', ADMIN.email)
    process.exit(0)
  }

  await User.create(ADMIN)
  console.log('Admin created successfully!')
  console.log('Email:   ', ADMIN.email)
  console.log('Password:', ADMIN.password)
  process.exit(0)
}

seed().catch(err => {
  console.error(err)
  process.exit(1)
})
