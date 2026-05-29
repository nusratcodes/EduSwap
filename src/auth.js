import React, { useState } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { sendEmailVerification, signOut } from 'firebase/auth'; 
import { useAuth } from './contexts/authcontext'; 
import { db, auth } from './firebase'; 

const AuthModal = ({ type, close, switchModal, onAuthSuccess }) => {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup, login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setError(''); 
    setLoading(true); 

    try {
      if (type === 'signup') {
        
        
        const res = await signup(formData.email, formData.password);
        const user = res.user;

        
        await sendEmailVerification(user);

       
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: formData.displayName, 
          skillsToTeach: [],
          skillsToLearn: [],
          level: "Beginner"
        });

       
        await signOut(auth);

       
        alert("Account created successfully! 🌸 Please check your email inbox and click the link to verify your account before logging in.");
        close(); 

      } else if (type === 'signin') {
       
        
        const res = await login(formData.email, formData.password);
        const user = res.user;

        
        if (!user.emailVerified) {
          await signOut(auth); 
          setError("Please verify your email first! Check your inbox for the link.");
          setLoading(false);
          return; 
        }

        
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (userDoc.exists()) {
          onAuthSuccess(userDoc.data().displayName);
        } else {
          onAuthSuccess(user.email.split('@')[0]);
        }
        
        close(); 
      }

    } catch (err) {
      console.error("Auth error:", err);
      if(err.code === 'auth/email-already-in-use') {
        setError("This email is already in use. Please sign in instead.");
      } else if (err.code === 'auth/invalid-credential') {
        setError("Wrong email or password.");
      } else {
        setError("Failed to authenticate. Please check your details."); 
      }
    }

    setLoading(false); 
  };

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={close}>×</button>
        <div className="modal-header">
          <span className="modal-logo">🌸</span>
          <h2>{type === 'signin' ? 'Welcome back' : 'Join the nest'}</h2>
        </div>

        {error && <div style={{ color: '#d32f2f', background: '#ffebee', padding: '10px', borderRadius: '5px', marginBottom: '15px', textAlign: 'center', fontSize: '14px' }}>{error}</div>}

        <form className="modal-form" onSubmit={handleSubmit}>
          {type === 'signup' && (
            <div className="form-group">
              <label>Display name</label>
              <input 
                name="displayName"
                type="text" 
                placeholder="What should we call you?" 
                value={formData.displayName}
                onChange={handleChange}
                required 
              />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input 
              name="email"
              type="email" 
              placeholder="you@example.com" 
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              name="password"
              type="password" 
              placeholder="Your password" 
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6" 
            />
          </div>
          
          <button className="btn-primary full-width" type="submit" disabled={loading}>
            {loading ? 'Processing...' : (type === 'signin' ? 'Sign in' : 'Create my nest')}
          </button>
        </form>
       
      </div>
    </div>
  );
};

export default AuthModal;