-- Create a function to get the total number of users from auth.users
-- This is necessary because we cannot directly query auth.users from the client
-- and we want a count of ALL registered users, not just those in a public profile table.

CREATE OR REPLACE FUNCTION public.get_total_users()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with the privileges of the creator (postgres), bypassing RLS
AS $$
BEGIN
  RETURN (SELECT count(*)::integer FROM auth.users);
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_total_users() TO anon, authenticated;
