'use client';

import { useEffect, useState } from 'react';
import { ProposalLeadForm } from './proposal-lead-form';

export function ProposalCtaModal({ slug, label = 'Quiero esta web' }: { slug: string; label?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <>
      <button className="proposal-btn proposal-btn-primary proposal-cta-button" type="button" onClick={() => setOpen(true)}>
        {label}
      </button>

      {open && (
        <div className="proposal-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}>
          <div className="proposal-modal" role="dialog" aria-modal="true" aria-labelledby="proposal-modal-title">
            <div className="proposal-modal-head">
              <div>
                <span className="kicker">SIN COMPROMISO</span>
                <h2 id="proposal-modal-title">¿Quieres que preparemos esta web para publicar?</h2>
                <p>Déjanos un contacto y te responderemos para concretar los últimos detalles.</p>
              </div>
              <button className="proposal-modal-close" type="button" aria-label="Cerrar" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="proposal-modal-body">
              <ProposalLeadForm slug={slug} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
