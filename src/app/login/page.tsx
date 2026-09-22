'use client';

import {
  FormEvent,
  useState,
} from 'react';

import {
  useRouter,
} from 'next/navigation';

import {
  createBrowserClient,
} from '@supabase/ssr';

export default function LoginPage() {
  const router =
    useRouter();

  const [
    email,
    setEmail,
  ] =
    useState('');

  const [
    password,
    setPassword,
  ] =
    useState('');

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState('');

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanEmail =
      email.trim();

    if (
      !cleanEmail ||
      !password
    ) {
      setErrorMessage(
        'Enter your email and password.'
      );

      return;
    }

    setLoading(
      true
    );

    setErrorMessage(
      ''
    );

    try {
      const supabase =
        createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
        );

      const {
        error,
      } =
        await supabase.auth.signInWithPassword({
          email:
            cleanEmail,

          password,
        });

      if (
        error
      ) {
        setErrorMessage(
          error.message
        );

        return;
      }

      router.replace(
        '/'
      );

      router.refresh();
    } catch (
      error
    ) {
      console.error(
        'LOGIN ERROR:',
        error
      );

      setErrorMessage(
        'Could not sign in. Please try again.'
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand">
          BJJ
        </div>

        <div className="eyebrow">
          BJJ TRACKER
        </div>

        <h1>
          Sign in
        </h1>

        <p className="subtitle">
          Access your training dashboard.
        </p>

        <form
          onSubmit={
            handleSubmit
          }
        >
          <label>
            EMAIL

            <input
              type="email"
              autoComplete="email"
              value={
                email
              }
              onChange={(
                event
              ) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="you@example.com"
              disabled={
                loading
              }
            />
          </label>

          <label>
            PASSWORD

            <input
              type="password"
              autoComplete="current-password"
              value={
                password
              }
              onChange={(
                event
              ) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Your password"
              disabled={
                loading
              }
            />
          </label>

          {errorMessage ? (
            <div className="error-message">
              {
                errorMessage
              }
            </div>
          ) : null}

          <button
            type="submit"
            disabled={
              loading
            }
          >
            {loading
              ? 'SIGNING IN...'
              : 'SIGN IN'}
          </button>
        </form>
      </section>

      <style jsx>{`
        .login-page {
          min-height: calc(
            100dvh - 80px
          );
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 0 80px;
        }

        .login-card {
          width: min(
            100%,
            430px
          );
          padding: 28px;
          border: 1px solid #25282d;
          border-radius: 24px;
          background: #111317;
          box-shadow:
            0 24px 80px
            rgba(
              0,
              0,
              0,
              0.35
            );
        }

        .brand {
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          border-radius: 15px;
          background: #ffffff;
          color: #090a0c;
          font-size: 13px;
          font-weight: 950;
          letter-spacing: 0.05em;
        }

        .eyebrow {
          color: #777c85;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.15em;
        }

        h1 {
          margin: 5px 0 0;
          color: #ffffff;
          font-size: 34px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .subtitle {
          margin: 8px 0 26px;
          color: #777c85;
          font-size: 13px;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        label {
          display: flex;
          flex-direction: column;
          gap: 8px;
          color: #777c85;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.1em;
        }

        input {
          width: 100%;
          min-height: 54px;
          padding: 0 15px;
          border: 1px solid #2b2f35;
          border-radius: 15px;
          background: #090a0c;
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
          outline: none;
          letter-spacing: normal;
        }

        input:focus {
          border-color: #555b63;
        }

        input::placeholder {
          color: #555b63;
        }

        .error-message {
          padding: 12px 13px;
          border: 1px solid #4a2324;
          border-radius: 12px;
          background: #1b1112;
          color: #ff7b73;
          font-size: 12px;
          line-height: 1.5;
        }

        button {
          min-height: 56px;
          margin-top: 2px;
          border-radius: 16px;
          background: #ffffff;
          color: #090a0c;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.06em;
          cursor: pointer;
        }

        button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        @media (
          max-width: 520px
        ) {
          .login-page {
            min-height: calc(
              100dvh - 110px
            );
            align-items: flex-start;
            padding-top: 26px;
          }

          .login-card {
            padding: 22px;
            border-radius: 20px;
          }
        }
      `}</style>
    </main>
  );
}


