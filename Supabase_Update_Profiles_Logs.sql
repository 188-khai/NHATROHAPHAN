-- 1. Create Profiles Table
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text,
  boarding_house_name text,
  email text,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Create Activity Logs Table
create table if not exists activity_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text not null, -- e.g., 'bill_created', 'room_added'
  message text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Enable RLS
alter table profiles enable row level security;
alter table activity_logs enable row level security;

-- 4. RLS Policies for Profiles
create policy "Users can view their own profile" on profiles for select using (auth.uid() = id);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);

-- 5. RLS Policies for Activity Logs
create policy "Users can view their own logs" on activity_logs for select using (auth.uid() = user_id);
create policy "Users can insert their own logs" on activity_logs for insert with check (auth.uid() = user_id);

-- 6. Trigger for updated_at on profiles
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
before update on profiles
for each row
execute function handle_updated_at();
