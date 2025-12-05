import { supabase } from './lib/supabase';

// Test Supabase connection
export async function testSupabaseConnection() {
    try {
        console.log('🔍 Testing Supabase connection...');

        // Test 1: Fetch projects
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .limit(5);

        if (projectsError) {
            console.error('❌ Error fetching projects:', projectsError);
            return false;
        }

        console.log('✅ Projects fetched:', projects?.length);
        console.log(projects);

        // Test 2: Fetch users
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .limit(5);

        if (usersError) {
            console.error('❌ Error fetching users:', usersError);
            return false;
        }

        console.log('✅ Users fetched:', users?.length);
        console.log(users);

        // Test 3: Check auth
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔐 Auth session:', session ? 'Active' : 'No session');

        console.log('✅ Supabase connection test passed!');
        return true;
    } catch (error) {
        console.error('❌ Supabase connection test failed:', error);
        return false;
    }
}
