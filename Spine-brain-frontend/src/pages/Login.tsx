import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types/crm';
import { useToast } from '../context/ToastContext';

export const Login: React.FC = () => {
  const { login, verifyMfa, verifyMfaRecovery } = useAuth();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const [email, setEmail] = useState<string>('admin@msbi.com');
  const [password, setPassword] = useState<string>('password123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [role, setRole] = useState<UserRole>('Admin');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // MFA State
  const [loginStep, setLoginStep] = useState<'CREDENTIALS' | 'MFA' | 'MFA_RECOVERY'>('CREDENTIALS');
  const [mfaChallenge, setMfaChallenge] = useState<string>('');
  const [totpCode, setTotpCode] = useState<string>('');
  const [recoveryCode, setRecoveryCode] = useState<string>('');
  const [isVerifyingMfa, setIsVerifyingMfa] = useState<boolean>(false);

  const handleRoleChange = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (selectedRole === 'Admin') setEmail('admin@msbi.com');
    if (selectedRole === 'Manager') setEmail('manager@msbi.com');
    if (selectedRole === 'Specialist') setEmail('specialist@msbi.com');
    if (selectedRole === 'Clinical Lead') setEmail('clinical@msbi.com');
    setPassword('password123'); // Default for all seeds
  };
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [forgotStep, setForgotStep] = useState<'EMAIL' | 'OTP' | 'NEW_PASSWORD' | 'SUCCESS'>('EMAIL');
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotStep === 'EMAIL') {
      setForgotStep('OTP');
    } else if (forgotStep === 'OTP') {
      setForgotStep('NEW_PASSWORD');
    } else if (forgotStep === 'NEW_PASSWORD') {
      setForgotStep('SUCCESS');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep('EMAIL');
        setForgotEmail('');
        setOtp('');
        setNewPassword('');
      }, 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      const result = await login(email, password);
      if (result.mfaRequired && result.mfaChallenge) {
        setMfaChallenge(result.mfaChallenge);
        setLoginStep('MFA');
        setTotpCode('');
        setRecoveryCode('');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      console.error('Login failed:', error?.message || 'Authentication failed');
      showError(error?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifyingMfa) return;
    setIsVerifyingMfa(true);
    try {
      if (loginStep === 'MFA') {
        await verifyMfa(mfaChallenge, totpCode);
      } else {
        await verifyMfaRecovery(mfaChallenge, recoveryCode);
      }
      navigate('/');
    } catch (error: any) {
      console.error('MFA verification error:', error?.message || 'Verification failed');
      showError(error?.message || 'Invalid MFA verification code. Please try again.');
    } finally {
      setIsVerifyingMfa(false);
    }
  };

  const handleCancelMfa = () => {
    setLoginStep('CREDENTIALS');
    setMfaChallenge('');
    setTotpCode('');
    setRecoveryCode('');
  };

  return (
    <div className="min-h-screen bg-surface-muted flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          {/* Official Midwest Spine Line-Art Logo */}
          <div className="flex justify-center mb-4">
            <img
              src="/main-logo.png"
              alt="Midwest Spine & Brain Institute Logo"
              className="h-20 w-auto object-contain drop-shadow-sm"
            />
          </div>

          <h1 className="font-headline-lg text-headline-md text-primary font-bold">
            Midwest Spine & Brain Institute
          </h1>
          <p className="font-body-sm text-xs text-on-surface-variant font-semibold mt-1">
            "Free to put you first" â€” Marketing Operations CRM
          </p>
        </div>

        {loginStep === 'CREDENTIALS' ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-label-md text-xs uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">
                Role Access (Demo RBAC Selector)
              </label>
              <select
                value={role}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="w-full bg-surface-muted border border-border-subtle rounded-xl px-3.5 py-2.5 font-body-sm text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium"
              >
                <option value="Admin">Admin (Full System Access)</option>
                <option value="Manager">Marketing Manager (Campaigns & Analytics)</option>
                <option value="Specialist">Marketing Specialist (Campaigns Only)</option>
                <option value="Clinical Lead">Clinical Lead (Clinical Intelligence)</option>
              </select>
            </div>

            <div>
              <label className="block font-label-md text-xs uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">
                Work Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-muted border border-border-subtle rounded-xl px-3.5 py-2.5 pl-10 font-body-sm text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="doctor@msbi.com"
                />
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-xl pointer-events-none">
                  mail
                </span>
              </div>
            </div>

            <div>
              <label className="block font-label-md text-xs uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-muted border border-border-subtle rounded-xl px-3.5 py-2.5 pl-10 pr-10 font-body-sm text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-xl pointer-events-none">
                  lock
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-on-surface-variant cursor-pointer hover:text-primary transition-colors focus:outline-none flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-border-subtle text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-xs text-on-surface-variant font-medium">Remember device</span>
              </label>
              <button type="button" onClick={() => setShowForgotModal(true)} className="text-xs text-secondary font-bold hover:underline cursor-pointer">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full btn-primary-vibrant font-bold py-3 px-4 rounded-xl shadow-md transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isLoggingIn ? 'Signing In...' : 'Sign In to CRM'}</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </form>
        ) : (
          /* MFA Verification View */
          <form onSubmit={handleMfaSubmit} className="space-y-5 animate-in fade-in duration-200">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-2xl">
                  {loginStep === 'MFA' ? 'verified_user' : 'key'}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-primary text-sm">
                  {loginStep === 'MFA' ? 'Two-Factor Authentication' : 'MFA Recovery Code'}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {loginStep === 'MFA'
                    ? 'Enter the 6-digit code from your authenticator app'
                    : 'Enter an unused one-time recovery code'}
                </p>
              </div>
            </div>

            {loginStep === 'MFA' ? (
              <div>
                <label className="block font-label-md text-xs uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">
                  6-Digit Authenticator Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    required
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-surface-muted border border-border-subtle rounded-xl p-3 text-center text-xl tracking-[0.5em] font-mono font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="000000"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block font-label-md text-xs uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">
                  8-Character Recovery Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    autoFocus
                    required
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                    className="w-full bg-surface-muted border border-border-subtle rounded-xl p-3 text-center text-base tracking-widest font-mono font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="XXXX-XXXX"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifyingMfa || (loginStep === 'MFA' ? totpCode.length !== 6 : recoveryCode.length < 6)}
              className="w-full btn-primary-vibrant font-bold py-3 px-4 rounded-xl shadow-md transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isVerifyingMfa ? 'Verifying...' : 'Verify & Continue'}</span>
              <span className="material-symbols-outlined text-lg">check_circle</span>
            </button>

            <div className="flex items-center justify-between pt-2">
              {loginStep === 'MFA' ? (
                <button
                  type="button"
                  onClick={() => setLoginStep('MFA_RECOVERY')}
                  className="text-xs text-secondary font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">key</span>
                  Use recovery code
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setLoginStep('MFA')}
                  className="text-xs text-secondary font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">smartphone</span>
                  Use authenticator app
                </button>
              )}

              <button
                type="button"
                onClick={handleCancelMfa}
                className="text-xs text-on-surface-variant hover:text-primary font-medium cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-4 border-t border-border-subtle text-center">
          <p className="text-[11px] text-on-surface-variant font-medium">
            Encrypted HIPAA-Compliant Session â€¢ MSBI Practice Portal
          </p>
        </div>
      </div>

      {showForgotModal && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in duration-150 relative">
            <button onClick={() => setShowForgotModal(false)} className="absolute top-4 right-4 text-on-surface-variant hover:text-primary cursor-pointer">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h2 className="font-headline-sm text-lg font-bold text-primary mb-2">
              {forgotStep === 'EMAIL' ? 'Reset Password' : forgotStep === 'OTP' ? 'Enter OTP' : forgotStep === 'NEW_PASSWORD' ? 'New Password' : 'Password Reset'}
            </h2>
            
            {forgotStep === 'SUCCESS' ? (
              <div className="p-4 bg-status-success/20 border border-status-success rounded-xl text-status-success font-medium text-sm flex items-center gap-3 mt-4">
                <span className="material-symbols-outlined">check_circle</span>
                Your password has been successfully reset!
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4 mt-4">
                {forgotStep === 'EMAIL' && (
                  <>
                    <p className="text-xs text-on-surface-variant mb-4">Enter your registered email address to receive a secure 6-digit OTP.</p>
                    <div>
                      <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full border border-border-subtle rounded-xl p-3 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="doctor@msbi.com"
                      />
                    </div>
                    <button type="submit" className="w-full btn-primary-vibrant py-3 rounded-xl font-bold cursor-pointer mt-4">
                      Send OTP
                    </button>
                  </>
                )}

                {forgotStep === 'OTP' && (
                  <>
                    <p className="text-xs text-on-surface-variant mb-4">We've sent a 6-digit OTP to <strong>{forgotEmail}</strong>. Please enter it below.</p>
                    <div>
                      <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Enter OTP</label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full border border-border-subtle rounded-xl p-3 text-sm bg-surface-muted text-on-surface text-center tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="123456"
                      />
                    </div>
                    <button type="submit" className="w-full btn-primary-vibrant py-3 rounded-xl font-bold cursor-pointer mt-4">
                      Verify OTP
                    </button>
                  </>
                )}

                {forgotStep === 'NEW_PASSWORD' && (
                  <>
                    <p className="text-xs text-on-surface-variant mb-4">OTP verified! Please create a new secure password.</p>
                    <div>
                      <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">New Password</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full border border-border-subtle rounded-xl p-3 text-sm bg-surface-muted text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="••••••••"
                      />
                    </div>
                    <button type="submit" className="w-full btn-primary-vibrant py-3 rounded-xl font-bold cursor-pointer mt-4">
                      Save New Password
                    </button>
                  </>
                )}
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
