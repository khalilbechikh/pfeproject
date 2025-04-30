-- Trigger Function (Insert)
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
