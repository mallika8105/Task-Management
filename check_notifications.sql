-- Check notifications for madhup73488@gmail.com
SELECT 
    n.id,
    n.title,
    n.message,
    n.created_at,
    n.is_read,
    NOW() as current_time,
    AGE(NOW(), n.created_at) as time_difference
FROM notifications n
JOIN users u ON n.recipient_id = u.id
WHERE u.email = 'madhup73488@gmail.com'
ORDER BY n.created_at DESC;
