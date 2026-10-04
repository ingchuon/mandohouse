-- Migration: ย้ายรหัสกลุ่มจาก enrollments -> students
-- วางที่ supabase/migrations/005_add_group_code_to_students.sql
-- (ได้รันกับฐานข้อมูลจริงไปแล้ว — ไฟล์นี้เก็บไว้ให้ repo ตรงกับ DB)

alter table students add column if not exists group_code text;

update students s
set group_code = sub.code
from (
  select e.student_id, max(e.group_code) as code
  from enrollments e
  where e.group_code is not null
  group by e.student_id
) sub
where s.id = sub.student_id and s.group_code is null;

create index if not exists idx_students_group_code on students(school_id, group_code);
