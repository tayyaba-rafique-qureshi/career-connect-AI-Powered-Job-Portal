const mongoose = require('mongoose')
require('dotenv').config()

const testConnection = async () => {
  console.log('🧪 Testing MongoDB Atlas Connection...')
  console.log('='.repeat(60))
  
  // Check environment variable
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env file')
    process.exit(1)
  }
  
  // Show sanitized URI
  const sanitizedUri = uri.replace(/:[^:@]+@/, ':****@')
  console.log('🔗 Connection URI:', sanitizedUri)
  console.log('='.repeat(60))
  
  try {
    console.log('⏳ Attempting connection...')
    
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4
    })
    
    console.log('✅ Connection Successful!')
    console.log('='.repeat(60))
    console.log('📊 Connection Details:')
    console.log('   Host:', conn.connection.host)
    console.log('   Database:', conn.connection.name)
    console.log('   Port:', conn.connection.port)
    console.log('   Ready State:', conn.connection.readyState)
    console.log('='.repeat(60))
    
    // Test a simple query
    console.log('🔍 Testing database query...')
    const collections = await mongoose.connection.db.listCollections().toArray()
    console.log(`✅ Found ${collections.length} collections:`)
    collections.forEach(col => console.log(`   - ${col.name}`))
    console.log('='.repeat(60))
    
    await mongoose.disconnect()
    console.log('✅ Test completed successfully!')
    process.exit(0)
    
  } catch (error) {
    console.error('❌ Connection Failed!')
    console.error('='.repeat(60))
    console.error('Error Name:', error.name)
    console.error('Error Message:', error.message)
    
    if (error.code) {
      console.error('Error Code:', error.code)
    }
    
    console.error('='.repeat(60))
    console.error('💡 Troubleshooting Steps:')
    console.error('   1. Check MongoDB Atlas IP Whitelist:')
    console.error('      - Go to Network Access in Atlas')
    console.error('      - Add 0.0.0.0/0 (allow all) for testing')
    console.error('   2. Verify Cluster Status:')
    console.error('      - Check if cluster is active (not paused)')
    console.error('      - Ensure no billing issues')
    console.error('   3. Verify Credentials:')
    console.error('      - Username: jobapp_user')
    console.error('      - Password: Check if correct')
    console.error('      - Database: job_portal_db')
    console.error('   4. Check DNS Resolution:')
    console.error('      - Try: nslookup ac-jfggfkk.8iodxpg.mongodb.net')
    console.error('   5. Check Firewall/VPN:')
    console.error('      - Disable VPN temporarily')
    console.error('      - Check corporate firewall settings')
    console.error('='.repeat(60))
    
    process.exit(1)
  }
}

testConnection()
