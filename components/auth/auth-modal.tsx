'use client';

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Mail, User, Loader2, Phone, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  // Form fields
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  // OTP state
  const [otpSent, setOtpSent] = useState(false);

  // UI
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [mounted, setMounted] = useState(false);

  const { login } = useAuth();

  // ── Mount / unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    setMode(initialMode);
    setError('');
    setMessage('');

    if (isOpen) {
      resetState();
      document.body.style.overflow = 'hidden';
      document.body.classList.add('auth-modal-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('auth-modal-open');
    }

    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('auth-modal-open');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialMode]);

  // ── Resend countdown ────────────────────────────────────────────────────
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  if (!isOpen || !mounted) return null;

  // ── Helpers ─────────────────────────────────────────────────────────────
  function resetState() {
    setOtpSent(false);
    setOtp('');
    setEmail('');
    setName('');
    setPhone('');
    setError('');
    setMessage('');
  }

  function redirectAfterLogin(role: string) {
    if (role === 'admin') window.location.href = '/admin';
    else if (role === 'vendor') window.location.href = '/vendor/dashboard';
    else if (role === 'delivery_agent') window.location.href = '/delivery-agent/orders';
  }

  // ── Send OTP ─────────────────────────────────────────────────────────────
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, mode, name, phone }),
      });

      const data = await res.json();

      if (res.ok) {
        setOtpSent(true);
        setResendTimer(120);
        setMessage(`OTP sent to ${email}`);
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (_) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP ───────────────────────────────────────────────────────────
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (res.ok) {
        login(data.token, data.user);
        redirectAfterLogin(data.user.role);
        onClose();
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (_) {
      setError('Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ───────────────────────────────────────────────────────────
  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, mode, name, phone }),
      });

      const data = await res.json();

      if (res.ok) {
        setResendTimer(120);
        setMessage(`OTP resent to ${email}`);
      } else {
        setError(data.error || 'Failed to resend OTP');
      }
    } catch (_) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // ── Google Sign In ────────────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    const storedMockId = localStorage.getItem('mock_google_id');
    const mockId = storedMockId || `google_${Math.random().toString(36).substring(2, 11)}`;
    if (!storedMockId) localStorage.setItem('mock_google_id', mockId);
    const mockEmail = `user.${mockId}@gmail.com`;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleId: mockId, email: mockEmail, name: 'Google User', picture: '' }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        redirectAfterLogin(data.user.role);
        onClose();
      } else {
        setError(data.error || 'Google Sign In Failed');
      }
    } catch (_) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    resetState();
  };

  const isSignup = mode === 'signup';

  // ── Render ────────────────────────────────────────────────────────────────
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-xl transition-opacity duration-500"
          onClick={onClose}
        />
        <div className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white shadow-[0_0_50px_rgba(0,0,0,0.3)] transition-all duration-500 ease-out scale-100 opacity-100 animate-in fade-in zoom-in-95">
          <button
            onClick={onClose}
            className="absolute right-6 top-6 z-10 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-8 pt-12">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900">
                {isSignup ? 'Join Villorita' : 'Welcome Back'}
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                {isSignup
                  ? 'Create your account — verify via email OTP'
                  : 'Login with OTP to access your orders'}
              </p>
            </div>

            <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP} className="space-y-5">
              {/* Signup-only fields */}
              {!otpSent && isSignup && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="name"
                        placeholder="John Doe"
                        className="pl-10"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        className="pl-10"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={otpSent}
                  />
                </div>
              </div>

              {/* OTP input */}
              {otpSent && (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      className="pl-10 text-center tracking-widest text-lg"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      maxLength={6}
                    />
                  </div>
                  <p className="text-xs text-gray-400">Check your inbox at {email}</p>
                  <div className="flex justify-between items-center text-xs mt-1">
                    <button
                      type="button"
                      className="text-gray-500 hover:text-primary transition-colors"
                      onClick={() => { setOtpSent(false); setOtp(''); setError(''); setMessage(''); }}
                    >
                      Wrong email? Change it.
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={resendTimer > 0 || loading}
                      className={`font-medium transition-colors ${
                        resendTimer > 0
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-primary hover:underline'
                      }`}
                    >
                      {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                    </button>
                  </div>
                </div>
              )}

              {/* Messages */}
              {message && (
                <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600 border border-green-100">
                  {message}
                </div>
              )}
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full rounded-2xl h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : otpSent ? (
                  isSignup ? 'Verify & Create Account' : 'Verify & Login'
                ) : (
                  'Send OTP'
                )}
              </Button>


            </form>

            <div className="mt-8 text-center text-sm">
              <span className="text-gray-500">
                {isSignup ? 'Already have an account?' : "Don't have an account?"}
              </span>
              <button
                onClick={() => switchMode(isSignup ? 'login' : 'signup')}
                className="ml-2 font-semibold text-primary hover:underline"
              >
                {isSignup ? 'Login' : 'Sign Up'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
