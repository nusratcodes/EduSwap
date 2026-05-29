import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth'; 
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import AuthModal from './auth'; 
import Profile from './Profile';
import './App.css';
import Home from './Home';
import { AuthProvider } from './contexts/authcontext';
import Matches from './Matches';
import ConnectionRequests from './ConnectionRequests';
import UserProfile from './UserProfile';
import Connections from './Connections';
import Chat from './Chat';
import ChatList from './ChatList';

const SplashBackground = () => (
  <div className="splash-bg">
   
    <div className="watercolor-wash wash-1" />
    <div className="watercolor-wash wash-2" />
    <div className="watercolor-wash wash-3" />
    <div className="watercolor-wash wash-4" />
    <div className="watercolor-wash wash-5" />
    
   
    <div className="splatter splatter-1" />
    <div className="splatter splatter-2" />
    <div className="splatter splatter-3" />
    <div className="splatter splatter-4" />
    <div className="splatter splatter-5" />
    <div className="splatter splatter-6" />
    
    
    <div className="droplet droplet-1" />
    <div className="droplet droplet-2" />
    <div className="droplet droplet-3" />
    <div className="droplet droplet-4" />
    <div className="droplet droplet-5" />
    <div className="droplet droplet-6" />
    <div className="droplet droplet-7" />
    <div className="droplet droplet-8" />
  </div>
);

const LogoIcon = () => (
  <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transition: 'transform 0.3s ease' }}>
    <path d="M50 10 C 70 10, 70 45, 50 50 C 30 45, 30 10, 50 10 Z" fill="#ffcfd3" />
    <path d="M90 50 C 90 70, 55 70, 50 50 C 55 30, 90 30, 90 50 Z" fill="#cde4f7" />
    <path d="M50 90 C 30 90, 30 55, 50 50 C 70 55, 70 90, 50 90 Z" fill="#fedfbc" />
    <path d="M10 50 C 10 30, 45 30, 50 50 C 45 70, 10 70, 10 50 Z" fill="#d3f2d4" />
    <circle cx="50" cy="50" r="14" fill="#fef0c7" />
    <circle cx="50" cy="50" r="6" fill="#ff6b81" />
  </svg>
);


const Navbar = ({ openModal, user, handleLogout }) => (
  <nav className="navbar">
    <div className="logo" style={{ cursor: 'pointer' }}>
      <LogoIcon />
      <span>EduSwap</span>
    </div>
    <div className="nav-links">
      <a href="#how-it-works">How it works</a>
      <a href="#skills">Skills</a>
      
    </div>
    <div className="auth-buttons">
      {user ? (
        <button className="btn-text" onClick={handleLogout}>Log out</button>
      ) : (
        <>
          <button className="btn-text" onClick={() => openModal('signin')}>Sign in</button>
          <button className="btn-primary" onClick={() => openModal('signup')}>Sign up</button>
        </>
      )}
    </div>
  </nav>
);


const SimpleHeader = () => (
  <div className="simple-header" style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '16px 32px',
    position: 'relative', 
    top: 0,
    zIndex: 100,
    background: 'transparent'
  }}>
    <div className="logo" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <LogoIcon />
      <span>EduSwap</span>
    </div>
  </div>
);

const FloatingSkill = ({ icon, label, color, delay, top, left, right }) => (
  <div className="floating-skill" style={{ backgroundColor: color, animationDelay: delay, top: top, left: left, right: right }}>
    <span className="skill-icon">{icon}</span>
    <span className="skill-label">{label}</span>
  </div>
);

const Hero = ({ openModal }) => {
  const [activeBtn, setActiveBtn] = useState('start'); 
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTotalUsers = async () => {
      try {
        const db = getFirestore();
        const usersRef = collection(db, "users");
        const querySnapshot = await getDocs(usersRef);
        const userCount = querySnapshot.size;
        setTotalUsers(userCount);
      } catch (error) {
        console.error("Error fetching user count:", error);
        setTotalUsers(2400);
      } finally {
        setLoading(false);
      }
    };

    fetchTotalUsers();
  }, []);

  const scrollToHowItWorks = () => {
    const section = document.getElementById('how-it-works');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  return (
    <section className="hero">
      <div className="hero-content">
        <div className="badge">✨ A cozy place to teach & learn</div>
        <h1 className="font-extrabold text-7xl">Teach a skill,<br/>learn one back.</h1>
        <p>EduSwap pairs kind humans who want to swap what they know — painting for programming, singing for sourdough, embroidery for everything. No money. Just shared time.</p>
        
        <div 
          className={`hero-actions-container ${activeBtn === 'how' ? 'slide-right' : ''}`}
          onMouseLeave={() => setActiveBtn('start')} 
        >
          <div className="sliding-bg"></div>

          <button 
            className={`action-btn ${activeBtn === 'start' ? 'active-text' : ''}`}
            onClick={() => openModal('signup')}
            onMouseEnter={() => setActiveBtn('start')}
          >
            Start swapping →
          </button>

          <button 
            className={`action-btn ${activeBtn === 'how' ? 'active-text' : ''}`}
            onClick={scrollToHowItWorks}
            onMouseEnter={() => setActiveBtn('how')}
          >
            See how it works
          </button>
        </div>

        <div className="social-proof">
          <div className="avatars">🧑‍🦱👩‍🦰👨‍🦳👩🏽‍🦱</div>
          <span>
            {loading ? 'Loading...' : `${formatNumber(totalUsers)}+ swappers nesting together`}
          </span>
        </div>
      </div>
      
      <div className="hero-visuals">
        <FloatingSkill icon="🎨" label="Painting" color="#ffcfd3" delay="0s" top="10%" left="10%" />
        <FloatingSkill icon="🎤" label="Singing" color="#e4d4f4" delay="1s" top="15%" right="10%" />
        <FloatingSkill icon="💻" label="Programming" color="#cde4f7" delay="2s" top="40%" left="20%" />
        <FloatingSkill icon="🍳" label="Cooking" color="#fef0c7" delay="0.5s" top="45%" right="20%" />
        <FloatingSkill icon="🧵" label="Embroidery" color="#fedfbc" delay="1.5s" top="60%" left="35%" />
        <FloatingSkill icon="🪴" label="Gardening" color="#d3f2d4" delay="2.5s" top="70%" right="15%" />
        <FloatingSkill icon="📷" label="Photography" color="#cde4f7" delay="0.8s" top="80%" left="20%" />
        <FloatingSkill icon="✍️" label="Writing" color="#ffcfd3" delay="1.2s" top="85%" right="30%" />
      </div>
    </section>
  );
};

const HowItWorks = () => (
  <section id="how-it-works" className="how-it-works">
    <div className="section-header">
      <h4 className="font-extrabold text-7xl">HOW IT WORKS</h4>
      <h2 className="font-extrabold text-7xl">Three little steps</h2>
      <p>No subscriptions. No credits. Just kind humans trading what they know.</p>
    </div>
    <div className="steps-container">
      <div className="step-card">
        <div className="step-icon">🌱</div>
        <div className="step-num">STEP 01</div>
        <h3 className="font-extrabold text-7xl">Share what you love</h3>
        <p>List skills you can teach — anything from sourdough to Swift.</p>
      </div>
      <div className="step-card">
        <div className="step-icon">💖</div>
        <div className="step-num">STEP 02</div>
        <h3 className="font-extrabold text-7xl">Find your match</h3>
        <p>We pair you with someone who teaches what you want, and wants what you teach.</p>
      </div>
      <div className="step-card">
        <div className="step-icon">🌼</div>
        <div className="step-num">STEP 03</div>
        <h3 className="font-extrabold text-7xl">Swap & grow</h3>
        <p>Chat, schedule a time, and trade lessons. No money, just kindness.</p>
      </div>
    </div>
  </section>
);

const SkillPill = ({ icon, label, color }) => (
  <div className="skill-pill" style={{ backgroundColor: color }}>
    <span className="pill-icon">{icon}</span> {label}
  </div>
);

const SkillsNest = () => (
  <section id="skills" className="skills-nest">
    <div className="section-header">
      <h2 className="font-extrabold text-7xl">A nest full of skills</h2>
      <p>From the practical to the whimsical — every skill is welcome here.</p>
    </div>
    <div className="pills-container">
      <SkillPill icon="🎨" label="Painting" color="#ffcfd3" />
      <SkillPill icon="🎤" label="Singing" color="#e4d4f4" />
      <SkillPill icon="💻" label="Programming" color="#cde4f7" />
      <SkillPill icon="🍳" label="Cooking" color="#fef0c7" />
      <SkillPill icon="🧵" label="Embroidery" color="#fedfbc" />
      <SkillPill icon="🪴" label="Gardening" color="#d3f2d4" />
      <SkillPill icon="📷" label="Photography" color="#cde4f7" />
      <SkillPill icon="✍️" label="Writing" color="#ffcfd3" />
      <SkillPill icon="🧘‍♀️" label="Yoga" color="#d3f2d4" />
      <SkillPill icon="🎸" label="Guitar" color="#fedfbc" />
      <SkillPill icon="🗣️" label="Languages" color="#e4d4f4" />
      <SkillPill icon="🪡" label="Sewing" color="#ffcfd3" />
      <SkillPill icon="🧁" label="Baking" color="#fef0c7" />
      <SkillPill icon="🎥" label="Video edit" color="#cde4f7" />
    </div>
  </section>
);

const FindYourNest = ({ openModal }) => (
  <section className="cta-section">
    <div className="cta-banner">
      <div className="cta-icon-large">☕</div>
      <h2>Find your nest</h2>
      <p>Join thousands swapping skills, kindness, and a few cups of tea along the way.</p>
      <button className="btn-secondary large" onClick={() => openModal('signup')}>
        Create your free profile
      </button>
    </div>
  </section>
);

export default function App() {
  const [modalType, setModalType] = useState(null);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser((prevUser) => ({
          ...firebaseUser,
          name: firebaseUser.displayName || prevUser?.name || ''
        }));
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const loginUser = (name) => {
    setUser((prev) => ({ ...prev, name: name }));
    setModalType(null);
  };

  const handleLogout = () => {
    const auth = getAuth();
    auth.signOut().then(() => {
      setUser(null);
    });
  };

  
  const showFullNavbar = !user && location.pathname === '/';
  return (
    <AuthProvider>
      <div className="app" style={{ position: 'relative', minHeight: '100vh' }}>
        
        <SplashBackground />
        
        {showFullNavbar ? (
          <Navbar user={user} openModal={setModalType} handleLogout={handleLogout} />
        ) : (
          <SimpleHeader />
        )}
        
        <Routes>
          <Route path="/" element={
            user ? (
              <Home user={user} onLogout={handleLogout} />
            ) : (
              <>
                <Hero openModal={setModalType} />
                <HowItWorks />
                <SkillsNest />
                <FindYourNest openModal={setModalType} />
              </>
            )
          } /> 
          
          <Route path="/profile" element={<Profile user={user} />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/requests" element={<ConnectionRequests />} />
          <Route path="/user/:userId" element={<UserProfile />} />
          <Route path="/connections" element={<Connections />} />
          <Route path="/chat/:userId" element={<Chat />} />
          <Route path="/messages" element={<ChatList />} />
        </Routes>

        {modalType && (
          <AuthModal 
            type={modalType} 
            close={() => setModalType(null)} 
            switchModal={setModalType}
            onAuthSuccess={loginUser}
          />
        )}
      </div>
    </AuthProvider>
  );
}