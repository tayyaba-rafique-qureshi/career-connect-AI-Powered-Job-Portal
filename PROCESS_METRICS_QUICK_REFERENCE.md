# Process Metrics - Quick Reference Card

## 📊 Metric Meanings (Simple)

| Metric | What It Is | Normal Range | When to Worry |
|--------|-----------|--------------|---------------|
| **Process ID** | Server's unique number | Any number | Never (just an ID) |
| **Uptime** | How long server is running | 0-7 days | >7 days (restart needed) |
| **RSS Memory** | Total RAM used | 50-300 MB | >500 MB (too high) |
| **Heap Used** | Memory for data/objects | 20-150 MB | >200 MB (memory leak) |

---

## 🚦 Color Guide

| Color | Meaning | Action |
|-------|---------|--------|
| 🟢 **Green** | Healthy | Nothing - all good! |
| 🟡 **Yellow** | Elevated | Monitor closely |
| 🟠 **Orange** | Warning | Plan action soon |
| 🔴 **Red** | Critical | Act immediately |

---

## ⚠️ Warning Thresholds

### Heap Used
```
✅ 0-150 MB    → Healthy
⚠️ 150-200 MB  → Elevated (watch it)
🚨 200+ MB     → Critical (restart server)
```

### RSS Memory
```
✅ 0-300 MB    → Normal
⚠️ 300-500 MB  → Elevated (monitor)
🚨 500+ MB     → High (restart soon)
```

### Server Uptime
```
✅ 0-7 days    → Healthy
⚠️ 7-14 days   → Consider restart
🚨 14+ days    → Restart urgently
```

---

## 🔧 Quick Actions

### If You See Red Warnings
```
1. Note the current time
2. Restart the server
3. Monitor for 30 minutes
4. If problem returns, contact developers
```

### If Memory Keeps Growing
```
Hour 1: 100 MB
Hour 2: 150 MB  ← Growing!
Hour 3: 200 MB  ← Memory leak!

Action: Restart server immediately
```

### If Uptime > 7 Days
```
Current: 9d 12h 30m

Action: Schedule restart during low-traffic hours
Example: Sunday 3 AM
```

---

## 💡 Simple Explanations

### Process ID
```
What: Server's ID number (like a license plate)
Example: 18012
Use: Kill stuck processes
Changes: Every restart
```

### Server Uptime
```
What: How long server has been running
Example: 2d 5h 30m (2 days, 5 hours, 30 minutes)
Good: Less than 7 days
Bad: More than 14 days
```

### RSS Memory
```
What: Total RAM used by server
Example: 92.45 MB
Includes: Code + Stack + Heap + Other
Think: Your entire desk space
```

### Heap Used
```
What: Memory for JavaScript data
Example: 33.51 MB
Includes: Objects, strings, arrays
Think: Just the papers on your desk
```

---

## 🎯 Decision Tree

```
┌─────────────────────────────────────┐
│ Check Process Metrics               │
└──────────────┬──────────────────────┘
               │
               ▼
        ┌──────────────┐
        │ All Green?   │
        └──────┬───────┘
               │
       ┌───────┴───────┐
       │               │
      YES             NO
       │               │
       ▼               ▼
  ┌─────────┐   ┌──────────────┐
  │ Relax!  │   │ Check Colors │
  │ All OK  │   └──────┬───────┘
  └─────────┘          │
                       ▼
              ┌────────────────┐
              │ Yellow/Orange? │
              └────────┬───────┘
                       │
               ┌───────┴───────┐
               │               │
              YES             NO (Red)
               │               │
               ▼               ▼
        ┌──────────┐    ┌──────────────┐
        │ Monitor  │    │ Restart Now! │
        │ Closely  │    └──────────────┘
        └──────────┘
```

---

## 📱 Mobile Quick Check

### Daily Health Check (30 seconds)
```
1. Open Admin Health page
2. Scroll to Process Metrics
3. Look for red/orange colors
4. If all green → Done!
5. If warnings → Take action
```

### Weekly Maintenance (5 minutes)
```
1. Check uptime (should be < 7 days)
2. Check memory trends
3. Schedule restart if needed
4. Document any issues
```

---

## 🆘 Emergency Actions

### Server Frozen
```
1. Note Process ID (e.g., 18012)
2. Open terminal/command prompt
3. Run: kill 18012 (or taskkill /PID 18012 /F)
4. Restart server
5. Check logs
```

### Memory Leak Detected
```
Symptoms:
- Heap > 200 MB (red)
- Memory growing continuously
- Server slow

Actions:
1. Restart server immediately
2. Note the time and values
3. Contact developers
4. Monitor after restart
```

### High Uptime Warning
```
Current: 16d 8h 30m (red)

Actions:
1. Schedule immediate restart
2. Notify team
3. Choose low-traffic time
4. Restart and monitor
```

---

## 📋 Checklist Format

### Daily Check
- [ ] Open Admin Health page
- [ ] Check Process Metrics section
- [ ] All values green?
- [ ] Any red/orange warnings?
- [ ] Uptime < 7 days?
- [ ] Memory stable?

### Weekly Maintenance
- [ ] Review uptime (restart if > 7 days)
- [ ] Check memory trends
- [ ] Review warning history
- [ ] Schedule restart if needed
- [ ] Document any issues

### Monthly Review
- [ ] Analyze memory patterns
- [ ] Review restart frequency
- [ ] Check for recurring issues
- [ ] Update monitoring thresholds
- [ ] Report to team

---

## 🎓 Learning Path

### Level 1: Beginner
```
✅ Understand color coding
✅ Know when to restart
✅ Read tooltip explanations
```

### Level 2: Intermediate
```
✅ Understand each metric
✅ Recognize memory leak patterns
✅ Schedule proactive restarts
```

### Level 3: Advanced
```
✅ Analyze memory trends
✅ Optimize restart schedules
✅ Troubleshoot issues independently
```

---

## 💬 Common Questions

### Q: Is 1 minute uptime bad?
**A:** No! It means the server just restarted. This is normal after deployments.

### Q: Why does Process ID change?
**A:** Every restart gives a new ID. This is normal and expected.

### Q: What's the difference between RSS and Heap?
**A:** RSS is total memory (everything). Heap is just data/objects (part of RSS).

### Q: Should I restart every day?
**A:** No. Weekly restarts are sufficient. Only restart more often if you see warnings.

### Q: What if memory keeps growing after restart?
**A:** This indicates a code issue (memory leak). Contact developers immediately.

### Q: Can I restart during business hours?
**A:** Only if necessary. Prefer low-traffic times (early morning, weekends).

---

## 🔗 Where to Get Help

### In the UI
1. Hover over (?) icons for quick tips
2. Click "What do these metrics mean?" for details
3. Read warning messages for specific actions

### Documentation
1. `PROCESS_METRICS_EXPLANATION.md` - Detailed guide
2. `PROCESS_METRICS_UI_GUIDE.md` - Visual examples
3. `ADMIN_HEALTH_METRICS_SUMMARY.md` - Implementation details

### When to Contact Developers
- Memory leak persists after restart
- Server crashes frequently
- Unusual patterns in metrics
- Red warnings don't resolve

---

## 📞 Emergency Contact Template

```
Subject: Server Health Alert - [Metric Name]

Current Status:
- Process ID: [PID]
- Uptime: [X days]
- RSS Memory: [X MB]
- Heap Used: [X MB]

Issue:
- [Describe the warning/problem]

Actions Taken:
- [What you've done so far]

Request:
- [What help you need]

Timestamp: [Date and time]
```

---

## ✅ Success Indicators

### Healthy System
```
✅ All metrics green
✅ Uptime < 7 days
✅ Memory stable
✅ No warnings
✅ Server responsive
```

### Well-Maintained System
```
✅ Regular weekly restarts
✅ Proactive monitoring
✅ Quick response to warnings
✅ Documented issues
✅ Trending downward on problems
```

---

## 🎯 Remember

1. **Green = Good** - No action needed
2. **Red = Act** - Restart server
3. **Growing Memory = Leak** - Restart and report
4. **Uptime > 7 days** - Schedule restart
5. **When in doubt** - Restart (it's safe!)

---

**Print this card and keep it handy for quick reference!**
