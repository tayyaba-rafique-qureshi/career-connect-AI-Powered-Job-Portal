/**
 * Migration Script: Update existing reports with status field
 * 
 * This script adds the 'status' field to all existing reports that don't have it.
 * Old reports will be set to 'pending' if not resolved, or 'resolved' if resolved=true
 * 
 * Run with: node src/scripts/migrateReports.js
 */

const mongoose = require('mongoose')
require('dotenv').config()

const Report = require('../models/Report')

async function migrateReports() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB')

    // Find all reports without status field or with null status
    const reportsWithoutStatus = await Report.find({
      $or: [
        { status: { $exists: false } },
        { status: null }
      ]
    })

    console.log(`Found ${reportsWithoutStatus.length} reports without status field`)

    if (reportsWithoutStatus.length === 0) {
      console.log('No reports need migration. All reports have status field.')
      process.exit(0)
    }

    let updated = 0
    for (const report of reportsWithoutStatus) {
      // Set status based on resolved field
      if (report.resolved === true) {
        report.status = 'resolved'
      } else {
        report.status = 'pending'
      }
      
      await report.save()
      updated++
      
      if (updated % 10 === 0) {
        console.log(`Updated ${updated}/${reportsWithoutStatus.length} reports...`)
      }
    }

    console.log(`\n✅ Migration complete! Updated ${updated} reports.`)
    console.log('\nStatus distribution:')
    
    const statusCounts = await Report.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])
    
    statusCounts.forEach(item => {
      console.log(`  ${item._id}: ${item.count}`)
    })

    process.exit(0)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
migrateReports()
