import React from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Shield, 
  Zap, 
  BarChart3, 
  Clock, 
  ArrowRight,
  Database,
  Cpu,
  Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';
import '../styles/design-system.css';

const LandingPage: React.FC = () => {

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  } as const;

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100
      }
    }
  } as const;

  const navLinks = [
    { name: 'Características', href: '#features' },
    { name: 'Soluciones', href: '#solutions' },
    { name: 'Empresa', href: '#about' },
  ];

  return (
    <div className="landing-container" style={{ background: 'var(--color-background)', minHeight: '100vh' }}>
      {/* Animated Background Blobs */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ 
          position: 'absolute', 
          top: '-10%', 
          right: '-10%', 
          width: '600px', 
          height: '600px', 
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, rgba(14, 165, 233, 0) 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)'
        }} />
        <div style={{ 
          position: 'absolute', 
          bottom: '-10%', 
          left: '-10%', 
          width: '500px', 
          height: '500px', 
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, rgba(56, 189, 248, 0) 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)'
        }} />
      </div>

      {/* Navigation */}
      <nav style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1000, 
        background: 'rgba(255, 255, 255, 0.7)', 
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(14, 165, 233, 0.1)',
        padding: '0.75rem 0'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', 
              width: '36px', 
              height: '36px', 
              borderRadius: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)'
            }}>
              <Settings color="white" size={20} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-text)', letterSpacing: '-0.02em' }}>ManSole</span>
          </div>

          <div className="desktop-nav" style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} style={{ 
                textDecoration: 'none', 
                color: 'var(--color-text)', 
                fontWeight: 600, 
                fontSize: '0.925rem',
                transition: 'color 0.2s',
                opacity: 0.8
              }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}>
                {link.name}
              </a>
            ))}
            <div style={{ width: '1px', height: '24px', background: 'var(--color-border)', margin: '0 0.5rem' }} />
            <Link to="/login" style={{ textDecoration: 'none', color: 'var(--color-text)', fontWeight: 600, fontSize: '0.925rem' }}>Iniciar Sesión</Link>
            <Link to="/register" className="btn-primary" style={{ padding: '10px 20px', borderRadius: '100px' }}>
              Comenzar Ahora
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ 
        position: 'relative',
        padding: '120px 2rem 80px', 
        textAlign: 'center',
        zIndex: 1
      }}>
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          style={{ maxWidth: '1000px', margin: '0 auto' }}
        >
          <motion.div variants={itemVariants} style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.625rem', 
            background: 'rgba(14, 165, 233, 0.08)', 
            padding: '0.5rem 1.25rem', 
            borderRadius: '100px', 
            marginBottom: '2rem',
            border: '1px solid rgba(14, 165, 233, 0.2)',
            backdropFilter: 'blur(4px)'
          }}>
            <Zap size={14} color="var(--color-primary)" fill="var(--color-primary)" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revolucionando el Mantenimiento Industrial</span>
          </motion.div>

          <motion.h1 variants={itemVariants} style={{ 
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', 
            fontWeight: 900, 
            lineHeight: 1.05,
            color: 'var(--color-text)',
            marginBottom: '1.5rem',
            letterSpacing: '-0.04em'
          }}>
            Gestione su planta con <span style={{ 
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>precisión quirúrgica</span>
          </motion.h1>

          <motion.p variants={itemVariants} style={{ 
            fontSize: '1.25rem', 
            color: 'var(--color-text-muted)', 
            maxWidth: '750px', 
            margin: '0 auto 3rem auto',
            lineHeight: 1.6,
            fontWeight: 500
          }}>
            La plataforma CMMS inteligente que integra gestión de activos, mantenimiento preventivo y analítica avanzada para maximizar su eficiencia operativa.
          </motion.p>

          <motion.div variants={itemVariants} style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', alignItems: 'center' }}>
            <Link to="/register" className="btn-primary" style={{ padding: '18px 40px', fontSize: '1.125rem', borderRadius: '14px', boxShadow: '0 10px 30px rgba(14, 165, 233, 0.25)' }}>
              Prueba Gratuita de 14 Días <ArrowRight size={20} />
            </Link>
            <a href="#demo" className="btn-secondary" style={{ padding: '18px 40px', fontSize: '1.125rem', borderRadius: '14px' }}>
              Solicitar Demo
            </a>
          </motion.div>

          {/* Hero Image/Mockup Placeholder */}
          <motion.div variants={itemVariants} style={{ 
            marginTop: '5rem',
            position: 'relative',
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.4)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.1)',
            maxWidth: '1100px',
            margin: '5rem auto 0'
          }}>
            <div style={{ 
              width: '100%', 
              height: '500px', 
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
               <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40px', background: '#e2e8f0', display: 'flex', alignItems: 'center', padding: '0 1rem', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f57' }} />
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }} />
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#28c940' }} />
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '80%' }}>
                  <div style={{ height: '20px', width: '40%', background: '#cbd5e1', borderRadius: '4px' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                    {[1,2,3].map(i => <div key={i} style={{ height: '120px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }} />)}
                  </div>
                  <div style={{ height: '150px', width: '100%', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
               </div>
               {/* Overlaying Floating Elements */}
               <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'absolute', top: '20%', right: '10%', background: 'white', padding: '1rem', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-border)', width: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Activos Operativos</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>98.4%</div>
               </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Social Proof */}
      <section style={{ padding: '4rem 2rem', background: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '3rem', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Empresas que confían en ManSole</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '5rem', opacity: 0.5, filter: 'grayscale(1)', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: '1.75rem', letterSpacing: '-0.05em' }}>MT INDUSTRIAL</div>
            <div style={{ fontWeight: 900, fontSize: '1.75rem', letterSpacing: '-0.05em' }}>LOGISUR</div>
            <div style={{ fontWeight: 900, fontSize: '1.75rem', letterSpacing: '-0.05em' }}>MANUFACTURE</div>
            <div style={{ fontWeight: 900, fontSize: '1.75rem', letterSpacing: '-0.05em' }}>SOLUTIONS</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: '100px 2rem', background: '#F8FAFC' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1.25rem', letterSpacing: '-0.03em' }}>Potencia su capacidad industrial</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1.25rem', maxWidth: '700px', margin: '0 auto', fontWeight: 500 }}>Herramientas de última generación para el control total del ciclo de vida de sus activos.</p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '2.5rem' 
          }}>
            <FeatureCard 
              icon={<Shield size={28} />}
              color="#0EA5E9"
              title="Control de Activos 360°"
              description="Visualice la jerarquía completa de su planta. Desde la planta hasta el componente más pequeño, todo bajo control."
            />
            <FeatureCard 
              icon={<Clock size={28} />}
              color="#F97316"
              title="Mantenimiento Inteligente"
              description="Algoritmos de programación que optimizan las rutas de mantenimiento preventivo y reducen el MTTR significativamente."
            />
            <FeatureCard 
              icon={<BarChart3 size={28} />}
              color="#16A34A"
              title="Analítica Predictiva"
              description="Identifique patrones de falla antes de que ocurran. Dashboards en tiempo real con KPIs críticos para la toma de decisiones."
            />
            <FeatureCard 
              icon={<Database size={28} />}
              color="#8B5CF6"
              title="Gestión de Inventario"
              description="Control de stock de repuestos integrado con las órdenes de trabajo para asegurar que nunca falte lo esencial."
            />
            <FeatureCard 
              icon={<Cpu size={28} />}
              color="#EC4899"
              title="Integración IoT"
              description="Conecte sus sensores directamente a ManSole para monitoreo de condición automatizado y alertas instantáneas."
            />
            <FeatureCard 
              icon={<Globe size={28} />}
              color="#06B6D4"
              title="Acceso Multi-Planta"
              description="Gestione múltiples sedes geográficas desde una única consola centralizada con roles y permisos granulares."
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '100px 2rem', background: 'var(--color-text)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          background: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")', 
          opacity: 0.1 
        }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '4rem', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <StatItem value="30%" label="Reducción de Costos OPEX" />
          <StatItem value="99.9%" label="Disponibilidad Garantizada" />
          <StatItem value="15k+" label="Equipos Gestionados" />
          <StatItem value="1.2M" label="Ordenes de Trabajo/Año" />
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '120px 2rem', background: 'white', textAlign: 'center' }}>
        <div style={{ 
          maxWidth: '1000px', 
          margin: '0 auto', 
          padding: '80px 40px', 
          background: 'linear-gradient(135deg, #0C4A6E 0%, #082F49 100%)', 
          borderRadius: '40px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(12, 74, 110, 0.4)'
        }}>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'var(--color-primary)', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.4 }} />
          <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>¿Listo para optimizar su operación?</h2>
          <p style={{ fontSize: '1.25rem', opacity: 0.8, marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>Únase a los líderes industriales que ya están transformando su mantenimiento con ManSole.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/register" className="btn-primary" style={{ background: 'white', color: 'var(--color-text)', padding: '18px 40px', fontSize: '1.125rem' }}>
              Empezar Gratis
            </Link>
            <Link to="/contact" className="btn-secondary" style={{ border: '2px solid white', color: 'white', padding: '18px 40px', fontSize: '1.125rem' }}>
              Contactar Ventas
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '80px 2rem 40px', background: '#F8FAFC', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '4rem' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--color-primary)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Settings color="white" size={18} />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-text)', letterSpacing: '-0.02em' }}>ManSole</span>
            </div>
            <p style={{ color: 'var(--color-text-muted)', maxWidth: '320px', lineHeight: 1.6, fontSize: '0.925rem' }}>
              Transformando la gestión de mantenimiento industrial a través de inteligencia de datos y diseño centrado en el usuario.
            </p>
          </div>
          
          <div>
            <h5 style={{ fontWeight: 800, marginBottom: '1.75rem', fontSize: '1rem', color: 'var(--color-text)' }}>Producto</h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li><FooterLink href="#">Características</FooterLink></li>
              <li><FooterLink href="#">Analítica</FooterLink></li>
              <li><FooterLink href="#">Seguridad</FooterLink></li>
              <li><FooterLink href="#">Precios</FooterLink></li>
            </ul>
          </div>

          <div>
            <h5 style={{ fontWeight: 800, marginBottom: '1.75rem', fontSize: '1rem', color: 'var(--color-text)' }}>Compañía</h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li><FooterLink href="#">Sobre Nosotros</FooterLink></li>
              <li><FooterLink href="#">Sostenibilidad</FooterLink></li>
              <li><FooterLink href="#">Carreras</FooterLink></li>
              <li><FooterLink href="#">Contacto</FooterLink></li>
            </ul>
          </div>

          <div>
            <h5 style={{ fontWeight: 800, marginBottom: '1.75rem', fontSize: '1rem', color: 'var(--color-text)' }}>Soporte</h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li><FooterLink href="#">Documentación</FooterLink></li>
              <li><FooterLink href="#">Centro de Ayuda</FooterLink></li>
              <li><FooterLink href="#">Estado del Sistema</FooterLink></li>
              <li><FooterLink href="#">Webinars</FooterLink></li>
            </ul>
          </div>
        </div>

        <div style={{ maxWidth: '1280px', margin: '60px auto 0', paddingTop: '30px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          <span>© 2026 ManSole Intelligence. Todos los derechos reservados.</span>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <FooterLink href="#">Privacidad</FooterLink>
            <FooterLink href="#">Términos</FooterLink>
            <FooterLink href="#">Cookies</FooterLink>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, description: string, color: string }> = ({ icon, title, description, color }) => (
  <motion.div 
    whileHover={{ y: -8 }}
    className="card" 
    style={{ 
      background: 'white', 
      padding: '3rem 2.5rem', 
      borderRadius: '24px', 
      border: '1px solid var(--color-border)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
    }}>
    <div style={{ 
      background: `${color}15`, 
      color: color,
      width: '64px', 
      height: '64px', 
      borderRadius: '18px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      marginBottom: '2rem' 
    }}>
      {icon}
    </div>
    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--color-text)', letterSpacing: '-0.02em' }}>{title}</h3>
    <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, fontSize: '1rem', fontWeight: 500 }}>{description}</p>
  </motion.div>
);

const StatItem: React.FC<{ value: string, label: string }> = ({ value, label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    <h4 style={{ fontSize: '3.5rem', fontWeight: 900, color: 'white', letterSpacing: '-0.04em' }}>{value}</h4>
    <p style={{ color: 'white', opacity: 0.7, fontWeight: 600, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
  </div>
);

const FooterLink: React.FC<{ href: string, children: React.ReactNode }> = ({ href, children }) => (
  <a href={href} style={{ textDecoration: 'none', color: 'var(--color-text-muted)', transition: 'color 0.2s', fontWeight: 500 }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}>
    {children}
  </a>
);

export default LandingPage;

