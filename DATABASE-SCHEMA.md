# Database Schema - VejSkilt Platform

## Database Platform: Supabase (PostgreSQL)

---

## Schema Overview

```
┌─────────────────┐
│  Organizations  │  (Kommuner, Entreprenører)
└────────┬────────┘
         │
         │ 1:N
         ▼
    ┌────────┐
    │ Users  │  (Auth users med roller)
    └────┬───┘
         │
         │ N:1 (creator)
         ▼
  ┌──────────────┐
  │ Applications │  (Ansøgninger om vejskiltning)
  └──────┬───────┘
         │
         │ 1:N
         ▼
    ┌────────┐       ┌──────────────┐
    │  Signs │ ◄───► │  Attachments │  (Fotos, tegninger)
    └────┬───┘       └──────────────┘
         │
         │ 1:N
         ▼
   ┌────────────┐
   │   Logs     │  (Audit trail)
   └────────────┘
```

---

## Tables

### 1. `organizations`

Organisationer (kommuner og entreprenør-firmaer) der bruger systemet.

```sql
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

-- RLS Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Users can see their own organization
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Kommune users can see all entreprenør organizations
CREATE POLICY "Kommune can view all organizations"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'kommune'
    )
  );
```

**Forklaring**:
- `type`: Enten 'kommune' eller 'entreprenor'
- `cvr_number`: CVR nummer for virksomheder (optional)
- `is_active`: Kan deaktivere organisationer uden at slette data

---

### 2. `users` (extends Supabase auth.users)

Brugerprofiler der udvider Supabase authentication.

```sql
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

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

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
```

**Roller**:
- `kommune`: Kommunal sagsbehandler (kan godkende/afvise)
- `entreprenor`: Entreprenør (kan ansøge og montere)
- `politi`: Politi (read-only adgang til godkendte skilte)

---

### 3. `applications`

Ansøgninger om tilladelse til vejskiltning.

```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  organization_id UUID NOT NULL REFERENCES organizations(id),
  created_by UUID NOT NULL REFERENCES users(id),
  approved_by UUID REFERENCES users(id),

  -- Application details
  application_number TEXT UNIQUE NOT NULL, -- Auto-generated: "ANS-2025-001234"
  title TEXT NOT NULL,
  description TEXT,

  -- Location
  address TEXT NOT NULL,
  municipality TEXT NOT NULL, -- Kommune navn

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

-- Generate application number automatically
CREATE OR REPLACE FUNCTION generate_application_number()
RETURNS TRIGGER AS $$
DECLARE
  year TEXT;
  sequence_num TEXT;
BEGIN
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
  WHEN (NEW.application_number IS NULL)
  EXECUTE FUNCTION generate_application_number();

-- Indexes
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_organization ON applications(organization_id);
CREATE INDEX idx_applications_created_by ON applications(created_by);
CREATE INDEX idx_applications_dates ON applications(start_date, end_date);
CREATE INDEX idx_applications_number ON applications(application_number);

-- RLS Policies
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Entreprenør can view their own organization's applications
CREATE POLICY "Entreprenor can view own applications"
  ON applications FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Entreprenør can create applications
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

-- Kommune can view all applications
CREATE POLICY "Kommune can view all applications"
  ON applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'kommune'
    )
  );

-- Kommune can update (approve/reject) applications
CREATE POLICY "Kommune can update applications"
  ON applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'kommune'
    )
  );

-- Politi can view approved applications
CREATE POLICY "Politi can view approved applications"
  ON applications FOR SELECT
  USING (
    status IN ('approved', 'active', 'completed')
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'politi'
    )
  );
```

**Status flow**:
1. `pending`: Afventer godkendelse
2. `approved`: Godkendt af kommune
3. `rejected`: Afvist af kommune
4. `active`: Aktiv (mindst ét skilt monteret)
5. `completed`: Færdig (alle skilte fjernet)
6. `cancelled`: Annulleret af entreprenør

---

### 4. `signs`

Individuelle skilte knyttet til en ansøgning.

```sql
CREATE TABLE signs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,

  -- Sign details
  sign_type TEXT NOT NULL, -- "Hastighedsbegrænsning 40", "Vejarbejde", etc.

  -- Location
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  placement_description TEXT, -- "Ved indkørsel til byggeplads"

  -- QR Code
  qr_code TEXT UNIQUE NOT NULL, -- Unique identifier embedded in QR
  qr_generated_at TIMESTAMPTZ DEFAULT now(),

  -- Mounting info
  status TEXT NOT NULL DEFAULT 'not_mounted' CHECK (
    status IN ('not_mounted', 'mounted', 'removed')
  ),
  mounted_at TIMESTAMPTZ,
  mounted_by UUID REFERENCES users(id),
  mounted_latitude DOUBLE PRECISION, -- Actual GPS when scanned
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

-- Generate unique QR code
CREATE OR REPLACE FUNCTION generate_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate QR code like: "VS-2025-ABC123XYZ"
  NEW.qr_code := 'VS-' ||
                 TO_CHAR(NEW.created_at, 'YYYY') || '-' ||
                 UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 9));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_qr_code
  BEFORE INSERT ON signs
  FOR EACH ROW
  WHEN (NEW.qr_code IS NULL)
  EXECUTE FUNCTION generate_qr_code();

-- Indexes
CREATE INDEX idx_signs_application ON signs(application_id);
CREATE INDEX idx_signs_status ON signs(status);
CREATE INDEX idx_signs_qr_code ON signs(qr_code);
CREATE INDEX idx_signs_location ON signs USING GIST (
  ll_to_earth(latitude, longitude)
); -- Spatial index for location queries

-- RLS Policies
ALTER TABLE signs ENABLE ROW LEVEL SECURITY;

-- Inherit policies from applications
CREATE POLICY "Users can view signs from accessible applications"
  ON signs FOR SELECT
  USING (
    application_id IN (
      SELECT id FROM applications
    )
  );

-- Entreprenør can update their own signs (mount/remove)
CREATE POLICY "Entreprenor can update own signs"
  ON signs FOR UPDATE
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN users u ON u.organization_id = a.organization_id
      WHERE u.id = auth.uid()
    )
  );
```

**QR Code Format**: `VS-2025-ABC123XYZ`
- `VS`: VejSkilt
- `2025`: Year
- `ABC123XYZ`: Random unique identifier

---

### 5. `attachments`

Filer knyttet til skilte eller ansøgninger (fotos, tegninger, dokumenter).

```sql
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships (one of these must be set)
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  sign_id UUID REFERENCES signs(id) ON DELETE CASCADE,

  -- File info
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Path in Supabase Storage
  file_type TEXT NOT NULL, -- image/jpeg, image/png, application/pdf
  file_size INTEGER, -- bytes

  -- Categorization
  attachment_type TEXT NOT NULL CHECK (
    attachment_type IN (
      'application_drawing',  -- Tegning ved ansøgning
      'application_document', -- Dokument ved ansøgning
      'mounted_photo',        -- Foto ved montering
      'removed_photo'         -- Foto ved fjernelse
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

-- RLS Policies
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

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
```

**Storage i Supabase Storage**:
- Bucket: `attachments`
- Path structure: `{application_id}/{filename}` eller `signs/{sign_id}/{filename}`

---

### 6. `logs`

Audit trail for alle handlinger i systemet.

```sql
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What happened
  entity_type TEXT NOT NULL CHECK (
    entity_type IN ('application', 'sign', 'user', 'organization')
  ),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'approved', 'rejected', 'mounted', 'removed'

  -- Who did it
  user_id UUID REFERENCES users(id),
  user_role TEXT,

  -- Details
  description TEXT,
  metadata JSONB, -- Flexible field for additional data

  -- When
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_logs_entity ON logs(entity_type, entity_id);
CREATE INDEX idx_logs_user ON logs(user_id);
CREATE INDEX idx_logs_created_at ON logs(created_at DESC);
CREATE INDEX idx_logs_metadata ON logs USING GIN(metadata); -- For JSON queries

-- RLS Policies
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

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
```

---

## Triggers for Automatic Logging

```sql
-- Function to log changes
CREATE OR REPLACE FUNCTION log_change()
RETURNS TRIGGER AS $$
DECLARE
  user_role_val TEXT;
BEGIN
  -- Get user role
  SELECT role INTO user_role_val FROM users WHERE id = auth.uid();

  -- Insert log entry
  INSERT INTO logs (entity_type, entity_id, action, user_id, user_role, metadata)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    auth.uid(),
    user_role_val,
    jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach to tables
CREATE TRIGGER applications_log_changes
  AFTER INSERT OR UPDATE OR DELETE ON applications
  FOR EACH ROW EXECUTE FUNCTION log_change();

CREATE TRIGGER signs_log_changes
  AFTER INSERT OR UPDATE OR DELETE ON signs
  FOR EACH ROW EXECUTE FUNCTION log_change();
```

---

## Views for Common Queries

### 1. Active Signs View

```sql
CREATE VIEW active_signs_with_details AS
SELECT
  s.id,
  s.sign_type,
  s.latitude,
  s.longitude,
  s.status,
  s.mounted_at,
  a.application_number,
  a.address,
  a.end_date,
  o.name AS organization_name,
  u.full_name AS mounted_by_name,
  CASE
    WHEN a.end_date < CURRENT_DATE THEN true
    ELSE false
  END AS is_overdue
FROM signs s
JOIN applications a ON s.application_id = a.id
JOIN organizations o ON a.organization_id = o.id
LEFT JOIN users u ON s.mounted_by = u.id
WHERE s.status = 'mounted';
```

### 2. Application Summary View

```sql
CREATE VIEW application_summary AS
SELECT
  a.id,
  a.application_number,
  a.title,
  a.address,
  a.status,
  a.start_date,
  a.end_date,
  a.created_at,
  o.name AS organization_name,
  creator.full_name AS created_by_name,
  approver.full_name AS approved_by_name,
  COUNT(s.id) AS total_signs,
  COUNT(s.id) FILTER (WHERE s.status = 'mounted') AS mounted_signs,
  COUNT(s.id) FILTER (WHERE s.status = 'removed') AS removed_signs
FROM applications a
JOIN organizations o ON a.organization_id = o.id
JOIN users creator ON a.created_by = creator.id
LEFT JOIN users approver ON a.approved_by = approver.id
LEFT JOIN signs s ON a.id = s.application_id
GROUP BY a.id, o.name, creator.full_name, approver.full_name;
```

---

## Storage Buckets (Supabase Storage)

### 1. `attachments` Bucket

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false);

-- RLS for storage
CREATE POLICY "Users can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attachments' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view their attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'attachments' AND
  auth.uid() IS NOT NULL
);
```

---

## Database Functions

### 1. Get Application Statistics

```sql
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
    'completed', COUNT(*) FILTER (WHERE status = 'completed')
  )
  INTO result
  FROM applications
  WHERE org_id IS NULL OR organization_id = org_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### 2. Check for Overdue Signs

```sql
CREATE OR REPLACE FUNCTION get_overdue_signs()
RETURNS TABLE (
  sign_id UUID,
  application_id UUID,
  application_number TEXT,
  end_date DATE,
  days_overdue INTEGER,
  organization_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    a.id,
    a.application_number,
    a.end_date,
    (CURRENT_DATE - a.end_date)::INTEGER,
    o.name
  FROM signs s
  JOIN applications a ON s.application_id = a.id
  JOIN organizations o ON a.organization_id = o.id
  WHERE s.status = 'mounted'
    AND a.end_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;
```

---

## Indexes for Performance

```sql
-- Composite indexes for common queries
CREATE INDEX idx_signs_app_status ON signs(application_id, status);
CREATE INDEX idx_applications_org_status ON applications(organization_id, status);
CREATE INDEX idx_applications_dates_status ON applications(start_date, end_date, status);

-- Full-text search on applications
CREATE INDEX idx_applications_search ON applications
  USING GIN(to_tsvector('danish', title || ' ' || COALESCE(description, '') || ' ' || address));
```

---

## Migration Strategy

### Phase 1: Core Tables
1. organizations
2. users (with Supabase auth integration)
3. applications
4. signs

### Phase 2: Supporting Tables
5. attachments
6. logs

### Phase 3: Optimization
7. Views
8. Functions
9. Additional indexes
10. Storage buckets

---

## Estimated Storage

For 1.500 skilte per år:
- **Database**: ~50 MB/år (med logs og metadata)
- **Storage (photos)**: ~3 GB/år (antag 2 fotos per skilt à 1 MB)

**Total efter 5 år**: ~500 MB database + 15 GB storage = godt inden for Supabase free tier (500 MB database + 1 GB storage) for development, kræver Pro plan ($25/måned) for production.

---

## Backup & Recovery

**Supabase Pro** inkluderer:
- Daily automatic backups (7 days retention)
- Point-in-time recovery
- Manual backup triggers

**Anbefaling**: Pro plan til production.

---

**Status**: Ready for implementation
**Last Updated**: 2025-11-14
