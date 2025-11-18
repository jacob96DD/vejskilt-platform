-- =====================================================
-- VejSkilt Platform - KOMPLET DATABASE SETUP
-- =====================================================
-- Kør denne SQL i Supabase SQL Editor
-- Dette sætter HELE databasen op i ét kald
-- =====================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "earthdistance" CASCADE;

-- =====================================================
-- TABLES
-- =====================================================

-- TABLE: organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('kommune', 'entreprenor')),
  cvr_number TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_is_active ON organizations(is_active);

-- TABLE: users
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('kommune', 'entreprenor', 'politi')),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- TABLE: applications
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  created_by UUID NOT NULL REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  application_number TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  municipality TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected', 'active', 'completed', 'cancelled')
  ),
  reviewed_at TIMESTAMPTZ,
  review_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT approved_by_required CHECK (
    (status NOT IN ('approved', 'rejected')) OR (approved_by IS NOT NULL)
  )
);

CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_organization ON applications(organization_id);
CREATE INDEX idx_applications_created_by ON applications(created_by);
CREATE INDEX idx_applications_dates ON applications(start_date, end_date);
CREATE INDEX idx_applications_number ON applications(application_number);

-- TABLE: signs
CREATE TABLE signs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  sign_type TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  placement_description TEXT,
  qr_code TEXT UNIQUE,
  qr_generated_at TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'not_mounted' CHECK (
    status IN ('not_mounted', 'mounted', 'removed')
  ),
  mounted_at TIMESTAMPTZ,
  mounted_by UUID REFERENCES users(id),
  mounted_latitude DOUBLE PRECISION,
  mounted_longitude DOUBLE PRECISION,
  removed_at TIMESTAMPTZ,
  removed_by UUID REFERENCES users(id),
  removed_latitude DOUBLE PRECISION,
  removed_longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
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

CREATE INDEX idx_signs_application ON signs(application_id);
CREATE INDEX idx_signs_status ON signs(status);
CREATE INDEX idx_signs_qr_code ON signs(qr_code);
CREATE INDEX idx_signs_location ON signs USING GIST (ll_to_earth(latitude, longitude));

-- TABLE: attachments
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  sign_id UUID REFERENCES signs(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  attachment_type TEXT NOT NULL CHECK (
    attachment_type IN (
      'application_drawing',
      'application_document',
      'mounted_photo',
      'removed_photo'
    )
  ),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT one_parent_required CHECK (
    (application_id IS NOT NULL AND sign_id IS NULL) OR
    (application_id IS NULL AND sign_id IS NOT NULL)
  )
);

CREATE INDEX idx_attachments_application ON attachments(application_id);
CREATE INDEX idx_attachments_sign ON attachments(sign_id);
CREATE INDEX idx_attachments_type ON attachments(attachment_type);

-- TABLE: logs
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (
    entity_type IN ('application', 'sign', 'user', 'organization')
  ),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  user_role TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_logs_entity ON logs(entity_type, entity_id);
CREATE INDEX idx_logs_user ON logs(user_id);
CREATE INDEX idx_logs_created_at ON logs(created_at DESC);
CREATE INDEX idx_logs_metadata ON logs USING GIN(metadata);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_signs_updated_at
  BEFORE UPDATE ON signs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Generate application number
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

-- Function: Generate QR code
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

-- Function: Log changes
CREATE OR REPLACE FUNCTION log_change()
RETURNS TRIGGER AS $$
DECLARE
  user_role_val TEXT;
BEGIN
  SELECT role INTO user_role_val
  FROM users
  WHERE id = auth.uid();

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

CREATE TRIGGER applications_log_changes
  AFTER INSERT OR UPDATE OR DELETE ON applications
  FOR EACH ROW EXECUTE FUNCTION log_change();

CREATE TRIGGER signs_log_changes
  AFTER INSERT OR UPDATE OR DELETE ON signs
  FOR EACH ROW EXECUTE FUNCTION log_change();

-- Function: Update application status on mount
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

-- Function: Check application completion
CREATE OR REPLACE FUNCTION check_application_completion()
RETURNS TRIGGER AS $$
DECLARE
  remaining_signs INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO remaining_signs
  FROM signs
  WHERE application_id = NEW.application_id
    AND status != 'removed';

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

-- Function: Get application statistics
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

-- Function: Get overdue signs
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

-- Function: Calculate distance
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
BEGIN
  RETURN earth_distance(
    ll_to_earth(lat1, lon1),
    ll_to_earth(lat2, lon2)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- VIEWS
-- =====================================================

-- VIEW: Active signs with details
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

-- VIEW: Application summary
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

-- VIEW: Sign history
CREATE OR REPLACE VIEW sign_history AS
SELECT
  s.id AS sign_id,
  s.qr_code,
  s.sign_type,
  s.application_id,
  a.application_number,
  s.created_at,
  s.mounted_at,
  s.mounted_by,
  mounted_user.full_name AS mounted_by_name,
  s.mounted_latitude,
  s.mounted_longitude,
  s.removed_at,
  s.removed_by,
  removed_user.full_name AS removed_by_name,
  s.removed_latitude,
  s.removed_longitude,
  s.status
FROM signs s
JOIN applications a ON s.application_id = a.id
LEFT JOIN users mounted_user ON s.mounted_by = mounted_user.id
LEFT JOIN users removed_user ON s.removed_by = removed_user.id;

-- VIEW: Organization statistics
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
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- ORGANIZATIONS POLICIES
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Kommune can view all organizations"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'kommune'
    )
  );

-- USERS POLICIES
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Kommune can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'kommune'
    )
  );

-- APPLICATIONS POLICIES
CREATE POLICY "Entreprenor can view own applications"
  ON applications FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

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

CREATE POLICY "Entreprenor can update own pending applications"
  ON applications FOR UPDATE
  USING (
    status = 'pending'
    AND organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Kommune can view all applications"
  ON applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'kommune'
    )
  );

CREATE POLICY "Kommune can update applications"
  ON applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'kommune'
    )
  );

CREATE POLICY "Politi can view approved applications"
  ON applications FOR SELECT
  USING (
    status IN ('approved', 'active', 'completed')
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'politi'
    )
  );

-- SIGNS POLICIES
CREATE POLICY "Users can view signs from accessible applications"
  ON signs FOR SELECT
  USING (
    application_id IN (
      SELECT id FROM applications
    )
  );

CREATE POLICY "Entreprenor can update own signs"
  ON signs FOR UPDATE
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN users u ON u.organization_id = a.organization_id
      WHERE u.id = auth.uid()
    )
  );

-- ATTACHMENTS POLICIES
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

-- LOGS POLICIES
CREATE POLICY "Kommune can view all logs"
  ON logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'kommune'
    )
  );

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

CREATE POLICY "System can insert logs"
  ON logs FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- STORAGE BUCKET
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- STORAGE POLICIES
CREATE POLICY "Users can upload to attachments bucket"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attachments' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'attachments' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- TEST DATA (Optional - comment out for production)
-- =====================================================

-- Test organizations
INSERT INTO organizations (name, type, contact_email, cvr_number)
VALUES
  ('København Kommune', 'kommune', 'kontakt@kk.dk', '12345678'),
  ('Byggefirma A/S', 'entreprenor', 'info@byggefirma.dk', '87654321')
ON CONFLICT DO NOTHING;

-- Note: Politi users will be created with role='politi' but belong to kommune organization
-- since they don't create applications, only view them.

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ DATABASE SETUP COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '  • 6 tables (organizations, users, applications, signs, attachments, logs)';
  RAISE NOTICE '  • 15+ indexes for performance';
  RAISE NOTICE '  • 10+ triggers for automation';
  RAISE NOTICE '  • 5+ helper functions';
  RAISE NOTICE '  • 4 views for reporting';
  RAISE NOTICE '  • Row Level Security policies';
  RAISE NOTICE '  • Storage bucket for attachments';
  RAISE NOTICE '  • 2 test organizations (Kommune + Entreprenør)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Create users via Supabase Auth';
  RAISE NOTICE '  2. Link users to organizations in users table';
  RAISE NOTICE '  3. Start building the application!';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Ready for development!';
  RAISE NOTICE '========================================';
END $$;
