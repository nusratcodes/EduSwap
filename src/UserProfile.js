// UserProfile.js - Fixed version with working chat navigation
import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    fetchUserProfile();
    checkConnectionStatus();
  }, [userId]);

  const fetchUserProfile = async () => {
    const db = getFirestore();
    
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setUser({
          id: userId,
          name: userData.displayName || userData.email?.split('@')[0],
          photoURL: userData.photoURL || '',
          bio: userData.bio || '',
          teachSkills: userData.teachSkills || [],
          learnSkills: userData.learnSkills || [],
          email: userData.email
        });
      } else {
        alert("User not found");
        navigate('/matches');
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    const db = getFirestore();
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) return;
    
    try {
      const connectionsQuery = query(
        collection(db, "connections"),
        where("userId1", "in", [currentUser.uid, userId]),
        where("userId2", "in", [currentUser.uid, userId]),
        where("status", "==", "active")
      );
      const snapshot = await getDocs(connectionsQuery);
      setIsConnected(!snapshot.empty);
    } catch (error) {
      console.error("Error checking connection:", error);
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  const startChat = () => {
    navigate(`/chat/${userId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#A15D83]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">User not found</p>
          <button onClick={goBack} className="mt-4 bg-[#A15D83] text-white px-6 py-2 rounded-full">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] py-10 px-4 md:px-20 font-sans">
      
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={goBack}
            className="bg-[#A15D83] text-white px-6 py-2 rounded-full font-medium hover:bg-[#8B4D6F] transition-colors shadow-sm"
          >
            ← Back
          </button>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex justify-center mb-6">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-[#ffcfd3]">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl bg-[#A15D83] text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <h1 className="text-3xl font-bold text-[#1a3d36] text-center mb-2">
            {user.name}
          </h1>

          <p className="text-gray-500 text-center mb-4 text-sm">
            {user.email}
          </p>

          {user.bio && (
            <p className="text-gray-600 text-center mb-6">
              {user.bio}
            </p>
          )}

          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div className="bg-[#faf8f5] rounded-xl p-4">
              <h3 className="text-lg font-semibold text-[#2c5e50] mb-3 flex items-center gap-2">
                📚 Teaches
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.teachSkills.length > 0 ? (
                  user.teachSkills.map((skill, idx) => (
                    <span key={idx} className="bg-white text-[#2c5e50] px-3 py-1 rounded-full text-sm shadow-sm">
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm">No skills listed</p>
                )}
              </div>
            </div>

            <div className="bg-[#faf8f5] rounded-xl p-4">
              <h3 className="text-lg font-semibold text-[#856404] mb-3 flex items-center gap-2">
                ✨ Wants to Learn
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.learnSkills.length > 0 ? (
                  user.learnSkills.map((skill, idx) => (
                    <span key={idx} className="bg-white text-[#856404] px-3 py-1 rounded-full text-sm shadow-sm">
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm">No skills listed</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-8">
            {isConnected ? (
              <button
                onClick={startChat}
                className="bg-[#A15D83] text-white px-8 py-3 rounded-full font-medium hover:bg-[#8B4D6F] transition-all transform hover:scale-105"
              >
                💬 Send Message
              </button>
            ) : (
              <p className="text-gray-500 text-center">
                You need to connect first to start chatting
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;