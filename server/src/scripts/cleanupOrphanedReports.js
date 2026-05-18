/**
 * Cleanup Script: Remove orphaned reports
 * 
 * This script deletes reports where:
 * - The job was deleted (job doesn't exist)
 * - The reporter was deleted (user doesn't exist)
 * 
 * Run with: node src/scripts/cleanupOrphanedReports.js
 */

const mongoose = require('mongoose')
require('dotenv').config()

const Report = require('../models/Report')

async function cleanupOrphanedReports() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB')

    // Find reports with deleted jobs
    const reportsWithDeletedJobs = await Report.find({})
      .populate('job')
      .then(reports => reports.filter(r => r.job === null))

    console.log(`\nFound ${reportsWithDeletedJobs.length} reports with deleted jobs`)

    // Find reports with deleted reporters
    const reportsWithDeletedReporters = await Report.find({})
      .populate('reportedBy')
      .then(reports => reports.filter(r => r.reportedBy === null))

    console.log(`Found ${reportsWithDeletedReporters.length} reports with deleted reporters`)

    // Ask for confirmation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const totalToDelete = new Set([
      ...reportsWithDeletedJobs.map(r => r._id.toString()),
      ...reportsWithDeletedReporters.map(r => r._id.toString())
    ]).size

    if (totalToDelete === 0) {
      console.log('\n✅ No orphaned reports found. Database is clean!')
      process.exit(0)
    }

    console.log(`\n⚠️  Total orphaned reports to delete: ${totalToDelete}`)
    
    readline.question('\nDo you want to delete these orphaned reports? (yes/no): ', async (answer) => {
      if (answer.toLowerCase() === 'yes') {
        // Delete reports with deleted jobs
        const jobIds = reportsWithDeletedJobs.map(r => r._id)
        if (jobIds.length > 0) {
          await Report.deleteMany({ _id: { $in: jobIds } })
          console.log(`✅ Deleted ${jobIds.length} reports with deleted jobs`)
        }

        // Delete reports with deleted reporters
        const reporterIds = reportsWithDeletedReporters.map(r => r._id)
        if (reporterIds.length > 0) {
          await Report.deleteMany({ _id: { $in: reporterIds } })
          console.log(`✅ Deleted ${reporterIds.length} reports with deleted reporters`)
        }

        console.log('\n✅ Cleanup complete!')
      } else {
        console.log('\n❌ Cleanup cancelled')
      }
      
      readline.close()
      process.exit(0)
    })

  } catch (error) {
    console.error('Cleanup failed:', error)
    process.exit(1)
  }
}

// Run cleanup
cleanupOrphanedReports()
