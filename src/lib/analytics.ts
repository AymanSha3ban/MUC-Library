import { supabase } from './supabaseClient';

export const analytics = {
    /**
     * Tracks a user visit.
     * If userId is provided, it links the visit to the user.
     * If not, it uses a stored visitor token or generates a new one.
     */
    trackVisit: async (userId?: string) => {
        try {
            const STORAGE_KEY = 'muc_library_visitor_token';
            let visitorToken = localStorage.getItem(STORAGE_KEY);

            if (!visitorToken) {
                visitorToken = crypto.randomUUID();
                localStorage.setItem(STORAGE_KEY, visitorToken);
            }

            // Prepare payload
            const payload: any = {
                last_visited_at: new Date().toISOString(),
            };

            if (userId) {
                payload.user_id = userId;
                // If we have a user ID, we prioritize that for uniqueness
                // We try to upsert based on user_id
                const { error } = await supabase
                    .from('library_visitors')
                    .upsert(payload, { onConflict: 'user_id' });

                if (error) console.error('Error tracking user visit:', error);
            } else {
                payload.visitor_token = visitorToken;
                // If anonymous, upsert based on visitor_token
                const { error } = await supabase
                    .from('library_visitors')
                    .upsert(payload, { onConflict: 'visitor_token' });

                if (error) console.error('Error tracking anonymous visit:', error);
            }

        } catch (err) {
            console.error('Analytics error:', err);
        }
    },

    /**
     * Gets the total number of unique users tracked.
     * Uses the get_total_users RPC function to get the count from auth.users.
     */
    getTotalUniqueUsers: async () => {
        const { data, error } = await supabase.rpc('get_total_users');

        if (error) {
            console.error('Error fetching total users:', error);
            return 0;
        }
        return data || 0;
    },

    /**
     * Gets book counts grouped by college/section.
     * Note: This requires fetching all books or using a more complex query/RPC.
     * For simplicity and performance on small datasets, we can fetch counts per college.
     */
    getBookCountsByCollege: async () => {
        // This is a bit heavy if we have thousands of books, but fine for hundreds.
        // A better approach would be an RPC function or a view.
        // Let's try to get counts via a grouped query if Supabase supports it easily,
        // otherwise we might need to fetch all and aggregate client side or make multiple count queries.

        // Alternative: Get all colleges, then for each, get count.
        const { data: colleges } = await supabase.from('colleges').select('id, name');
        if (!colleges) return {};

        const counts: Record<string, number> = {};

        // Parallel requests for speed
        await Promise.all(colleges.map(async (college) => {
            const { count } = await supabase
                .from('books')
                .select('*', { count: 'exact', head: true })
                .eq('college_id', college.id);
            counts[college.name] = count || 0;
        }));

        return counts;
    },

    /**
     * Gets count of books in a specific category (Department).
     */
    getCategoryBookCount: async (category: string, collegeId?: string) => {
        let query = supabase
            .from('books')
            .select('*', { count: 'exact', head: true })
            .ilike('category', category);

        if (collegeId && collegeId !== 'all') {
            query = query.eq('college_id', collegeId);
        }

        const { count, error } = await query;

        if (error) {
            console.error('Error fetching category count:', error);
            return 0;
        }
        return count || 0;
    }
};
