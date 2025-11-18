# Supabase Setup Guide - VejSkilt Platform

**Formål**: Denne guide indeholder alle SQL queries og konfiguration til at sætte VejSkilt databasen op i Supabase.

**Når at køre**: Efter du har oprettet dit Supabase projekt (i weekenden).

---

## Prerequisites

1. ✅ Opret Supabase konto på https://supabase.com
2. ✅ Opret nyt projekt:
   - Project name: `vejskilt-platform` (eller dit valg)
   - Database password: (gem sikkert!)
   - Region: `Europe (Frankfurt)` eller `Europe (Ireland)` (tæt på Danmark)
3. ✅ Notér:
   - Project URL: `https://xxxxx.supabase.co`
   - `anon` public key
   - `service_role` secret key (ALDRIG commit til Git!)

---

## Step 1: Run Migrations

Kør følgende SQL scripts i **SQL Editor** i Supabase Dashboard (https://app.supabase.com/project/YOUR_PROJECT/sql)

### Migration 1: Core Tables

```sql
-- =====================================================
-- VejSkilt Platform - Migration 1: Core Tables
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "earthdistance" CASCADE; -- For spatial queries

-- =====================================================
-- TABLE: organizations
-- =====================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('kommune', 'entreprenor')),

  -- Contact info
  cvr_number TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address TEXT,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_is_active ON organizations(is_active);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLE: users (extends auth.users)
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Organization relationship
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Profile info
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,

  -- Role & permissions
  role TEXT NOT NULL CHECK (role IN ('kommune', 'entreprenor', 'politi')),

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- Updated_at trigger
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLE: applications
-- =====================================================
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  organization_id UUID NOT NULL REFERENCES organizations(id),
  created_by UUID NOT NULL REFERENCES users(id),
  approved_by UUID REFERENCES users(id),

  -- Application details
  application_number TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,

  -- Location
  address TEXT NOT NULL,
  municipality TEXT NOT NULL,

  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Status workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected', 'active', 'completed', 'cancelled')
  ),

  -- Approval
  reviewed_at TIMESTAMPTZ,
  review_comment TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT approved_by_required CHECK (
    (status NOT IN ('approved', 'rejected')) OR (approved_by IS NOT NULL)
  )
);

-- Auto-generate application number
CREATE OR REPLACE FUNCTION generate_application_number()
RETURNS TRIGGER AS $$
DECLARE
  year TEXT;
  sequence_num TEXT;
BEGIN
  IF NEW.application_number IS NOT NULL THEN
    RETURN NEW;
  END IF;

  year := TO_CHAR(NEW.created_at, 'YYYY');

  SELECT LPAD((COUNT(*) + 1)::TEXT, 6, '0')
  INTO sequence_num
  FROM applications
  WHERE TO_CHAR(created_at, 'YYYY') = year;

  NEW.application_number := 'ANS-' || year || '-' || sequence_num;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_application_number
  BEFORE INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION generate_application_number();

-- Indexes
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_organization ON applications(organization_id);
CREATE INDEX idx_applications_created_by ON applications(created_by);
CREATE INDEX idx_applications_dates ON applications(start_date, end_date);
CREATE INDEX idx_applications_number ON applications(application_number);

-- Updated_at trigger
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLE: signs
-- =====================================================
CREATE TABLE signs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,

  -- Sign details
  sign_type TEXT NOT NULL,

  -- Location (planned)
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  placement_description TEXT,

  -- QR Code
  qr_code TEXT UNIQUE,
  qr_generated_at TIMESTAMPTZ DEFAULT now(),

  -- Mounting info
  status TEXT NOT NULL DEFAULT 'not_mounted' CHECK (
    status IN ('not_mounted', 'mounted', 'removed')
  ),
  mounted_at TIMESTAMPTZ,
  mounted_by UUID REFERENCES users(id),
  mounted_latitude DOUBLE PRECISION,
  mounted_longitude DOUBLE PRECISION,

  -- Removal info
  removed_at TIMESTAMPTZ,
  removed_by UUID REFERENCES users(id),
  removed_latitude DOUBLE PRECISION,
  removed_longitude DOUBLE PRECISION,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT mounted_data_check CHECK (
    (status != 'mounted') OR (
      mounted_at IS NOT NULL AND
      mounted_by IS NOT NULL AND
      mounted_latitude IS NOT NULL AND
      mounted_longitude IS NOT NULL
    )
  ),
  CONSTRAINT removed_data_check CHECK (
    (status != 'removed') OR (
      removed_at IS NOT NULL AND
      removed_by IS NOT NULL
    )
  )
);

-- Auto-generate QR code
CREATE OR REPLACE FUNCTION generate_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.qr_code IS NOT NULL THEN
    RETURN NEW;
  END IF;

  NEW.qr_code := 'VS-' ||
                 TO_CHAR(NEW.created_at, 'YYYY') || '-' ||
                 UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NEW.id::TEXT) FROM 1 FOR 9));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_qr_code
  BEFORE INSERT ON signs
  FOR EACH ROW
  EXECUTE FUNCTION generate_qr_code();

-- Indexes
CREATE INDEX idx_signs_application ON signs(application_id);
CREATE INDEX idx_signs_status ON signs(status);
CREATE INDEX idx_signs_qr_code ON signs(qr_code);

-- Spatial index for location queries
CREATE INDEX idx_signs_location ON signs
  USING GIST (ll_to_earth(latitude, longitude));

-- Updated_at trigger
CREATE TRIGGER update_signs_updated_at
  BEFORE UPDATE ON signs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLE: attachments
-- =====================================================
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships (one must be set)
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  sign_id UUID REFERENCES signs(id) ON DELETE CASCADE,

  -- File info
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,

  -- Categorization
  attachment_type TEXT NOT NULL CHECK (
    attachment_type IN (
      'application_drawing',
      'application_document',
      'mounted_photo',
      'removed_photo'
    )
  ),

  -- Metadata
  uploaded_by UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT one_parent_required CHECK (
    (application_id IS NOT NULL AND sign_id IS NULL) OR
    (application_id IS NULL AND sign_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_attachments_application ON attachments(application_id);
CREATE INDEX idx_attachments_sign ON attachments(sign_id);
CREATE INDEX idx_attachments_type ON attachments(attachment_type);

-- =====================================================
-- TABLE: logs (audit trail)
-- =====================================================
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What happened
  entity_type TEXT NOT NULL CHECK (
    entity_type IN ('application', 'sign', 'user', 'organization')
  ),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,

  -- Who did it
  user_id UUID REFERENCES users(id),
  user_role TEXT,

  -- Details
  description TEXT,
  metadata JSONB,

  -- When
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_logs_entity ON logs(entity_type, entity_id);
CREATE INDEX idx_logs_user ON logs(user_id);
CREATE INDEX idx_logs_created_at ON logs(created_at DESC);
CREATE INDEX idx_logs_metadata ON logs USING GIN(metadata);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 1 completed successfully!';
  RAISE NOTICE 'Next step: Run Migration 2 (RLS Policies)';
END $$;
```

### Migration 2: Row Level Security (RLS) Policies

```sql
-- =====================================================
-- VejSkilt Platform - Migration 2: RLS Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ORGANIZATIONS POLICIES
-- =====================================================

-- Users can see their own organization
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Kommune users can see all organizations
CREATE POLICY "Kommune can view all organizations"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'kommune'
    )
  );

-- =====================================================
-- USERS POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Kommune users can see all users
CREATE POLICY "Kommune can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'kommune'
    )
  );

-- =====================================================
-- APPLICATIONS POLICIES
-- =====================================================

-- Entreprenør can view their organization's applications
CREATE POLICY "Entreprenor can view own applications"
  ON applications FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Entreprenør can create applications for their organization
CREATE POLICY "Entreprenor can create applications"
  ON applications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'entreprenor'
      AND users.organization_id = organization_id
    )
  );

-- Entreprenør can update their own pending applications
CREATE POLICY "Entreprenor can update own pending applications"
  ON applications FOR UPDATE
  USING (
    status = 'pending'
    AND organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Kommune can view all applications
CREATE POLICY "Kommune can view all applications"
  ON applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'kommune'
    )
  );

-- Kommune can update applications (approve/reject)
CREATE POLICY "Kommune can update applications"
  ON applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'kommune'
    )
  );

-- Politi can view approved/active applications
CREATE POLICY "Politi can view approved applications"
  ON applications FOR SELECT
  USING (
    status IN ('approved', 'active', 'completed')
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'politi'
    )
  );

-- =====================================================
-- SIGNS POLICIES
-- =====================================================

-- Users can view signs from accessible applications
CREATE POLICY "Users can view signs from accessible applications"
  ON signs FOR SELECT
  USING (
    application_id IN (
      SELECT id FROM applications
      -- This leverages existing application policies
    )
  );

-- Signs are auto-created when application is approved (via triggers)
-- So no INSERT policy needed for regular users

-- Entreprenør can update their organization's signs (mount/remove)
CREATE POLICY "Entreprenor can update own signs"
  ON signs FOR UPDATE
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN users u ON u.organization_id = a.organization_id
      WHERE u.id = auth.uid()
    )
  );

-- =====================================================
-- ATTACHMENTS POLICIES
-- =====================================================

-- Users can view attachments for accessible applications/signs
CREATE POLICY "Users can view attachments"
  ON attachments FOR SELECT
  USING (
    (application_id IS NOT NULL AND application_id IN (
      SELECT id FROM applications
    )) OR
    (sign_id IS NOT NULL AND sign_id IN (
      SELECT id FROM signs
    ))
  );

-- Users can upload attachments for their applications/signs
CREATE POLICY "Users can upload attachments"
  ON attachments FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND (
      (application_id IS NOT NULL AND application_id IN (
        SELECT id FROM applications
      )) OR
      (sign_id IS NOT NULL AND sign_id IN (
        SELECT id FROM signs
      ))
    )
  );

-- =====================================================
-- LOGS POLICIES
-- =====================================================

-- Kommune can view all logs
CREATE POLICY "Kommune can view all logs"
  ON logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'kommune'
    )
  );

-- Users can view logs for their own entities
CREATE POLICY "Users can view own entity logs"
  ON logs FOR SELECT
  USING (
    user_id = auth.uid() OR
    (entity_type = 'application' AND entity_id IN (
      SELECT id FROM applications
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    ))
  );

-- System can insert logs (via triggers)
CREATE POLICY "System can insert logs"
  ON logs FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 2 completed successfully!';
  RAISE NOTICE 'Next step: Run Migration 3 (Triggers & Functions)';
END $$;
```

### Migration 3: Triggers & Functions

```sql
-- =====================================================
-- VejSkilt Platform - Migration 3: Triggers & Functions
-- =====================================================

-- =====================================================
-- AUDIT LOGGING
-- =====================================================

-- Function to automatically log changes
CREATE OR REPLACE FUNCTION log_change()
RETURNS TRIGGER AS $$
DECLARE
  user_role_val TEXT;
BEGIN
  -- Get user role (might be NULL for system operations)
  SELECT role INTO user_role_val
  FROM users
  WHERE id = auth.uid();

  -- Insert log entry
  INSERT INTO logs (
    entity_type,
    entity_id,
    action,
    user_id,
    user_role,
    description,
    metadata
  )
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    LOWER(TG_OP),
    auth.uid(),
    user_role_val,
    CASE
      WHEN TG_OP = 'INSERT' THEN 'Created ' || TG_TABLE_NAME
      WHEN TG_OP = 'UPDATE' THEN 'Updated ' || TG_TABLE_NAME
      WHEN TG_OP = 'DELETE' THEN 'Deleted ' || TG_TABLE_NAME
    END,
    jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach logging to tables
CREATE TRIGGER applications_log_changes
  AFTER INSERT OR UPDATE OR DELETE ON applications
  FOR EACH ROW EXECUTE FUNCTION log_change();

CREATE TRIGGER signs_log_changes
  AFTER INSERT OR UPDATE OR DELETE ON signs
  FOR EACH ROW EXECUTE FUNCTION log_change();

-- =====================================================
-- UPDATE APPLICATION STATUS BASED ON SIGNS
-- =====================================================

-- When a sign is mounted, update application status to 'active'
CREATE OR REPLACE FUNCTION update_application_status_on_mount()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'mounted' AND (OLD.status IS NULL OR OLD.status != 'mounted') THEN
    UPDATE applications
    SET status = 'active'
    WHERE id = NEW.application_id
      AND status = 'approved';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sign_mounted_update_application
  AFTER UPDATE ON signs
  FOR EACH ROW
  EXECUTE FUNCTION update_application_status_on_mount();

-- When all signs are removed, update application to 'completed'
CREATE OR REPLACE FUNCTION check_application_completion()
RETURNS TRIGGER AS $$
DECLARE
  remaining_signs INTEGER;
BEGIN
  -- Count signs that are not yet removed
  SELECT COUNT(*)
  INTO remaining_signs
  FROM signs
  WHERE application_id = NEW.application_id
    AND status != 'removed';

  -- If no remaining signs, mark application as completed
  IF remaining_signs = 0 THEN
    UPDATE applications
    SET status = 'completed'
    WHERE id = NEW.application_id
      AND status = 'active';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sign_removed_check_completion
  AFTER UPDATE ON signs
  FOR EACH ROW
  WHEN (NEW.status = 'removed')
  EXECUTE FUNCTION check_application_completion();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get application statistics
CREATE OR REPLACE FUNCTION get_application_stats(org_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'pending', COUNT(*) FILTER (WHERE status = 'pending'),
    'approved', COUNT(*) FILTER (WHERE status = 'approved'),
    'rejected', COUNT(*) FILTER (WHERE status = 'rejected'),
    'active', COUNT(*) FILTER (WHERE status = 'active'),
    'completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'cancelled', COUNT(*) FILTER (WHERE status = 'cancelled')
  )
  INTO result
  FROM applications
  WHERE org_id IS NULL OR organization_id = org_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Get overdue signs
CREATE OR REPLACE FUNCTION get_overdue_signs()
RETURNS TABLE (
  sign_id UUID,
  application_id UUID,
  application_number TEXT,
  end_date DATE,
  days_overdue INTEGER,
  organization_name TEXT,
  sign_type TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    a.id,
    a.application_number,
    a.end_date,
    (CURRENT_DATE - a.end_date)::INTEGER,
    o.name,
    s.sign_type,
    s.mounted_latitude,
    s.mounted_longitude
  FROM signs s
  JOIN applications a ON s.application_id = a.id
  JOIN organizations o ON a.organization_id = o.id
  WHERE s.status = 'mounted'
    AND a.end_date < CURRENT_DATE
  ORDER BY (CURRENT_DATE - a.end_date) DESC;
END;
$$ LANGUAGE plpgsql;

-- Calculate distance between two GPS points (in meters)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
BEGIN
  -- Using earth_distance with ll_to_earth
  RETURN earth_distance(
    ll_to_earth(lat1, lon1),
    ll_to_earth(lat2, lon2)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 3 completed successfully!';
  RAISE NOTICE 'Next step: Run Migration 4 (Views)';
END $$;
```

### Migration 4: Views

```sql
-- =====================================================
-- VejSkilt Platform - Migration 4: Views
-- =====================================================

-- =====================================================
-- VIEW: Active Signs with Details
-- =====================================================
CREATE OR REPLACE VIEW active_signs_with_details AS
SELECT
  s.id AS sign_id,
  s.sign_type,
  s.latitude AS planned_latitude,
  s.longitude AS planned_longitude,
  s.mounted_latitude,
  s.mounted_longitude,
  s.status,
  s.mounted_at,
  s.qr_code,
  a.id AS application_id,
  a.application_number,
  a.title AS application_title,
  a.address,
  a.start_date,
  a.end_date,
  o.id AS organization_id,
  o.name AS organization_name,
  o.type AS organization_type,
  u.id AS mounted_by_id,
  u.full_name AS mounted_by_name,
  CASE
    WHEN a.end_date < CURRENT_DATE THEN true
    ELSE false
  END AS is_overdue,
  (CURRENT_DATE - a.end_date)::INTEGER AS days_overdue
FROM signs s
JOIN applications a ON s.application_id = a.id
JOIN organizations o ON a.organization_id = o.id
LEFT JOIN users u ON s.mounted_by = u.id
WHERE s.status = 'mounted';

-- =====================================================
-- VIEW: Application Summary
-- =====================================================
CREATE OR REPLACE VIEW application_summary AS
SELECT
  a.id,
  a.application_number,
  a.title,
  a.description,
  a.address,
  a.municipality,
  a.status,
  a.start_date,
  a.end_date,
  a.review_comment,
  a.created_at,
  a.reviewed_at,
  o.id AS organization_id,
  o.name AS organization_name,
  o.type AS organization_type,
  creator.id AS created_by_id,
  creator.full_name AS created_by_name,
  creator.email AS created_by_email,
  approver.id AS approved_by_id,
  approver.full_name AS approved_by_name,
  COUNT(s.id) AS total_signs,
  COUNT(s.id) FILTER (WHERE s.status = 'not_mounted') AS not_mounted_signs,
  COUNT(s.id) FILTER (WHERE s.status = 'mounted') AS mounted_signs,
  COUNT(s.id) FILTER (WHERE s.status = 'removed') AS removed_signs,
  CASE
    WHEN a.end_date < CURRENT_DATE AND a.status = 'active' THEN true
    ELSE false
  END AS is_overdue
FROM applications a
JOIN organizations o ON a.organization_id = o.id
JOIN users creator ON a.created_by = creator.id
LEFT JOIN users approver ON a.approved_by = approver.id
LEFT JOIN signs s ON a.id = s.application_id
GROUP BY
  a.id,
  o.id, o.name, o.type,
  creator.id, creator.full_name, creator.email,
  approver.id, approver.full_name;

-- =====================================================
-- VIEW: Sign History (for audit trail display)
-- =====================================================
CREATE OR REPLACE VIEW sign_history AS
SELECT
  s.id AS sign_id,
  s.qr_code,
  s.sign_type,
  s.application_id,
  a.application_number,
  -- Created
  s.created_at,
  -- Mounted
  s.mounted_at,
  s.mounted_by,
  mounted_user.full_name AS mounted_by_name,
  s.mounted_latitude,
  s.mounted_longitude,
  -- Removed
  s.removed_at,
  s.removed_by,
  removed_user.full_name AS removed_by_name,
  s.removed_latitude,
  s.removed_longitude,
  -- Status
  s.status
FROM signs s
JOIN applications a ON s.application_id = a.id
LEFT JOIN users mounted_user ON s.mounted_by = mounted_user.id
LEFT JOIN users removed_user ON s.removed_by = removed_user.id;

-- =====================================================
-- VIEW: Organization Statistics
-- =====================================================
CREATE OR REPLACE VIEW organization_statistics AS
SELECT
  o.id AS organization_id,
  o.name AS organization_name,
  o.type AS organization_type,
  COUNT(DISTINCT a.id) AS total_applications,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'pending') AS pending_applications,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'approved') AS approved_applications,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'active') AS active_applications,
  COUNT(DISTINCT s.id) AS total_signs,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'mounted') AS mounted_signs,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'removed') AS removed_signs
FROM organizations o
LEFT JOIN applications a ON o.id = a.organization_id
LEFT JOIN signs s ON a.id = s.application_id
GROUP BY o.id, o.name, o.type;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 4 completed successfully!';
  RAISE NOTICE 'Next step: Setup Storage Buckets';
END $$;
```

---

## Step 2: Setup Storage Buckets

Go to **Storage** in Supabase Dashboard and run:

```sql
-- =====================================================
-- Storage Bucket for Attachments
-- =====================================================

-- Create bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Storage Policies
-- =====================================================

-- Users can upload attachments
CREATE POLICY "Users can upload to attachments bucket"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attachments' AND
  auth.uid() IS NOT NULL
);

-- Users can view attachments they have access to
CREATE POLICY "Users can view attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'attachments' AND
  auth.uid() IS NOT NULL
);

-- Users can delete their own uploads
CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- SUCCESS
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Storage bucket created successfully!';
END $$;
```

---

## Step 3: Create Test Data (Optional - for development)

```sql
-- =====================================================
-- Test Data for Development
-- =====================================================

-- 1. Create test organization (Kommune)
INSERT INTO organizations (name, type, contact_email, cvr_number)
VALUES ('København Kommune', 'kommune', 'kontakt@kk.dk', '12345678')
ON CONFLICT DO NOTHING;

-- 2. Create test organization (Entreprenør)
INSERT INTO organizations (name, type, contact_email, cvr_number)
VALUES ('Byggefirma A/S', 'entreprenor', 'info@byggefirma.dk', '87654321')
ON CONFLICT DO NOTHING;

-- 3. Create test organization (Politi)
INSERT INTO organizations (name, type, contact_email)
VALUES ('København Politi', 'politi', 'info@politi.dk')
ON CONFLICT DO NOTHING;

-- Note: Users will be created via Supabase Auth signup
-- After signup, you manually link them to organizations by updating the users table

-- =====================================================
-- Query to check test data
-- =====================================================
SELECT * FROM organizations;

-- =====================================================
-- SUCCESS
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Test data inserted successfully!';
  RAISE NOTICE 'Next: Create users via app signup';
END $$;
```

---

## Step 4: Configure Authentication

### Email Templates

Go to **Authentication > Email Templates** in Supabase Dashboard:

#### Confirmation Email (Danish)
```
Hej {{ .Email }},

Bekræft din email-adresse ved at klikke på linket nedenfor:

{{ .ConfirmationURL }}

Hvis du ikke har oprettet en konto på VejSkilt Platformen, kan du ignorere denne email.

Med venlig hilsen,
VejSkilt Platformen
```

#### Reset Password (Danish)
```
Hej,

Du har anmodet om at nulstille din adgangskode til VejSkilt Platformen.

Klik på linket nedenfor for at nulstille din adgangskode:

{{ .ConfirmationURL }}

Hvis du ikke har anmodet om dette, kan du ignorere denne email.

Med venlig hilsen,
VejSkilt Platformen
```

### Authentication Settings

In **Authentication > Settings**:

1. **Site URL**: `http://localhost:3000` (dev) eller `https://yourdomain.com` (prod)
2. **Redirect URLs**:
   - `http://localhost:3000/**`
   - `https://yourdomain.com/**`
3. **Email Auth**: Enabled
4. **Confirm email**: Enabled (for production, disabled for dev)
5. **Secure password**: Min 8 characters, require uppercase, number

---

## Step 5: Environment Variables

Add til `.env.local` i dit Next.js projekt:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Dataforsyningen
NEXT_PUBLIC_DATAFORSYNINGEN_TOKEN=your_token_here
```

Add til `.gitignore`:
```
.env.local
.env.production
```

---

## Step 6: Verify Setup

Run these queries to verify everything works:

```sql
-- Check all tables exist
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Check functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION';

-- Check views exist
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public';

-- Check triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

Expected results:
- 6 tables: organizations, users, applications, signs, attachments, logs
- All tables have RLS enabled
- 6+ functions
- 4 views
- 5+ triggers

---

## Step 7: First User Setup

### Create your first Kommune user:

1. Go to **Authentication > Users** i Supabase Dashboard
2. Click **Add user**
3. Enter email + password
4. **IMPORTANT**: After user is created, go to **SQL Editor** and run:

```sql
-- Link user to Kommune organization
INSERT INTO users (id, organization_id, full_name, email, role)
VALUES (
  'USER_UUID_FROM_AUTH_USERS', -- Replace with actual UUID
  (SELECT id FROM organizations WHERE name = 'København Kommune'),
  'Test Kommune Admin',
  'test@kk.dk',
  'kommune'
);
```

### Create your first Entreprenør user:

Same process, but use `role = 'entreprenor'` and link to entreprenør organization.

---

## Troubleshooting

### Error: "new row violates row-level security policy"
**Problem**: RLS policies are blocking your query.

**Solution**:
- Check you're logged in as the right user
- Verify the user's role in `users` table
- Test policies with `EXPLAIN (ANALYZE, VERBOSE, BUFFERS)` before your query

### Error: "relation does not exist"
**Problem**: Table not created or wrong schema.

**Solution**:
- Verify you ran all migrations in order
- Check `public` schema: `SET search_path TO public;`

### Error: "permission denied for function"
**Problem**: Function missing `SECURITY DEFINER` or RLS blocking.

**Solution**:
- Add `SECURITY DEFINER` to function definition
- Grant execute permissions: `GRANT EXECUTE ON FUNCTION function_name TO authenticated;`

---

## Backup Strategy

### Automatic Backups (Supabase Pro)
- Daily backups (7 days retention)
- Point-in-time recovery

### Manual Backup
```bash
# Dump database
pg_dump -h db.xxxxx.supabase.co -U postgres -d postgres > backup.sql

# Restore
psql -h db.xxxxx.supabase.co -U postgres -d postgres < backup.sql
```

---

## Next Steps

1. ✅ Run all migrations in Supabase SQL Editor
2. ✅ Setup storage buckets
3. ✅ Configure authentication settings
4. ✅ Create test organizations
5. ✅ Create first users
6. ✅ Add environment variables to your project
7. 🚀 Start building the frontend!

---

## Useful Queries for Development

### Check application flow
```sql
SELECT
  a.application_number,
  a.status,
  o.name AS organization,
  COUNT(s.id) AS total_signs,
  COUNT(s.id) FILTER (WHERE s.status = 'mounted') AS mounted
FROM applications a
JOIN organizations o ON a.organization_id = o.id
LEFT JOIN signs s ON a.id = s.application_id
GROUP BY a.id, o.name
ORDER BY a.created_at DESC;
```

### See recent activity
```sql
SELECT
  l.created_at,
  l.entity_type,
  l.action,
  u.full_name AS user_name,
  l.description
FROM logs l
LEFT JOIN users u ON l.user_id = u.id
ORDER BY l.created_at DESC
LIMIT 20;
```

### Find overdue signs
```sql
SELECT * FROM get_overdue_signs();
```

---

**Status**: 🚀 Ready to deploy
**Last Updated**: 2025-11-14
