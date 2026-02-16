// context/AuthContext.js
'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState(null);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('customerAccessToken');
    if (token) {
      setAccessToken(token);
      // Verify token and get customer info
      verifyCustomerToken(token);
    }
  }, []);

  const verifyCustomerToken = async (token) => {
    try {
      const query = `
        query getCustomer($customerAccessToken: String!) {
          customer(customerAccessToken: $customerAccessToken) {
            id
            firstName
            lastName
            email
            phone
          }
        }
      `;

      const response = await fetch('/api/shopify/storefront', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { customerAccessToken: token }
        }),
      });

      const data = await response.json();
      
      if (data.data?.customer) {
        setCustomer(data.data.customer);
        setIsAuthenticated(true);
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('customerAccessToken');
        setAccessToken(null);
      }
    } catch (error) {
      console.error('Error verifying customer token:', error);
      localStorage.removeItem('customerAccessToken');
      setAccessToken(null);
    }
  };

  // Traditional email/password login
  const loginWithPassword = async (email, password) => {
    try {
      const mutation = `
        mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
          customerAccessTokenCreate(input: $input) {
            customerAccessToken {
              accessToken
              expiresAt
            }
            customerUserErrors {
              field
              message
            }
          }
        }
      `;

      const response = await fetch('/api/shopify/storefront', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            input: {
              email,
              password
            }
          }
        }),
      });

      const data = await response.json();
      
      if (data.data?.customerAccessTokenCreate?.customerAccessToken) {
        const token = data.data.customerAccessTokenCreate.customerAccessToken.accessToken;
        setAccessToken(token);
        localStorage.setItem('customerAccessToken', token);
        await verifyCustomerToken(token);
        return { success: true };
      } else {
        const errors = data.data?.customerAccessTokenCreate?.customerUserErrors || [];
        return { 
          success: false, 
          error: errors.length > 0 ? errors[0].message : 'Login failed' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  // Create new customer account
  const createCustomer = async ({ firstName, lastName, email, password }) => {
    try {
      const mutation = `
        mutation customerCreate($input: CustomerCreateInput!) {
          customerCreate(input: $input) {
            customer {
              id
              firstName
              lastName
              email
            }
            customerUserErrors {
              field
              message
            }
          }
        }
      `;

      const response = await fetch('/api/shopify/storefront', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            input: {
              firstName,
              lastName,
              email,
              password
            }
          }
        }),
      });

      const data = await response.json();
      
      if (data.data?.customerCreate?.customer) {
        // Account created successfully, now login
        const loginResult = await loginWithPassword(email, password);
        return { 
          success: loginResult.success, 
          error: loginResult.error 
        };
      } else {
        const errors = data.data?.customerCreate?.customerUserErrors || [];
        return { 
          success: false, 
          error: errors.length > 0 ? errors[0].message : 'Account creation failed' 
        };
      }
    } catch (error) {
      console.error('Create customer error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  // Magic link simulation (requires custom backend)
  const sendMagicLink = async (email) => {
    try {
      // This would need to be implemented on your backend
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return { 
        success: data.success, 
        error: data.error || 'Failed to send magic link' 
      };
    } catch (error) {
      console.error('Magic link error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  // Customer account recovery
  const recoverCustomerAccount = async (email) => {
    try {
      const mutation = `
        mutation customerRecover($email: String!) {
          customerRecover(email: $email) {
            customerUserErrors {
              field
              message
            }
          }
        }
      `;

      const response = await fetch('/api/shopify/storefront', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: mutation,
          variables: { email }
        }),
      });

      const data = await response.json();
      
      if (data.data?.customerRecover) {
        const errors = data.data.customerRecover.customerUserErrors || [];
        if (errors.length === 0) {
          return { 
            success: true, 
            message: 'Recovery email sent! Check your inbox for a password reset link.' 
          };
        } else {
          return { 
            success: false, 
            error: errors[0].message 
          };
        }
      }
      return { success: false, error: 'Recovery failed' };
    } catch (error) {
      console.error('Recovery error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    setCustomer(null);
    setIsAuthenticated(false);
    setAccessToken(null);
    localStorage.removeItem('customerAccessToken');
  };

  const value = {
    customer,
    isAuthenticated,
    accessToken,
    loginWithPassword,
    createCustomer,
    sendMagicLink,
    recoverCustomerAccount,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};