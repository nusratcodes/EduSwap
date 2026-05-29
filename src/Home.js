import React from 'react';
import './Home.css';
import { Link } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; 

const Home = ({ user, onLogout }) => {
  const navigate = useNavigate(); 
  const [profilePhoto, setProfilePhoto] = useState('');
  const [userName, setUserName] = useState('');

  
  useEffect(() => {
    const fetchUserProfile = async () => {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        try {
          const db = getFirestore();
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setProfilePhoto(userData.photoURL || currentUser.photoURL || '');
            setUserName(userData.displayName || currentUser.displayName || user?.name || 'Swapper');
          } else {
            setProfilePhoto(currentUser.photoURL || '');
            setUserName(currentUser.displayName || user?.name || 'Swapper');
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          setUserName(user?.name || 'Swapper');
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  
  const goToMatches = () => {
    navigate('/matches');
  };

  const goToUpdateSkills = () => {
    navigate('/profile'); 
  };

  const goToChatList = () => {
    console.log("Navigating to /messages");
    navigate('/messages');
  };

  return (
    <main className="home-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="welcome-badge">🌸 Dashboard</div>
          <h1 className="font-extrabold text-4xl">Glad to see you, {userName}!</h1>
        </div>
        
        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          
          
          <Link 
            to="/profile" 
            className="user-profile" 
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}
          >
            <div className="avatar" style={{
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              backgroundColor: !profilePhoto ? '#d1cecd' : 'transparent',
              color: 'white', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              fontSize: '18px', 
              fontWeight: 'bold',
              overflow: 'hidden'
            }}>
              {profilePhoto ? (
                <img 
                  src={profilePhoto} 
                  alt="Profile" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                userName ? userName.charAt(0).toUpperCase() : ''
              )}
            </div>
            <span style={{ fontWeight: '500', fontSize: '16px' }}>Profile</span>
          </Link>
           
          
          <button className="btn-text logout-btn" onClick={onLogout}>
            Logout from Nest
          </button>
        </div>
      </header>

      <section className="dashboard-grid">
        <div className="dash-card">
          <div className="card-icon">📚</div>
          <h3 className="font-extrabold text-3xl">Your Skills</h3>
          <p className="text-gray-600 mt-2">Manage and update skills you can teach</p>
          <button className="btn-primary" onClick={goToUpdateSkills}>
            Update Skills
          </button>
        </div>

        <div className="dash-card">
          <div className="card-icon">🤝</div>
          <h3 className="font-extrabold text-3xl">Top Matches</h3>
          <p className="text-gray-600 mt-2">Find people who share your interests</p>
          <button className="btn-primary" onClick={goToMatches}>
            View Matches
          </button>
        </div>

        <div className="dash-card">
          <div className="card-icon">💬</div>
          <h3 className="font-extrabold text-3xl">Messages</h3>
          <p className="text-gray-600 mt-2">No new messages in your inbox.</p>
          <button className="btn-primary" onClick={goToChatList}>
            Open Chat
          </button>
        </div>
      </section>
    </main>
  );
};

export default Home;