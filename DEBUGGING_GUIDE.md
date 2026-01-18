# Debugging Guide for `handlers_event_seat.py`

## Quick Start - Three Ways to Debug

### Method 1: Using `breakpoint()` (Already Added) ⚡

I've added a `breakpoint()` call at line 545. When you run your code and it hits this line, the Python debugger will activate in your terminal.

**To use:**
1. Start your backend normally:
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload
   ```

2. Trigger the endpoint (from frontend or API client):
   ```
   GET /api/events/{event_id}/seats/statistics
   ```

3. When the breakpoint hits, you'll see `(Pdb)` prompt in your terminal

**Common debugger commands:**
- `p status` - Print the value of `status`
- `p count` - Print the value of `count`
- `p status_counts` - Print the entire list
- `l` - List current code
- `n` - Next line
- `s` - Step into function
- `c` - Continue execution
- `q` - Quit debugger

**Example:**
```python
(Pdb) p status_counts
[(<EventSeatStatusEnum.AVAILABLE: 'available'>, 10), ...]
(Pdb) p status
<EventSeatStatusEnum.AVAILABLE: 'available'>
(Pdb) c
```

---

### Method 2: VS Code/Cursor Debugger (Recommended) 🎯

**Steps:**
1. Open the file `backend/app/application/ticketing/handlers_event_seat.py`
2. Click in the left margin at line 545 to set a breakpoint (red dot)
3. Press `F5` or go to Run & Debug panel
4. Select "Python: FastAPI (Debug Mode)" from the dropdown
5. Click the green play button
6. Trigger the endpoint: `GET /api/events/{event_id}/seats/statistics`
7. The debugger will pause at your breakpoint

**Debugger features:**
- View variables in the left panel
- Hover over variables to see values
- Step through code line by line
- Evaluate expressions in the Debug Console
- Set conditional breakpoints

---

### Method 3: Enhanced Logging (Already Added) 📝

I've added enhanced print statements that will show:
- Each status being processed
- The count for each status
- The type of the status (to check for enum issues)
- Warnings for unhandled statuses

**To see the output:**
1. Start your backend normally
2. Trigger the endpoint
3. Check your terminal for debug output like:
   ```
   DEBUG: Processing status=EventSeatStatusEnum.AVAILABLE, count=10, type=<enum 'EventSeatStatusEnum'>
   ```

---

## Common Issues to Check

### Issue 1: Status Type Mismatch
If statuses aren't matching, check if the database returns strings vs enums:
```python
# In debugger, check:
p type(status)
p EventSeatStatusEnum.AVAILABLE
p status == EventSeatStatusEnum.AVAILABLE
```

### Issue 2: Missing Status Values
The code now prints a warning if a status isn't handled. Check for:
```
WARNING: Unhandled status: <some_status> (type: <type>)
```

### Issue 3: Empty status_counts
If `status_counts` is empty, check your query:
```python
p base_query
p query.event_id
p tenant_id
```

---

## Removing Debug Code

Once you're done debugging, remove:
1. The `breakpoint()` line (line 545)
2. The extra `print()` statements if you don't need them
3. Or comment them out for future debugging

---

## API Endpoint to Test

**Endpoint:** `GET /api/events/{event_id}/seats/statistics`

**Example:**
```bash
curl -X GET "http://localhost:8000/api/events/YOUR_EVENT_ID/seats/statistics" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Or trigger it from your frontend when viewing event statistics.
