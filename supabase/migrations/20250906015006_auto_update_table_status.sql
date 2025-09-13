-- Create function to update table status based on reservation status
CREATE OR REPLACE FUNCTION update_table_status_on_reservation_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update table status for dine-in reservations that have a table_id
  IF NEW.table_id IS NOT NULL THEN
    
    -- When reservation is confirmed or seated, mark table as reserved/occupied
    IF NEW.status = 'confirmed' THEN
      UPDATE public.tables 
      SET status = 'reserved' 
      WHERE id = NEW.table_id;
      
    ELSIF NEW.status = 'seated' THEN
      UPDATE public.tables 
      SET status = 'occupied' 
      WHERE id = NEW.table_id;
      
    -- When reservation is cancelled or completed, check if table should be available
    ELSIF NEW.status IN ('cancelled', 'completed') THEN
      -- Check if there are any other active reservations for this table
      IF NOT EXISTS (
        SELECT 1 FROM public.reservations 
        WHERE table_id = NEW.table_id 
        AND status IN ('confirmed', 'seated') 
        AND id != NEW.id
      ) THEN
        -- No other active reservations, make table available
        UPDATE public.tables 
        SET status = 'available' 
        WHERE id = NEW.table_id;
      END IF;
    END IF;
    
  END IF;
  
  -- Handle status changes from previous states
  IF TG_OP = 'UPDATE' AND OLD.table_id IS NOT NULL THEN
    -- If the reservation was previously confirmed/seated but now cancelled/completed
    IF OLD.status IN ('confirmed', 'seated') AND NEW.status IN ('cancelled', 'completed') THEN
      -- Check if there are any other active reservations for the old table
      IF NOT EXISTS (
        SELECT 1 FROM public.reservations 
        WHERE table_id = OLD.table_id 
        AND status IN ('confirmed', 'seated') 
        AND id != NEW.id
      ) THEN
        -- No other active reservations, make table available
        UPDATE public.tables 
        SET status = 'available' 
        WHERE id = OLD.table_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on reservations table
DROP TRIGGER IF EXISTS trigger_update_table_status ON public.reservations;
CREATE TRIGGER trigger_update_table_status
  AFTER INSERT OR UPDATE OF status, table_id
  ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_table_status_on_reservation_change();

-- Create function to clean up table status when reservations are deleted
CREATE OR REPLACE FUNCTION cleanup_table_status_on_reservation_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- If the deleted reservation had a table and was active, check if table should be available
  IF OLD.table_id IS NOT NULL AND OLD.status IN ('confirmed', 'seated') THEN
    -- Check if there are any other active reservations for this table
    IF NOT EXISTS (
      SELECT 1 FROM public.reservations 
      WHERE table_id = OLD.table_id 
      AND status IN ('confirmed', 'seated')
    ) THEN
      -- No other active reservations, make table available
      UPDATE public.tables 
      SET status = 'available' 
      WHERE id = OLD.table_id;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for reservation deletion
DROP TRIGGER IF EXISTS trigger_cleanup_table_status ON public.reservations;
CREATE TRIGGER trigger_cleanup_table_status
  AFTER DELETE
  ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_table_status_on_reservation_delete();
