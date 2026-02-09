// Test authentication functionality
import { authService } from './services/authService';

// Test function to verify auth service is working
export const testAuthService = async () => {
  console.log('Testing authentication service...');
  
  try {
    // Test authentication check
    const isAuthenticated = await authService.isAuthenticated();
    console.log('Is authenticated:', isAuthenticated);
    
    // Test current user retrieval
    const currentUser = authService.getCurrentUser();
    console.log('Current user:', currentUser);
    
    console.log('Auth service test completed successfully');
    return true;
  } catch (error) {
    console.error('Auth service test failed:', error);
    return false;
  }
};

// Run test when module is imported
testAuthService();