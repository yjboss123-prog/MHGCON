/*
  # Reset project and task dates for 2026

  1. Changes
    - Update project start date to January 2026
    - Update project end date to December 2026
    - Shift all task dates forward by 365 days (from 2025 to 2026)
    - Reset all was_shifted flags to false
    - Clear last_shift_date for fresh start
    - Reset all progress to 0%
    - Reset all statuses to 'On Track'
    - Clear all delay reasons
    
  2. Purpose
    - Prepare project for 2026 timeline
    - Fresh start with no previous progress or shifts
*/

-- Calculate the date difference and reset everything
DO $$
DECLARE
  old_start DATE := '2025-01-06';
  new_start DATE := '2026-01-06';
  days_diff INTEGER;
BEGIN
  -- Calculate days between old and new start (365 days for next year)
  days_diff := new_start - old_start;
  
  -- Update project dates
  UPDATE projects 
  SET 
    start_date = '2026-01-06',
    end_date = '2026-12-31',
    updated_at = now()
  WHERE id = '00000000-0000-0000-0000-000000000001';
  
  -- Shift all task dates forward and reset everything
  UPDATE tasks
  SET 
    start_date = start_date + days_diff,
    end_date = end_date + days_diff,
    percent_done = 0,
    status = 'On Track',
    delay_reason = NULL,
    was_shifted = false,
    last_shift_date = NULL,
    updated_at = now();
END $$;
