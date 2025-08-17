-- Final fix for the column ambiguity in reserve_credits function
CREATE OR REPLACE FUNCTION app.reserve_credits(
  p_user uuid, p_request uuid, p_action text, p_cost int
)
RETURNS TABLE (balance int) AS $$
DECLARE new_balance int;
BEGIN
  INSERT INTO credits_ledger(user_id, request_id, action, amount, status)
  VALUES (p_user, p_request, p_action, -p_cost, 'reserved');

  UPDATE user_credits uc
  SET balance = uc.balance - p_cost, updated_at = now()
  WHERE uc.user_id = p_user AND uc.balance >= p_cost
  RETURNING uc.balance INTO new_balance;

  IF new_balance IS NULL THEN
    DELETE FROM credits_ledger WHERE user_id = p_user AND request_id = p_request;
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
  END IF;

  RETURN QUERY SELECT new_balance;
EXCEPTION WHEN unique_violation THEN
  RETURN QUERY SELECT uc.balance FROM user_credits uc WHERE uc.user_id = p_user;
END;
$$ LANGUAGE plpgsql;

-- Test the fixed function
SELECT 'Testing fixed reserve_credits function' as test_name,
       app.reserve_credits('00000000-0000-0000-0000-000000000000'::uuid, 
                          '00000000-0000-0000-0000-000000000000'::uuid, 
                          'test', 1) as result;
