import { useState } from 'react';
import { useEducation } from '../context/EducationContext.jsx';

// Renders nothing unless Learning mode is on. Tap the "i" to expand a plain
// explanation inline (no floating popover, so it behaves on touch screens).
export default function InfoTip({ children, label = 'What does this mean?' }) {
  const { on } = useEducation();
  const [open, setOpen] = useState(false);
  if (!on) return null;
  return (
    <span className="infotip">
      <button type="button" className="infotip-btn" aria-expanded={open} aria-label={label} onClick={() => setOpen((v) => !v)}>i</button>
      {open && <span className="infotip-body" role="note">{children}</span>}
    </span>
  );
}
