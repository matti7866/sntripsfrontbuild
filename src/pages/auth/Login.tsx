import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import './Login.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login({ username, password });
      
      if (result.success) {
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        setError(result.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-surprise-container">
      {/* Animated gradient background */}
      <div className="login-surprise-bg" />
      
      {/* Floating shapes */}
      <div className="login-surprise-orb login-surprise-orb-1" />
      <div className="login-surprise-orb login-surprise-orb-2" />
      <div className="login-surprise-orb login-surprise-orb-3" />
      
      {/* Glass morphism container */}
      <div className="login-surprise-card-wrapper">
        <div className="login-surprise-card-glow" />
        
        <div className="login-surprise-card">
          {/* Logo/Header */}
          <div className="login-surprise-header">
            <div className="login-surprise-logo">
              <i className="fas fa-sparkles"></i>
            </div>
            <h1 className="login-surprise-title">
              Welcome Back
            </h1>
            <p className="login-surprise-subtitle">Sign in to continue your journey</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="login-surprise-error">
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-surprise-form">
            {/* Username Input */}
            <div className="login-surprise-input-group">
              <div className={cn(
                "login-surprise-input-glow",
                usernameFocused && "login-surprise-input-glow-active"
              )} />
              <div className="login-surprise-input-wrapper">
                <i className={cn(
                  "fas fa-user login-surprise-input-icon",
                  usernameFocused && "login-surprise-input-icon-active"
                )} />
                <input
                  id="username"
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setUsernameFocused(true)}
                  onBlur={() => setUsernameFocused(false)}
                  className="login-surprise-input"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="login-surprise-input-group">
              <div className={cn(
                "login-surprise-input-glow",
                passwordFocused && "login-surprise-input-glow-active"
              )} />
              <div className="login-surprise-input-wrapper">
                <i className={cn(
                  "fas fa-lock login-surprise-input-icon",
                  passwordFocused && "login-surprise-input-icon-active"
                )} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  className="login-surprise-input"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-surprise-password-toggle"
                >
                  <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="login-surprise-forgot">
              <a href="#" className="login-surprise-forgot-link">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="login-surprise-submit"
            >
              <span className="login-surprise-submit-content">
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </span>
              <div className="login-surprise-submit-glow" />
            </button>
          </form>

          {/* Footer */}
          <div className="login-surprise-footer">
            <p>&copy; {new Date().getFullYear()} Selab Nadiry Travel & Tourism. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

