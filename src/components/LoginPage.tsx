import React, { useState } from 'react';
import { LockKeyhole, Mail, RadioTower } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await onLogin(email.trim(), password);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Não foi possível entrar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-950/50">
            <RadioTower className="h-7 w-7 text-white" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-400">VeloMedia DOOH</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Acesse sua conta</h1>
          <p className="mt-2 text-sm text-slate-400">Entre para gerenciar sua operação de telas veiculares.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl sm:p-8">
          <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-slate-200">E-mail</label>
          <div className="relative mb-5">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              autoCapitalize="none"
              required
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              placeholder="voce@empresa.com"
            />
          </div>

          <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-slate-200">Senha</label>
          <div className="relative mb-5">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              placeholder="Sua senha"
            />
          </div>

          {error && (
            <p role="alert" className="mb-4 rounded-lg border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-cyan-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-950/40 transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </button>
          <p className="mt-5 text-center text-xs leading-relaxed text-slate-500">
            Use as credenciais configuradas pelo administrador do sistema.
          </p>
        </form>

        <p className="mt-6 text-center text-xs text-slate-600">Acesso protegido por sessão segura.</p>
      </div>
    </main>
  );
};
