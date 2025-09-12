-- Test ID generation function
SELECT generate_id_with_prefix('SRV') as next_service_id;
SELECT generate_id_with_prefix('TSK') as next_task_id;
SELECT generate_id_with_prefix('TIK') as next_ticket_id;
SELECT generate_id_with_prefix('PRS') as next_order_id;

-- Check existing services
SELECT id FROM services ORDER BY id;
