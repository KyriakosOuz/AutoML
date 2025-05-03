
-- Create the user_feedback table
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responses JSONB NOT NULL, -- Stores all 10 question responses
  sus_score NUMERIC(5,2) NOT NULL, -- Calculated SUS score (0-100)
  additional_comments TEXT, -- Optional user comments
  
  -- Ensure user_id is indexed for performance
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add RLS policies
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to create their own feedback
CREATE POLICY insert_own_feedback 
  ON public.user_feedback 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to read only their own feedback
CREATE POLICY read_own_feedback 
  ON public.user_feedback 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Policy for admins to read all feedback (replace 'admin' with your admin role)
-- CREATE POLICY admin_read_all_feedback 
--  ON public.user_feedback 
--  FOR SELECT 
--  TO authenticated 
--  USING (auth.jwt() ->> 'role' = 'admin');

-- Grant necessary permissions
GRANT ALL ON public.user_feedback TO authenticated;
