import React, { useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { ApiError, getAccessToken } from '../../lib/api';
import {
  apiForgotPassword,
  apiLogin,
  apiRegister,
  apiResetPassword,
  apiSendOtp,
  apiSetPin,
  apiVerifyOtp,
} from '../../lib/xtrapayApi';
import { IntroScreen } from './IntroScreen';
import { LoginScreen } from './LoginScreen';
import { RegisterScreen, type RegisterBasicPayload } from './RegisterScreen';
import { ForgotPasswordScreen } from './ForgotPasswordScreen';
import { OtpScreen } from './OtpScreen';
import { ResetPasswordScreen } from './ResetPasswordScreen';
import { SetPinScreen } from './SetPinScreen';
import { CheckoutNowScreen } from '../screens/CheckoutNowScreen';
import { LegalScreen } from '../screens/LegalScreen';

type AuthStep =
  | 'intro'
  | 'login'
  | 'register'
  | 'terms'
  | 'privacy'
  | 'forgot'
  | 'otp'
  | 'set_pin'
  | 'reset_password'
  | 'checkoutnow';

type OtpPurpose = 'register' | 'login' | 'reset';

function errMessage(err: unknown, fallback: string) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

/**
 * Auth gate — Intro → Register (basic) → OTP → PIN → session.
 * KYC is deferred until cumulative spend hits ₦50,000 (prompted in-app after login).
 */
export const AuthFlow: React.FC = () => {
  const { hasSeenIntro, completeIntro, establishSession, showToast } = useTransactions();
  const [step, setStep] = useState<AuthStep>(hasSeenIntro ? 'login' : 'intro');
  const [otpPurpose, setOtpPurpose] = useState<OtpPurpose>('login');
  const [destination, setDestination] = useState('');
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [resetOtp, setResetOtp] = useState('');
  const [basicDraft, setBasicDraft] = useState<RegisterBasicPayload | null>(null);
  const [busy, setBusy] = useState(false);

  const goLogin = () => setStep('login');

  const finishIntro = () => {
    completeIntro();
    setStep('login');
  };

  const openOtp = (dest: string, purpose: OtpPurpose) => {
    setDestination(dest);
    setOtpPurpose(purpose);
    setStep('otp');
  };

  const sendRegisterOtps = async (draft: RegisterBasicPayload) => {
    const phone = draft.phone.trim();
    const email = draft.email.trim();
    const [phoneOtp] = await Promise.all([
      apiSendOtp(phone, 'register'),
      apiSendOtp(email, 'register'),
    ]);
    openOtp(phone, 'register');
    showToast(
      'OTP Sent',
      phoneOtp.demoCode
        ? `Codes sent to phone & email. Demo code: ${phoneOtp.demoCode}`
        : `Verification codes sent to ${phone} and ${email}.`,
      'info'
    );
  };

  if (step === 'intro') {
    return <IntroScreen onSkip={finishIntro} onDone={finishIntro} />;
  }

  if (step === 'register') {
    return (
      <RegisterScreen
        onBack={goLogin}
        onOpenTerms={() => setStep('terms')}
        onOpenPrivacy={() => setStep('privacy')}
        onContinue={async payload => {
          if (busy) return;
          setBusy(true);
          try {
            const { registrationId: id } = await apiRegister(payload);
            setRegistrationId(id);
            setBasicDraft(payload);
            await sendRegisterOtps(payload);
          } catch (err) {
            showToast('Registration failed', errMessage(err, 'Could not create account.'), 'warning');
          } finally {
            setBusy(false);
          }
        }}
      />
    );
  }

  if (step === 'terms') {
    return <LegalScreen kind="terms" onBack={() => setStep('register')} />;
  }

  if (step === 'privacy') {
    return <LegalScreen kind="privacy" onBack={() => setStep('register')} />;
  }

  if (step === 'forgot') {
    return (
      <ForgotPasswordScreen
        onBack={goLogin}
        onContinue={async id => {
          if (busy) return;
          setBusy(true);
          try {
            await apiForgotPassword(id);
            const otp = await apiSendOtp(id, 'reset');
            openOtp(id, 'reset');
            showToast(
              'OTP Sent',
              otp.demoCode
                ? `Demo code: ${otp.demoCode}`
                : `Verification code sent to ${id}.`,
              'info'
            );
          } catch (err) {
            showToast('Request failed', errMessage(err, 'Could not start password reset.'), 'warning');
          } finally {
            setBusy(false);
          }
        }}
      />
    );
  }

  if (step === 'otp') {
    return (
      <OtpScreen
        destination={destination}
        purpose={otpPurpose}
        verifying={busy}
        onBack={() =>
          setStep(
            otpPurpose === 'register'
              ? 'register'
              : otpPurpose === 'reset'
                ? 'forgot'
                : 'login'
          )
        }
        onResend={async () => {
          try {
            if (otpPurpose === 'register' && basicDraft?.email) {
              await Promise.all([
                apiSendOtp(destination, 'register'),
                apiSendOtp(basicDraft.email.trim(), 'register'),
              ]);
              showToast('OTP Resent', `New codes sent to ${destination} and email.`, 'info');
              return;
            }
            const otp = await apiSendOtp(destination, otpPurpose);
            showToast(
              'OTP Resent',
              otp.demoCode
                ? `Demo code: ${otp.demoCode}`
                : `New code sent to ${destination}.`,
              'info'
            );
          } catch (err) {
            showToast('Resend failed', errMessage(err, 'Could not resend code.'), 'warning');
          }
        }}
        onVerified={async code => {
          if (busy) return;
          if (otpPurpose === 'reset') {
            setResetOtp(code);
            setStep('reset_password');
            return;
          }
          setBusy(true);
          try {
            const session = await apiVerifyOtp({
              destination,
              purpose: otpPurpose,
              code,
              registrationId: registrationId ?? undefined,
            });
            if (otpPurpose === 'register' || session.user?.pinSet === false) {
              setStep('set_pin');
              showToast(
                'Account verified',
                'Create your 4-digit transaction PIN to continue.',
                'success'
              );
              return;
            }
            await establishSession(session.accessToken);
            showToast('Signed in', 'Welcome back to Xtrapay.', 'success');
          } catch (err) {
            showToast('Invalid code', errMessage(err, 'OTP verification failed.'), 'warning');
          } finally {
            setBusy(false);
          }
        }}
      />
    );
  }

  if (step === 'set_pin') {
    return (
      <SetPinScreen
        onSave={async pin => {
          try {
            await apiSetPin({ pin, confirmPin: pin });
            const token = getAccessToken();
            if (!token) {
              showToast('Session expired', 'Sign in again to continue.', 'warning');
              setStep('login');
              return;
            }
            await establishSession(token);
            showToast('PIN saved', 'Your transaction PIN is active. Welcome to Xtrapay.', 'success');
          } catch (err) {
            showToast('PIN failed', errMessage(err, 'Could not save transaction PIN.'), 'warning');
            throw err;
          }
        }}
      />
    );
  }

  if (step === 'reset_password') {
    return (
      <ResetPasswordScreen
        onBack={() => setStep('otp')}
        onSave={async password => {
          if (busy) return;
          setBusy(true);
          try {
            const session = await apiResetPassword({
              identifier: destination,
              otp: resetOtp,
              newPassword: password,
            });
            await establishSession(session.accessToken);
            showToast('Password updated', 'You are signed in with your new password.', 'success');
          } catch (err) {
            showToast('Reset failed', errMessage(err, 'Could not update password.'), 'warning');
          } finally {
            setBusy(false);
          }
        }}
      />
    );
  }

  if (step === 'checkoutnow') {
    return <CheckoutNowScreen onBack={goLogin} />;
  }

  return (
    <LoginScreen
      loading={busy}
      onBack={hasSeenIntro ? undefined : () => setStep('intro')}
      onLogin={async ({ identifier, password }) => {
        if (busy) return;
        setBusy(true);
        try {
          const session = await apiLogin(identifier, password);
          if (session.user?.pinSet === false) {
            setStep('set_pin');
            showToast('Set your PIN', 'Create a 4-digit transaction PIN to continue.', 'info');
            return;
          }
          await establishSession(session.accessToken);
          showToast('Signed in', 'Welcome back to Xtrapay.', 'success');
        } catch (err) {
          showToast('Sign in failed', errMessage(err, 'Check your details and try again.'), 'warning');
        } finally {
          setBusy(false);
        }
      }}
      onForgot={() => setStep('forgot')}
      onRegister={() => setStep('register')}
      onPoweredBy={() => setStep('checkoutnow')}
    />
  );
};
