import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { getApiError } from '../../utils/formatters';

/* ── Role definitions ─────────────────────────────────────── */
const ROLES = [
  {
    id: 'admin',
    label: 'System Admin',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
        <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="2.5"/>
        <circle cx="32" cy="32" r="8" stroke="currentColor" strokeWidth="2.5" fill="currentColor" opacity="0.2"/>
        <path d="M32 10v6M32 48v6M10 32h6M48 32h6M16.93 16.93l4.24 4.24M42.83 42.83l4.24 4.24M47.07 16.93l-4.24 4.24M21.17 42.83l-4.24 4.24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
    color: '#f59e0b',
    shadow: '0 0 40px #f59e0b55',
    desc: 'Full system control',
    particle: '#f59e0b',
    loginPath: null,
  },
  {
    id: 'owner',
    label: 'Store Owner',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
        <rect x="8" y="28" width="48" height="28" rx="4" stroke="currentColor" strokeWidth="2.5"/>
        <path d="M16 28V20a16 16 0 0132 0v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <rect x="24" y="38" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.2"/>
      </svg>
    ),
    color: '#a78bfa',
    shadow: '0 0 40px #a78bfa55',
    desc: 'Manage & track your store',
    particle: '#a78bfa',
    loginPath: null,
  },
  {
    id: 'user',
    label: 'Consumer',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
        <circle cx="32" cy="20" r="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M10 54c0-12.15 9.85-22 22-22s22 9.85 22 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="32" cy="20" r="5" fill="currentColor" opacity="0.25"/>
      </svg>
    ),
    color: '#00f0ff',
    shadow: '0 0 40px #00f0ff55',
    desc: 'Browse & rate local stores',
    particle: '#00f0ff',
    loginPath: null,
  },
];

/* ── Mouse position hook ──────────────────────────────────── */
function useMousePosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const h = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('pointermove', h);
    return () => window.removeEventListener('pointermove', h);
  }, []);
  return pos;
}

/* ── Particle canvas ──────────────────────────────────────── */
function ParticleField({ color, active }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const pts = Array.from({ length: 24 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.65,
      vy: (Math.random() - 0.5) * 0.65,
      r: Math.random() * 2.2 + 0.4,
      o: Math.random() * 0.65 + 0.2,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = color + Math.round(p.o * 255).toString(16).padStart(2, '0');
        ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [active, color]);
  return (
    <canvas ref={canvasRef} style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      opacity: active ? 1 : 0, transition: 'opacity 0.4s',
      borderRadius: 'inherit', pointerEvents: 'none',
    }} />
  );
}

/* ── Role Card ────────────────────────────────────────────── */
function RoleCard({ role, selected, onSelect }) {
  const cardRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMove = (e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    setTilt({ x: dy * -12, y: dx * 12 });
  };

  const active = hovered || selected;

  return (
    <div
      ref={cardRef}
      onPointerMove={handleMove}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => { setHovered(false); setTilt({ x: 0, y: 0 }); }}
      onClick={() => onSelect(role.id)}
      style={{
        position: 'relative', cursor: 'pointer', borderRadius: '18px',
        padding: '2px',
        background: active
          ? `linear-gradient(135deg, ${role.color}99, ${role.color}22, ${role.color}66)`
          : 'linear-gradient(135deg, #ffffff14, #ffffff06)',
        boxShadow: selected ? role.shadow : active ? role.shadow + '88' : '0 4px 24px #00000055',
        transform: `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${selected ? 1.05 : active ? 1.03 : 1}) translateY(${active ? -6 : 0}px)`,
        transition: 'transform 0.18s cubic-bezier(.23,1,.32,1), box-shadow 0.3s, background 0.3s',
        outline: selected ? `2px solid ${role.color}` : 'none',
        outlineOffset: '2px',
      }}
    >
      <div style={{
        borderRadius: '16px',
        background: 'linear-gradient(145deg, #0d1117ee, #161b22ee)',
        backdropFilter: 'blur(18px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '10px', justifyContent: 'center',
        padding: 'clamp(16px, 3vw, 28px) clamp(12px, 2vw, 20px)',
        position: 'relative', overflow: 'hidden',
        minHeight: 'clamp(150px, 20vw, 190px)',
      }}>
        <ParticleField color={role.particle} active={active} />
        {/* Glow orb */}
        <div style={{
          position: 'absolute', width: '100px', height: '100px', borderRadius: '50%',
          background: role.color + '20', filter: 'blur(28px)',
          top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          opacity: active ? 1 : 0, transition: 'opacity 0.4s', pointerEvents: 'none',
        }} />
        {/* Scan line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: `linear-gradient(90deg, transparent, ${role.color}, transparent)`,
          opacity: active ? 1 : 0, transition: 'opacity 0.3s',
          animation: active ? 'scanline 1.8s linear infinite' : 'none',
        }} />
        {/* Icon */}
        <div style={{
          color: role.color,
          filter: active ? `drop-shadow(0 0 10px ${role.color})` : 'none',
          transition: 'filter 0.3s, transform 0.3s',
          transform: active ? 'scale(1.1)' : 'scale(1)',
        }}>
          {role.icon}
        </div>
        {/* Label */}
        <p style={{
          fontSize: '0.9rem', fontWeight: '700', letterSpacing: '0.06em',
          color: active ? role.color : '#e2e8f0', transition: 'color 0.3s',
          textAlign: 'center', fontFamily: "'Rajdhani', sans-serif",
          textTransform: 'uppercase',
          textShadow: active ? `0 0 14px ${role.color}88` : 'none',
        }}>
          {role.label}
        </p>
        {/* Desc */}
        <p style={{
          fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center',
          opacity: active ? 1 : 0.6, transition: 'opacity 0.3s',
          fontFamily: "'Inter', sans-serif",
        }}>
          {role.desc}
        </p>
        {/* Selected indicator */}
        {selected && (
          <div style={{
            marginTop: '4px', padding: '4px 16px', borderRadius: '20px',
            border: `1px solid ${role.color}66`, color: role.color,
            fontSize: '0.68rem', fontFamily: "'Rajdhani', monospace",
            letterSpacing: '0.12em', textTransform: 'uppercase',
            background: role.color + '18',
          }}>
            Selected ✓
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Animated Background ──────────────────────────────────── */
function GridBg({ mousePos }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 60%, #0f1f3d 0%, #060b14 60%, #020408 100%)',
      }} />
      <div style={{
        position: 'absolute', width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, #1e40af18 0%, transparent 70%)',
        left: mousePos.x - 300, top: mousePos.y - 300,
        transition: 'left 0.12s, top 0.12s', pointerEvents: 'none',
      }} />
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.1 }}>
        <defs>
          <pattern id="sg" width="56" height="56" patternUnits="userSpaceOnUse">
            <path d="M 56 0 L 0 0 0 56" fill="none" stroke="#38bdf8" strokeWidth="0.6"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#sg)" />
      </svg>
      {[
        { x: '12%', y: '18%', c: '#00f0ff', s: 180, d: 7 },
        { x: '82%', y: '72%', c: '#a78bfa', s: 220, d: 11 },
        { x: '72%', y: '12%', c: '#34d399', s: 150, d: 9 },
        { x: '20%', y: '78%', c: '#f59e0b', s: 140, d: 13 },
      ].map((o, i) => (
        <div key={i} style={{
          position: 'absolute', left: o.x, top: o.y, width: o.s, height: o.s,
          borderRadius: '50%', background: `radial-gradient(circle, ${o.c}20 0%, transparent 70%)`,
          filter: `blur(${o.s / 3}px)`,
          animation: `floatOrb ${o.d}s ease-in-out infinite alternate`,
          animationDelay: `${i * 1.5}s`, pointerEvents: 'none',
        }} />
      ))}
    </div>
  );
}

/* ── Login Form ───────────────────────────────────────────── */
function LoginForm({ selectedRole, onLogin, loading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const role = ROLES.find(r => r.id === selectedRole);

  return (
    <div style={{
      background: 'linear-gradient(145deg, #0d1117f0, #161b22f0)',
      backdropFilter: 'blur(24px)',
      borderRadius: '20px',
      border: `1px solid ${role ? role.color + '44' : '#ffffff15'}`,
      padding: 'clamp(24px, 4vw, 40px)',
      width: '100%',
      maxWidth: '420px',
      boxShadow: role ? role.shadow : '0 8px 48px #00000060',
      transition: 'border-color 0.4s, box-shadow 0.4s',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        {role && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            color: role.color, marginBottom: '12px',
          }}>
            <span style={{ display: 'inline-flex' }}>{role.icon && <span style={{ transform: 'scale(0.65)' }}>{role.icon}</span>}</span>
          </div>
        )}
        <h2 style={{
          fontSize: '1.4rem', fontWeight: '800', color: '#f0f6ff',
          fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          {role ? `${role.label} Login` : 'Select a Role'}
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '6px', fontFamily: "'Inter', sans-serif" }}>
          {role ? role.desc : 'Choose your portal above to continue'}
        </p>

        {role && (
          <button
            type="button"
            onClick={() => {
              if (selectedRole === 'admin') {
                setEmail('admin@platform.com');
                setPassword('Admin@12345');
              } else if (selectedRole === 'owner') {
                setEmail('owner1@stores.com');
                setPassword('Owner1@pass');
              } else if (selectedRole === 'user') {
                setEmail('alice@example.com');
                setPassword('Alice@1234');
              }
            }}
            style={{
              marginTop: '12px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: '#1e293b',
              color: '#94a3b8',
              border: '1px solid #334155',
              fontSize: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#334155';
              e.target.style.color = '#f8fafc';
            }}
            onMouseOut={(e) => {
              e.target.style.background = '#1e293b';
              e.target.style.color = '#94a3b8';
            }}
          >
            Use Demo Credentials
          </button>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onLogin(email, password); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Email */}
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Email Address</label>
          <div style={{ position: 'relative' }}>
            <Mail size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563', pointerEvents: 'none' }} />
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required disabled={!selectedRole}
              style={{
                width: '100%', padding: '11px 14px 11px 40px',
                background: '#0f172a', border: `1.5px solid ${role ? role.color + '33' : '#1e293b'}`,
                borderRadius: '10px', color: '#f1f5f9', fontSize: '0.9rem',
                outline: 'none', transition: 'border-color 0.3s',
                fontFamily: "'Inter', sans-serif",
                boxSizing: 'border-box',
              }}
              onFocus={e => { if (role) e.target.style.borderColor = role.color + '88'; }}
              onBlur={e => { if (role) e.target.style.borderColor = role.color + '33'; }}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Password</label>
          <div style={{ position: 'relative' }}>
            <Lock size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563', pointerEvents: 'none' }} />
            <input
              type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Your password" required disabled={!selectedRole}
              style={{
                width: '100%', padding: '11px 42px 11px 40px',
                background: '#0f172a', border: `1.5px solid ${role ? role.color + '33' : '#1e293b'}`,
                borderRadius: '10px', color: '#f1f5f9', fontSize: '0.9rem',
                outline: 'none', transition: 'border-color 0.3s',
                fontFamily: "'Inter', sans-serif",
                boxSizing: 'border-box',
              }}
              onFocus={e => { if (role) e.target.style.borderColor = role.color + '88'; }}
              onBlur={e => { if (role) e.target.style.borderColor = role.color + '33'; }}
            />
            <button type="button" onClick={() => setShowPw(v => !v)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}>
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit" disabled={!selectedRole || loading}
          style={{
            marginTop: '6px',
            padding: '12px',
            borderRadius: '10px',
            border: 'none',
            background: role ? `linear-gradient(135deg, ${role.color}cc, ${role.color}88)` : '#1e293b',
            color: role ? '#000' : '#475569',
            fontSize: '0.95rem', fontWeight: '700',
            fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: selectedRole && !loading ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'all 0.3s',
            boxShadow: role && !loading ? `0 4px 20px ${role.color}44` : 'none',
          }}
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={17} />}
          {loading ? 'Signing in...' : 'Enter Portal'}
        </button>
      </form>

      {/* Registration Link */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: "'Inter', sans-serif" }}>
          Don't have an account?{' '}
          <Link
            to="/register"
            style={{
              color: role ? role.color : '#38bdf8',
              textDecoration: 'none',
              fontWeight: '600',
              transition: 'opacity 0.2s'
            }}
            onMouseOver={(e) => e.target.style.opacity = '0.8'}
            onMouseOut={(e) => e.target.style.opacity = '1'}
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ── Main LoginPage Component ─────────────────────────────── */
export function LoginPage() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const mousePos = useMousePosition();
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleLogin = async (email, password) => {
    if (!selectedRole) { addToast({ message: 'Please select a role.', type: 'error' }); return; }
    setLoading(true);
    try {
      const user = await login({ email, password });
      if (user.role !== selectedRole) {
        addToast({ message: `Access denied. This portal is for ${ROLES.find(r => r.id === selectedRole)?.label}s.`, type: 'error' });
        return;
      }
      addToast({ message: `Welcome back! Redirecting...`, type: 'success' });
      const paths = { admin: '/admin', owner: '/owner', user: '/user/stores' };
      navigate(paths[user.role] || '/');
    } catch (err) {
      addToast({ message: getApiError(err), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=Inter:wght@400;500&display=swap');
        @keyframes floatOrb { from { transform: translate(0,0) scale(1); } to { transform: translate(18px,-28px) scale(1.1); } }
        @keyframes scanline { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes titleIn { from { opacity:0; transform:translateY(-20px) scale(0.97); letter-spacing:0.4em; } to { opacity:1; transform:translateY(0) scale(1); letter-spacing:0.18em; } }
        @keyframes badgePulse { 0%,100% { opacity:0.7; } 50% { opacity:1; } }
        @media (pointer: fine) { body { cursor: none !important; } }
        @media (pointer: coarse) { .login-cursor { display: none !important; } body { cursor: auto !important; } }
        .login-role-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: clamp(10px,2vw,18px); }
        @media (max-width: 600px) { .login-role-grid { grid-template-columns: 1fr !important; gap: 10px !important; } }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 40px #0f172a inset !important; -webkit-text-fill-color: #f1f5f9 !important; }
      `}</style>

      {/* Custom Cursor */}
      <div className="login-cursor" style={{ position:'fixed', left:mousePos.x, top:mousePos.y, width:26, height:26, borderRadius:'50%', border:'2px solid #00f0ffcc', transform:'translate(-50%,-50%)', pointerEvents:'none', zIndex:9999, transition:'left 0.04s, top 0.04s', boxShadow:'0 0 10px #00f0ff55' }} />
      <div className="login-cursor" style={{ position:'fixed', left:mousePos.x, top:mousePos.y, width:5, height:5, borderRadius:'50%', background:'#00f0ff', transform:'translate(-50%,-50%)', pointerEvents:'none', zIndex:9999 }} />

      <GridBg mousePos={mousePos} />

      <div style={{
        position:'relative', zIndex:1, minHeight:'100vh',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        padding:'clamp(20px,4vh,40px) clamp(16px,4vw,32px)',
        fontFamily:"'Rajdhani', sans-serif", overflowX:'hidden',
      }}>
        {/* Header */}
        <div style={{
          textAlign:'center', marginBottom:'clamp(20px,3vw,36px)',
          opacity: entered ? 1 : 0, transition:'opacity 0.8s',
        }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:'8px',
            padding:'4px 16px', borderRadius:'30px',
            border:'1px solid #00f0ff44', background:'#00f0ff0e',
            color:'#00f0ff', fontSize:'0.68rem', letterSpacing:'0.2em',
            textTransform:'uppercase', marginBottom:'16px',
            animation:'badgePulse 2.5s ease-in-out infinite',
          }}>
            <span style={{ width:5,height:5,borderRadius:'50%',background:'#00f0ff',display:'inline-block' }} />
            Store Rating Platform
          </div>
          <h1 style={{
            fontSize:'clamp(1.5rem,6vw,3rem)', fontFamily:"'Rajdhani', sans-serif",
            fontWeight:900, letterSpacing:'clamp(0.05em,2vw,0.18em)',
            textTransform:'uppercase', color:'#f0f6ff', lineHeight:1.1,
            animation:'titleIn 0.9s cubic-bezier(.23,1,.32,1) both',
            textShadow:'0 0 50px #00f0ff33, 0 2px 20px #000',
          }}>
            Choose Your<br/>
            <span style={{ background:'linear-gradient(90deg, #00f0ff, #a78bfa, #f59e0b)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              Portal
            </span>
          </h1>
          <p style={{ marginTop:'10px', color:'#64748b', fontSize:'0.85rem', letterSpacing:'0.05em', fontFamily:"'Inter', sans-serif" }}>
            Select your role, then sign in to access your dashboard
          </p>
        </div>

        {/* Role Cards */}
        <div className="login-role-grid" style={{ width:'100%', maxWidth:'680px', marginBottom:'clamp(20px,3vw,32px)' }}>
          {ROLES.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              selected={selectedRole === role.id}
              onSelect={(id) => setSelectedRole(prev => prev === id ? '' : id)}
            />
          ))}
        </div>

        {/* Login Form */}
        <div style={{ width:'100%', display:'flex', justifyContent:'center', animation:'fadeInUp 0.6s 0.3s both' }}>
          <LoginForm selectedRole={selectedRole} onLogin={handleLogin} loading={loading} />
        </div>

        {/* Footer */}
        <p style={{ marginTop:'24px', color:'#334155', fontSize:'0.68rem', letterSpacing:'0.14em', textTransform:'uppercase' }}>
          Secured · Encrypted · Authenticated
        </p>
      </div>
    </>
  );
}
