import { supabase } from './supabaseClient';
import { User } from '../types';

interface AuthError {
  message: string;
  code?: string;
}

interface AuthResponse {
  user: User | null;
  error: AuthError | null;
}

interface SignUpData {
  email: string;
  password: string;
  username: string;
}

class SupabaseAuthService {
  /**
   * Sign up a new user with email and password
   */
  async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      // Sign up with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username
          }
        }
      });

      if (signUpError) {
        return {
          user: null,
          error: {
            message: signUpError.message,
            code: signUpError.code
          }
        };
      }

      // If user is returned (email confirmation may be required)
      if (authData.user) {
        // Create user profile in users table
        const userProfile: Omit<User, 'id'> = {
          username: data.username,
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.username)}&background=random`,
          created_at: new Date().toISOString(),
          status: 'online',
          job_title: 'Team Member'
        };

        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert([userProfile])
          .select()
          .single();

        if (userError) {
          // If user creation fails, we should delete the auth user too
          if (authData.user.id) {
            await supabase.auth.admin.deleteUser(authData.user.id);
          }
          return {
            user: null,
            error: {
              message: userError.message,
              code: userError.code
            }
          };
        }

        // Store user in session with email
        const userWithEmail = {
          ...userData,
          email: data.email
        };
        sessionStorage.setItem('currentUser', JSON.stringify(userWithEmail));
        
        return {
          user: userWithEmail as User,
          error: null
        };
      }

      return {
        user: null,
        error: {
          message: 'Sign up successful but user not returned. Please check your email for confirmation.'
        }
      };
    } catch (error: any) {
      return {
        user: null,
        error: {
          message: error.message || 'An unexpected error occurred during sign up'
        }
      };
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      // Sign in with Supabase Auth
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        return {
          user: null,
          error: {
            message: signInError.message,
            code: signInError.code
          }
        };
      }

      if (authData.user) {
        // Get user profile from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('username', authData.user.user_metadata?.username || '')
          .single();

        if (userError) {
          return {
            user: null,
            error: {
              message: 'User profile not found. Please contact support.',
              code: userError.code
            }
          };
        }

        // Update user status to online
        await supabase
          .from('users')
          .update({ status: 'online' })
          .eq('id', userData.id);

        // Store user in session with email
        const userWithEmail = {
          ...userData,
          email: authData.user.email
        };
        sessionStorage.setItem('currentUser', JSON.stringify(userWithEmail));
        
        return {
          user: userWithEmail as User,
          error: null
        };
      }

      return {
        user: null,
        error: {
          message: 'Sign in successful but user not returned'
        }
      };
    } catch (error: any) {
      return {
        user: null,
        error: {
          message: error.message || 'An unexpected error occurred during sign in'
        }
      };
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      // Update user status to offline
      const currentUserStr = sessionStorage.getItem('currentUser');
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser?.id) {
          await supabase
            .from('users')
            .update({ status: 'offline' })
            .eq('id', currentUser.id);
        }
      }

      // Sign out from Supabase Auth
      const { error: signOutError } = await supabase.auth.signOut();

      // Clear session storage
      sessionStorage.removeItem('currentUser');

      if (signOutError) {
        return {
          error: {
            message: signOutError.message,
            code: signOutError.code
          }
        };
      }

      return { error: null };
    } catch (error: any) {
      return {
        error: {
          message: error.message || 'An unexpected error occurred during sign out'
        }
      };
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        return {
          error: {
            message: error.message,
            code: error.code
          }
        };
      }

      return { error: null };
    } catch (error: any) {
      return {
        error: {
          message: error.message || 'An unexpected error occurred while sending reset email'
        }
      };
    }
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return {
          error: {
            message: error.message,
            code: error.code
          }
        };
      }

      return { error: null };
    } catch (error: any) {
      return {
        error: {
          message: error.message || 'An unexpected error occurred while updating password'
        }
      };
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): User | null {
    // Try to get from session storage first
    const userStr = sessionStorage.getItem('currentUser');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing current user from session storage:', e);
        return null;
      }
    }

    return null;
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh session
   */
  async refreshSession(): Promise<AuthResponse> {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        return {
          user: null,
          error: {
            message: error.message,
            code: error.code
          }
        };
      }

      if (session?.user) {
        // Get user profile
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('username', session.user.user_metadata?.username || '')
          .single();

        if (userError) {
          return {
            user: null,
            error: {
              message: 'User profile not found',
              code: userError.code
            }
          };
        }

        // Update user status to online
        await supabase
          .from('users')
          .update({ status: 'online' })
          .eq('id', userData.id);

        // Store user in session with email
        const userWithEmail = {
          ...userData,
          email: session.user.email
        };
        sessionStorage.setItem('currentUser', JSON.stringify(userWithEmail));
        
        return {
          user: userWithEmail as User,
          error: null
        };
      }

      return {
        user: null,
        error: {
          message: 'No active session found'
        }
      };
    } catch (error: any) {
      return {
        user: null,
        error: {
          message: error.message || 'An unexpected error occurred while refreshing session'
        }
      };
    }
  }
}

export const authService = new SupabaseAuthService();