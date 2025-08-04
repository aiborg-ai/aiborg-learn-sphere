-- Insert the admin user profile manually
-- Note: This assumes the user will sign up through the regular auth flow first
-- We'll just prepare the role update for when they do sign up

-- First, let's check if we need to manually insert a profile
-- This query will be used to update the role once the user exists
DO $$
DECLARE
    admin_email TEXT := 'hirendra.vikram@aiborg.ai';
    user_exists BOOLEAN;
BEGIN
    -- Check if user already exists in auth.users (we can't directly insert there)
    -- For now, we'll just prepare the system for when this user signs up
    
    -- Create a trigger to automatically assign admin role to this specific email
    CREATE OR REPLACE FUNCTION assign_admin_role_to_hirendra()
    RETURNS TRIGGER AS $trigger$
    BEGIN
        -- Check if this is the specific admin email
        IF NEW.email = 'hirendra.vikram@aiborg.ai' THEN
            -- Update the profile role to admin when it gets created
            UPDATE public.profiles 
            SET role = 'admin' 
            WHERE user_id = NEW.user_id AND email = NEW.email;
        END IF;
        RETURN NEW;
    END;
    $trigger$ LANGUAGE plpgsql;

    -- Create trigger on profiles table to catch when Hirendra's profile is created
    DROP TRIGGER IF EXISTS auto_assign_admin_role ON public.profiles;
    CREATE TRIGGER auto_assign_admin_role
        AFTER INSERT ON public.profiles
        FOR EACH ROW
        EXECUTE FUNCTION assign_admin_role_to_hirendra();
        
END $$;