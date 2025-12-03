import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Missing Supabase credentials" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting cleanup of duplicate login notifications...');

    // Fetch all user_login notifications
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', 'user_login')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching notifications:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch notifications', details: fetchError },
        { status: 500 }
      );
    }

    console.log(`Found ${notifications.length} login notifications`);

    // Group by sender_id + recipient_id combination
    const grouped: { [key: string]: any[] } = {};
    notifications.forEach(notif => {
      const key = `${notif.sender_id}-${notif.recipient_id}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(notif);
    });

    // Delete duplicates, keep only the most recent
    let deletedCount = 0;
    const deletedIds: string[] = [];

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
            deletedIds.push(notif.id);
            console.log(`Deleted notification ID: ${notif.id} (created at: ${notif.created_at})`);
          }
        }
      }
    }

    // Get remaining notifications
    const { data: remaining } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', 'user_login')
      .order('created_at', { ascending: false });

    return NextResponse.json({
      success: true,
      message: `Cleanup complete! Deleted ${deletedCount} duplicate notification(s)`,
      deletedCount,
      deletedIds,
      remainingCount: remaining?.length || 0,
      remaining: remaining || []
    });

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}
