'use client';

import { FormEvent, useState } from 'react';

export function ProposalLeadForm({ slug }: { slug: string }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('sending');
    setError('');
    try {
      const response = await fetch('/api/proposal-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, name, email, phone, message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'No se pudo enviar.');
      setState('done');
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'No se pudo enviar.');
    }
  }

  if (state === 'done') {
    return (
      <div className="proposal-form-success">
        <div className="proposal-success-icon">✓</div>
        <h3>Perfecto. Hemos recibido tu solicitud.</h3>
        <p>Te contactaremos para concretar el dominio, los contenidos y la publicación de la web.</p>
      </div>
    );
  }

  return (
    <form className="proposal-lead-form" onSubmit={submit}>
      <div className="proposal-form-grid">
        <label>Nombre<input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Tu nombre" /></label>
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" /></label>
        <label>Teléfono<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="600 000 000" /></label>
        <label className="proposal-form-full">Mensaje <span>(opcional)</span><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Quiero saber cómo quedaría la web publicada..." /></label>
      </div>
      {state === 'error' && <p className="proposal-form-error">{error}</p>}
      <div className="proposal-form-footer">
        <p>Sin compromiso. Usaremos estos datos únicamente para responder a tu solicitud.</p>
        <button className="proposal-btn proposal-btn-primary" type="submit" disabled={state === 'sending'}>
          {state === 'sending' ? 'Enviando…' : 'Quiero hablar sobre la web'}
        </button>
      </div>
    </form>
  );
}
