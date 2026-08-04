interface PresenceProps {
  label: string;
  detail: string;
}

export function Presence({ label, detail }: PresenceProps) {
  return (
    <div className="presence-stage" aria-label={`État d’ATLAS : ${label}`}>
      <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" />
      <div className="presence-shell">
        <div className="crown" /><div className="attention"><i /><i /></div><div className="voice-organ" />
        <div className="neural neural-a" /><div className="neural neural-b" /><div className="neural neural-c" />
      </div>
      <div className="status"><span>ÉTAT</span><strong>{label}</strong><small>{detail}</small></div>
    </div>
  );
}
