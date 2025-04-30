-- Trigger Function
CREATE OR REPLACE FUNCTION increment_user_contributions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'MERGED' AND OLD.status IS DISTINCT FROM 'MERGED' THEN
    UPDATE users SET contribution_count = contribution_count + 1 WHERE id = NEW.author_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger Creation
CREATE TRIGGER trigger_increment_contributions
AFTER UPDATE ON pull_request
FOR EACH ROW
EXECUTE FUNCTION increment_user_contributions();


