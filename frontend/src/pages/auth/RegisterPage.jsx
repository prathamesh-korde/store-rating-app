import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, MapPin, Lock, Loader2, ShieldCheck, Users, Store, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { registerSchema } from '../../utils/validators';
import { getApiError } from '../../utils/formatters';

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

/* ── Role definitions ─────────────────────────────────────── */
const ROLES = [
  { id: 'admin', label: 'Admin', icon: ShieldCheck, color: '#f59e0b' },
  { id: 'owner', label: 'Store Owner', icon: Store, color: '#a78bfa' },
  { id: 'user', label: 'Consumer', icon: Users, color: '#00f0ff' },
];

/* ── Main RegisterPage Component ──────────────────────────── */
export function RegisterPage() {
  const { register: registerUser, login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const mousePos = useMousePosition();
  const [entered, setEntered] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 80);
    return () => clearTimeout(t);
  }, []);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'user' }
  });

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    try {
      await registerUser(data);
      const user = await login({ email: data.email, password: data.password });
      addToast({ message: `Account created! Welcome, ${user.name.split(' ')[0]}.`, type: 'success' });
      const paths = { admin: '/admin', owner: '/owner', user: '/user/stores' };
      navigate(paths[user.role] || '/login', { replace: true });
    } catch (err) {
      addToast({ message: getApiError(err), type: 'error' });
    }
  };

  const activeRoleConfig = ROLES.find(r => r.id === selectedRole) || ROLES[2];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=Inter:wght@400;500&display=swap');
        @keyframes floatOrb { from { transform: translate(0,0) scale(1); } to { transform: translate(18px,-28px) scale(1.1); } }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes titleIn { from { opacity:0; transform:translateY(-20px) scale(0.97); letter-spacing:0.4em; } to { opacity:1; transform:translateY(0) scale(1); letter-spacing:0.18em; } }
        @keyframes badgePulse { 0%,100% { opacity:0.7; } 50% { opacity:1; } }
        @media (pointer: fine) { body { cursor: none !important; } }
        @media (pointer: coarse) { .login-cursor { display: none !important; } body { cursor: auto !important; } }
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
          textAlign:'center', marginBottom:'clamp(16px,2vw,24px)',
          opacity: entered ? 1 : 0, transition:'opacity 0.8s',
        }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:'8px',
            padding:'4px 16px', borderRadius:'30px',
            border:'1px solid #00f0ff44', background:'#00f0ff0e',
            color:'#00f0ff', fontSize:'0.68rem', letterSpacing:'0.2em',
            textTransform:'uppercase', marginBottom:'12px',
            animation:'badgePulse 2.5s ease-in-out infinite',
          }}>
            <span style={{ width:5,height:5,borderRadius:'50%',background:'#00f0ff',display:'inline-block' }} />
            Store Rating Platform
          </div>
          <h1 style={{
            fontSize:'clamp(1.5rem,5vw,2.5rem)', fontFamily:"'Rajdhani', sans-serif",
            fontWeight:900, letterSpacing:'clamp(0.05em,2vw,0.18em)',
            textTransform:'uppercase', color:'#f0f6ff', lineHeight:1.1,
            animation:'titleIn 0.9s cubic-bezier(.23,1,.32,1) both',
            textShadow:'0 0 50px #00f0ff33, 0 2px 20px #000',
          }}>
            Create Your<br/>
            <span style={{ background:'linear-gradient(90deg, #00f0ff, #a78bfa, #f59e0b)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              Account
            </span>
          </h1>
        </div>

        {/* Form Container */}
        <div style={{ width:'100%', display:'flex', justifyContent:'center', animation:'fadeInUp 0.6s 0.3s both' }}>
          <div style={{
            background: 'linear-gradient(145deg, #0d1117f0, #161b22f0)',
            backdropFilter: 'blur(24px)',
            borderRadius: '20px',
            border: `1px solid ${activeRoleConfig.color}44`,
            padding: 'clamp(20px, 4vw, 36px)',
            width: '100%',
            maxWidth: '480px',
            boxShadow: `0 8px 48px #00000060`,
            transition: 'border-color 0.4s',
          }}>

            <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Role Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Select Role</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {ROLES.map(({ id, label, icon: Icon, color }) => (
                    <button
                      key={id} type="button"
                      onClick={() => setValue('role', id, { shouldValidate: true })}
                      style={{
                        flex: 1, padding: '8px 4px', borderRadius: '10px',
                        background: selectedRole === id ? color + '22' : '#0f172a',
                        border: `1.5px solid ${selectedRole === id ? color : '#1e293b'}`,
                        color: selectedRole === id ? color : '#94a3b8',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                        cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: selectedRole === id ? `0 0 12px ${color}33` : 'none',
                      }}
                    >
                      <Icon size={18} />
                      <span style={{ fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', fontFamily: "'Rajdhani', sans-serif" }}>{label}</span>
                    </button>
                  ))}
                </div>
                {errors.role && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>{errors.role.message}</p>}
              </div>

              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Full Name <span style={{color: '#ef4444'}}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563', pointerEvents: 'none' }} />
                  <input
                    type="text" {...register('name')}
                    placeholder="e.g. John Doe (min 20 chars)"
                    style={{
                      width: '100%', padding: '11px 14px 11px 40px',
                      background: '#0f172a', border: `1.5px solid ${errors.name ? '#ef4444' : '#1e293b'}`,
                      borderRadius: '10px', color: '#f1f5f9', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.3s',
                      fontFamily: "'Inter', sans-serif", boxSizing: 'border-box',
                    }}
                    onFocus={e => { if (!errors.name) e.target.style.borderColor = activeRoleConfig.color + '88'; }}
                    onBlur={e => { if (!errors.name) e.target.style.borderColor = '#1e293b'; }}
                  />
                </div>
                {errors.name && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>{errors.name.message}</p>}
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Email Address <span style={{color: '#ef4444'}}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563', pointerEvents: 'none' }} />
                  <input
                    type="email" {...register('email')}
                    placeholder="you@example.com"
                    style={{
                      width: '100%', padding: '11px 14px 11px 40px',
                      background: '#0f172a', border: `1.5px solid ${errors.email ? '#ef4444' : '#1e293b'}`,
                      borderRadius: '10px', color: '#f1f5f9', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.3s',
                      fontFamily: "'Inter', sans-serif", boxSizing: 'border-box',
                    }}
                    onFocus={e => { if (!errors.email) e.target.style.borderColor = activeRoleConfig.color + '88'; }}
                    onBlur={e => { if (!errors.email) e.target.style.borderColor = '#1e293b'; }}
                  />
                </div>
                {errors.email && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>{errors.email.message}</p>}
              </div>

              {/* Address */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Address <span style={{ color: '#64748b', textTransform: 'none' }}>(optional)</span></label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563', pointerEvents: 'none' }} />
                  <input
                    type="text" {...register('address')}
                    placeholder="123 Main Street, City"
                    style={{
                      width: '100%', padding: '11px 14px 11px 40px',
                      background: '#0f172a', border: `1.5px solid ${errors.address ? '#ef4444' : '#1e293b'}`,
                      borderRadius: '10px', color: '#f1f5f9', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.3s',
                      fontFamily: "'Inter', sans-serif", boxSizing: 'border-box',
                    }}
                    onFocus={e => { if (!errors.address) e.target.style.borderColor = activeRoleConfig.color + '88'; }}
                    onBlur={e => { if (!errors.address) e.target.style.borderColor = '#1e293b'; }}
                  />
                </div>
                {errors.address && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>{errors.address.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Password <span style={{color: '#ef4444'}}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563', pointerEvents: 'none' }} />
                  <input
                    type={showPw ? 'text' : 'password'} {...register('password')}
                    placeholder="8–16 chars, 1 uppercase, 1 special"
                    style={{
                      width: '100%', padding: '11px 42px 11px 40px',
                      background: '#0f172a', border: `1.5px solid ${errors.password ? '#ef4444' : '#1e293b'}`,
                      borderRadius: '10px', color: '#f1f5f9', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.3s',
                      fontFamily: "'Inter', sans-serif", boxSizing: 'border-box',
                    }}
                    onFocus={e => { if (!errors.password) e.target.style.borderColor = activeRoleConfig.color + '88'; }}
                    onBlur={e => { if (!errors.password) e.target.style.borderColor = '#1e293b'; }}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>{errors.password.message}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit" disabled={isSubmitting}
                style={{
                  marginTop: '10px', padding: '12px', borderRadius: '10px', border: 'none',
                  background: `linear-gradient(135deg, ${activeRoleConfig.color}cc, ${activeRoleConfig.color}88)`,
                  color: '#000', fontSize: '0.95rem', fontWeight: '700',
                  fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'all 0.3s',
                  boxShadow: !isSubmitting ? `0 4px 20px ${activeRoleConfig.color}44` : 'none',
                }}
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <User size={17} />}
                {isSubmitting ? 'Creating Account...' : 'Register'}
              </button>
            </form>

            {/* Login Link */}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: "'Inter', sans-serif" }}>
                Already have an account?{' '}
                <Link
                  to="/login"
                  style={{ color: activeRoleConfig.color, textDecoration: 'none', fontWeight: '600', transition: 'opacity 0.2s' }}
                  onMouseOver={(e) => e.target.style.opacity = '0.8'}
                  onMouseOut={(e) => e.target.style.opacity = '1'}
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p style={{ marginTop:'24px', color:'#334155', fontSize:'0.68rem', letterSpacing:'0.14em', textTransform:'uppercase' }}>
          Secured · Encrypted · Authenticated
        </p>
      </div>
    </>
  );
}
