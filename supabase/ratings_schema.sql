-- Create ratings table
CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, book_id)
);

-- Enable RLS
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read all ratings" ON public.ratings
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own ratings" ON public.ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" ON public.ratings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" ON public.ratings
    FOR DELETE USING (auth.uid() = user_id);

-- Function to calculate average rating
CREATE OR REPLACE FUNCTION public.update_book_average_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating NUMERIC;
BEGIN
    SELECT AVG(rating) INTO avg_rating
    FROM public.ratings
    WHERE book_id = COALESCE(NEW.book_id, OLD.book_id);

    UPDATE public.books
    SET rating = COALESCE(ROUND(avg_rating, 1), 0)
    WHERE id = COALESCE(NEW.book_id, OLD.book_id);

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update average rating
DROP TRIGGER IF EXISTS on_rating_change ON public.ratings;
CREATE TRIGGER on_rating_change
AFTER INSERT OR UPDATE OR DELETE ON public.ratings
FOR EACH ROW EXECUTE FUNCTION public.update_book_average_rating();
