import React, { useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { ApiError } from '../../lib/api';
import {
  apiForgotPassword,
  apiLogin,
  apiRegister,
  apiResetPassword,
  apiSendOtp,
  apiSubmitKyc,
  apiVerifyOtp,
} from '../../lib/xtrapayApi';
import { IntroScreen } from './IntroScreen';
import { LoginScreen } from './LoginScreen';
import { RegisterScreen, type RegisterBasicPayload } from './RegisterScreen';
import { KycRegisterScreen, type RegisterKycPayload } from './KycRegisterScreen';
import { ForgotPasswordScreen } from './ForgotPasswordScreen';
import { OtpScreen } from './OtpScreen';
import { ResetPasswordScreen } from './ResetPasswordScreen';
import { CheckoutNowScreen } from '../screens/CheckoutNowScreen';

type AuthStep =
  | 'intro'
  | 'login'
  | 'register'
  | 'register_kyc'
  | 'forgot'
  | 'otp'
  | 'reset_password'
  | 'checkoutnow';

type OtpPurpose = 'register' | 'login' | 'reset';

function errMessage(err: unknown, fallback: string) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

/**
 * Full auth gate — intro, login, register (basic → KYC), forgot, OTP, reset.
 */
export const AuthFlow: React.FC = () => {
  const { hasSeenIntro, completeIntro, establishSession, showToast } = useTransactions();
  const [step, setStep] = useState<AuthStep>(hasSeenIntro ? 'login' : 'intro');
  const [otpPurpose, setOtpPurpose] = useState<OtpPurpose>('login');
  const [destination, setDestination] = useState('');
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [resetOtp, setResetOtp] = useState('');
  const [basicDraft, setBasicDraft] = useState<RegisterBasicPayload | null>(null);
  const [, setKycDraft] = useState<RegisterKycPayload | null>(null);
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

  if (step === 'intro') {
    return <IntroScreen onSkip={finishIntro} onDone={finishIntro} />;
  }

  if (step === 'register') {
    return (
      <RegisterScreen
        onBack={goLogin}
        onContinue={async payload => {
          if (busy) return;
          setBusy(true);
          try {
            const { registrationId: id } = await apiRegister(payload);
            setRegistrationId(id);
            setBasicDraft(payload);
            setStep('register_kyc');
          } catch (err) {
            showToast('Registration failed', errMessage(err, 'Could not create account.'), 'warning');
          } finally {
            setBusy(false);
          }
        }}
      />
    );
  }

  if (step === 'register_kyc') {
    return (
      <KycRegisterScreen
        onBack={() => setStep('register')}
        onContinue={async payload => {
          if (busy) return;
          const phone = basicDraft?.phone?.trim();
          if (!phone || !registrationId) {
            setStep('register');
            showToast('Missing details', 'Start registration again from the beginning.', 'warning');
            return;
          }
          setBusy(true);
          try {
            setKycDraft(payload);
            await apiSubmitKyc({ registrationId, ...payload });
            const otp = await apiSendOtp(phone, 'register');
            openOtp(phone, 'register');
            showToast(
              'OTP Sent',
              otp.demoCode
                ? `Demo code: ${otp.demoCode}`
                : `Verification code sent to ${phone}.`,
              'info'
            );
          } catch (err) {
            showToast('KYC failed', errMessage(err, 'Could not submit KYC.'), 'warning');
          } finally {
            setBusy(false);
          }
        }}
      />
    );
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
        onBack={() =>
          setStep(
            otpPurpose === 'register'
              ? 'register_kyc'
              : otpPurpose === 'reset'
                ? 'forgot'
                : 'login'
          )
        }
        onResend={async () => {
          try {
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
            await establishSession(session.accessToken);
            showToast(
              otpPurpose === 'register' ? 'Account verified' : 'Signed in',
              otpPurpose === 'register'
                ? 'Your Xtrapay account is ready with KYC submitted.'
                : 'Welcome back to Xtrapay.',
              'success'
            );
          } catch (err) {
            showToast('Invalid code', errMessage(err, 'OTP verification failed.'), 'warning');
          } finally {
            setBusy(false);
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
      onBack={hasSeenIntro ? undefined : () => setStep('intro')}
      onLogin={async ({ identifier, password }) => {
        if (busy) return;
        setBusy(true);
        try {
          const session = await apiLogin(identifier, password);
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
