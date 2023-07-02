
```
email  phone is_primary?    linkedId?         created_at      updated_at       deleted_at
XXX    123   1
```

1. on entry check if email or phone exists
2. if not exist insert and set email and phone as primary
3. if exist:
   - get linked entries for both phone and email
   - older record is the new primary
   - for the new primary set update_at to current time
   - update all existing entries for the phone and email (exclude the new primary) to linkedId to the new primary along with updated_at to current_time
   - insert the new entry to db, as secondary
