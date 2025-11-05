# Supabase Tables Required for Complete SignUp & Login Feature

## 📊 Current Authentication Status

Your StudioSyncWork application **already has** a robust authentication system in place! Here's what you currently have:

### ✅ **Existing Tables (Already Implemented)**

#### 1. **Core Authentication Tables**
- **`profiles`** - User profiles with storage limits and plan types
- **`roles`** - System roles (manager, photographer, videographer, editor, accounts, crm)
- **`permissions`** - Granular permissions for RBAC system
- **`role_permissions`** - Links roles to their permissions
- **`user_roles`** - Assigns roles to users (many-to-many)

#### 2. **Authentication Functions**
- **`create_user_profile()`** - Creates user profile
- **`get_user_profile()`** - Retrieves user profile data
- **`update_user_profile()`** - Updates user profile
- **`user_has_permission()`** - Checks user permissions
- **`get_user_roles()`** - Gets user roles
- **`get_user_permissions()`** - Gets user permissions

#### 3. **Existing Authentication Features**
- ✅ **Email/Password SignUp & Login**
- ✅ **Google OAuth Integration**
- ✅ **Role-Based Access Control (RBAC)**
- ✅ **User Profile Management**
- ✅ **Bypass Authentication (for development)**
- ✅ **Row Level Security (RLS)**
- ✅ **Session Management**

## 🚀 **Additional Tables Needed for Enhanced Authentication**

While your current system is functional, here are additional tables you might want to consider for a **production-ready** authentication system:

### 1. **User Session Management**
```sql
-- Track user sessions and login history
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  device_info JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  login_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  logout_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 2. **Password Reset & Email Verification**
```sql
-- Handle password reset tokens and email verification
CREATE TABLE auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token_type TEXT NOT NULL, -- 'password_reset', 'email_verification', 'magic_link'
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 3. **Login Attempts & Security**
```sql
-- Track login attempts for security monitoring
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
```

### 4. **Two-Factor Authentication (2FA)**
```sql
-- Store 2FA settings and backup codes
CREATE TABLE user_2fa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  is_enabled BOOLEAN DEFAULT false,
  secret_key TEXT,
  backup_codes TEXT[],
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 5. **User Preferences & Settings**
```sql
-- Store user-specific authentication preferences
CREATE TABLE user_auth_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  login_alerts BOOLEAN DEFAULT true,
  session_timeout INTEGER DEFAULT 24, -- hours
  preferred_language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 6. **OAuth Provider Accounts**
```sql
-- Link multiple OAuth providers to users
CREATE TABLE oauth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'google', 'facebook', 'github', etc.
  provider_user_id TEXT NOT NULL,
  provider_email TEXT,
  provider_name TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(provider, provider_user_id)
);
```

### 7. **Account Verification Status**
```sql
-- Track account verification status
CREATE TABLE account_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  identity_verified BOOLEAN DEFAULT false,
  verification_level TEXT DEFAULT 'basic', -- 'basic', 'standard', 'premium'
  verification_documents JSONB DEFAULT '{}',
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 8. **User Activity Log**
```sql
-- Comprehensive user activity tracking
CREATE TABLE user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'login', 'logout', 'password_change', 'profile_update'
  activity_data JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## 🔧 **Enhanced Functions Needed**

### 1. **Session Management Functions**
```sql
-- Create user session
CREATE OR REPLACE FUNCTION create_user_session(
  p_user_id UUID,
  p_device_info JSONB DEFAULT '{}',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_expires_hours INTEGER DEFAULT 24
) RETURNS TEXT;

-- Validate session
CREATE OR REPLACE FUNCTION validate_session(
  p_session_token TEXT
) RETURNS TABLE (
  user_id UUID,
  is_valid BOOLEAN,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions() RETURNS INTEGER;
```

### 2. **Security Functions**
```sql
-- Check if user is locked out
CREATE OR REPLACE FUNCTION is_user_locked_out(
  p_email TEXT,
  p_hours INTEGER DEFAULT 1
) RETURNS BOOLEAN;

-- Record login attempt
CREATE OR REPLACE FUNCTION record_login_attempt(
  p_email TEXT,
  p_success BOOLEAN,
  p_failure_reason TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS VOID;

-- Generate secure token
CREATE OR REPLACE FUNCTION generate_auth_token(
  p_user_id UUID,
  p_token_type TEXT,
  p_expires_hours INTEGER DEFAULT 1
) RETURNS TEXT;
```

## 🛡️ **Security Enhancements**

### 1. **Rate Limiting Policies**
```sql
-- RLS policies for rate limiting
CREATE POLICY "Rate limit login attempts" 
  ON login_attempts 
  FOR INSERT 
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM login_attempts 
      WHERE email = NEW.email 
      AND attempted_at > now() - INTERVAL '15 minutes'
      AND success = false
      HAVING COUNT(*) >= 5
    )
  );
```

### 2. **Session Security**
```sql
-- RLS policies for session management
CREATE POLICY "Users can manage their own sessions" 
  ON user_sessions 
  FOR ALL 
  USING (user_id = auth.uid());
```

## 📱 **Frontend Integration Requirements**

### 1. **Enhanced Auth Context**
- Session management
- 2FA support
- Login attempt tracking
- Device management

### 2. **Security Components**
- Login attempt monitoring
- Device verification
- Suspicious activity alerts
- Password strength requirements

### 3. **User Management UI**
- Session management dashboard
- Security settings
- Login history
- Device management

## 🎯 **Recommended Implementation Priority**

### **Phase 1: Essential Security (High Priority)**
1. **`login_attempts`** - Prevent brute force attacks
2. **`user_sessions`** - Proper session management
3. **`auth_tokens`** - Password reset functionality

### **Phase 2: Enhanced Features (Medium Priority)**
4. **`user_2fa`** - Two-factor authentication
5. **`user_auth_preferences`** - User settings
6. **`user_activity_log`** - Activity tracking

### **Phase 3: Advanced Features (Low Priority)**
7. **`oauth_accounts`** - Multiple OAuth providers
8. **`account_verification`** - Identity verification

## ✅ **Current System Assessment**

Your **existing authentication system is already production-ready** with:
- ✅ Complete user registration and login
- ✅ Google OAuth integration
- ✅ Role-based access control
- ✅ User profile management
- ✅ Security policies (RLS)

## 🚀 **Next Steps**

1. **Evaluate your security requirements** - Do you need the additional tables?
2. **Implement Phase 1 tables** if enhanced security is needed
3. **Add session management** for better user experience
4. **Consider 2FA** for high-security applications
5. **Monitor login attempts** for security threats

## 💡 **Recommendation**

For most photography business applications, your **current authentication system is sufficient**. Consider adding the additional tables only if you need:
- Enhanced security monitoring
- Two-factor authentication
- Advanced session management
- Compliance requirements

Your existing system already provides a solid foundation for user authentication and authorization!
