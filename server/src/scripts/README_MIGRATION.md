# Database Migration Scripts

## Report Status Migration

### Problem
Old reports in the database don't have the `status` field, causing them to not appear in the Admin Job Reports page.

### Solution
Run the migration script to add the `status` field to all existing reports.

## How to Run

### Option 1: Using Node directly
```bash
cd server
node src/scripts/migrateReports.js
```

### Option 2: Using npm script (if added to package.json)
```bash
cd server
npm run migrate:reports
```

## What the Migration Does

1. **Finds all reports without status field**
   - Reports where `status` doesn't exist
   - Reports where `status` is null

2. **Sets status based on resolved field**
   - If `resolved === true` → Sets `status = 'resolved'`
   - If `resolved === false` or undefined → Sets `status = 'pending'`

3. **Shows progress**
   - Displays count of reports to migrate
   - Shows progress every 10 reports
   - Displays final status distribution

## Expected Output

```
Connecting to MongoDB...
Connected to MongoDB
Found 15 reports without status field
Updated 10/15 reports...
Updated 15/15 reports...

✅ Migration complete! Updated 15 reports.

Status distribution:
  pending: 8
  resolved: 7
```

## Verification

After running the migration, verify in MongoDB:

```javascript
// Check all reports have status
db.reports.find({ status: { $exists: false } }).count()
// Should return: 0

// Check status distribution
db.reports.aggregate([
  { $group: { _id: '$status', count: { $sum: 1 } } }
])
```

## Rollback

If you need to rollback (remove status field):

```javascript
db.reports.updateMany(
  {},
  { $unset: { status: "" } }
)
```

## Notes

- **Safe to run multiple times** - Only updates reports without status
- **Non-destructive** - Doesn't delete or modify other fields
- **Based on resolved field** - Uses existing data to determine status
- **Idempotent** - Running twice won't cause issues

## Troubleshooting

### "Cannot find module '../models/Report'"
- Make sure you're in the `server` directory
- Check that the path to Report model is correct

### "MONGO_URI is not defined"
- Make sure `.env` file exists in server directory
- Check that `MONGO_URI` is set in `.env`

### "Connection refused"
- Make sure MongoDB is running
- Check MongoDB connection string in `.env`

### Reports still not showing
1. Check server console logs for query output
2. Verify migration ran successfully
3. Check database directly: `db.reports.find({})`
4. Restart the server after migration
