-- Trigger Function
CREATE OR REPLACE FUNCTION manage_pull_requests_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IN ('OPEN', 'MERGED') THEN
      UPDATE repository SET pull_requests_count = pull_requests_count + 1 WHERE id = NEW.repository_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IN ('OPEN', 'MERGED') AND NEW.status = 'CLOSED' THEN
      UPDATE repository SET pull_requests_count = pull_requests_count - 1 WHERE id = NEW.repository_id;
    ELSIF OLD.status = 'CLOSED' AND NEW.status IN ('OPEN', 'MERGED') THEN
      UPDATE repository SET pull_requests_count = pull_requests_count + 1 WHERE id = NEW.repository_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger Creation
CREATE TRIGGER trigger_manage_pr_count
AFTER INSERT OR UPDATE ON pull_request
FOR EACH ROW
EXECUTE FUNCTION manage_pull_requests_count();
-- Trigger Creation
CREATE TRIGGER trigger_increment_contributions
AFTER UPDATE ON pull_request
FOR EACH ROW
EXECUTE FUNCTION increment_user_contributions();-- Trigger Creation (Insert)
CREATE TRIGGER trigger_increment_forks_count
AFTER INSERT ON repository
FOR EACH ROW
EXECUTE FUNCTION increment_forks_count();-- Trigger Function (Delete)
CREATE OR REPLACE FUNCTION decrement_forks_count()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.parent_id IS NOT NULL THEN
    UPDATE repository SET forks_count = forks_count - 1 WHERE id = OLD.parent_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;-- Trigger Function (Insert)
CREATE OR REPLACE FUNCTION increment_forks_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    UPDATE repository SET forks_count = forks_count + 1 WHERE id = NEW.parent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger Creation (Insert)
CREATE TRIGGER trigger_increment_forks_count
AFTER INSERT ON repository
FOR EACH ROW
EXECUTE FUNCTION increment_forks_count();

-- Trigger Function (Delete)
CREATE OR REPLACE FUNCTION decrement_forks_count()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.parent_id IS NOT NULL THEN
    UPDATE repository SET forks_count = forks_count - 1 WHERE id = OLD.parent_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger Creation (Delete)
CREATE TRIGGER trigger_decrement_forks_count
AFTER DELETE ON repository
FOR EACH ROW
EXECUTE FUNCTION decrement_forks_count();