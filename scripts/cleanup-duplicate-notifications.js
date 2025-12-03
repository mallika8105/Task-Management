const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDuplicateLoginNotifications() {
  console.log('Starting cleanup of duplicate login notifications...');
  
  try {
    // Fetch all user_login notifications
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', 'user_login')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching notifications:', fetchError);
      return;
    }

    console.log(`Found ${notifications.length} login notifications`);

    // Group by sender_id + recipient_id combination
    const grouped = {};
    notifications.forEach(notif => {
      const key = `${notif.sender_id}-${notif.recipient_id}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(notif);
    });

    // Delete duplicates, keep only the most recent
    let deletedCount = 0;
    for (const key in grouped) {
      const group = grouped[key];
      if (group.length > 1) {
        // Keep the first one (most recent), delete the rest
        const toDelete = group.slice(1);
        console.log(`Deleting ${toDelete.length} duplicate(s) for user combination: ${key}`);
        
        for (const notif of toDelete) {
          const { error: deleteError } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notif.id);
          
          if (deleteError) {
            console.error(`Error deleting notification ${notif.id}:`, deleteError);
          } else {
            deletedCount++;
            console.log(`Deleted notification ID: ${notif.id} (created at: ${notif.created_at})`);
          }
        }
      }
    }

    console.log(`\n✅ Cleanup complete! Deleted ${deletedCount} duplicate notification(s)`);
    
    // Show remaining notifications
    const { data: remaining } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', 'user_login')
      .order('created_at', { ascending: false });
    
    console.log(`\nRemaining login notifications: ${remaining.length}`);
    remaining.forEach(notif => {
      console.log(`  - ID: ${notif.id}, Created: ${notif.created_at}`);
    });

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

cleanupDuplicateLoginNotifications();
