import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import './Matches.css';

const Matches = () => {
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState([]);
  const [matchedUsers, setMatchedUsers] = useState([]);
  const [displayedUsers, setDisplayedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserSkills, setCurrentUserSkills] = useState({ teach: [], learn: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [sentRequestIds, setSentRequestIds] = useState([]); 

  useEffect(() => {
    fetchAllUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, allUsers]);

 
  useEffect(() => {
    if (allUsers.length > 0) {
      checkExistingRequests();
    }
  }, [allUsers]);


  const checkExistingRequests = async () => {
    const auth = getAuth();
    const db = getFirestore();
    const currentUser = auth.currentUser;
    
    if (!currentUser) return;
    
    try {
      const sentQuery = query(
        collection(db, "connection_requests"),
        where("senderId", "==", currentUser.uid),
        where("status", "==", "pending")
      );
      const snapshot = await getDocs(sentQuery);
      const sentIds = snapshot.docs.map(doc => doc.data().receiverId);
      setSentRequestIds(sentIds);
      console.log("Sent request IDs:", sentIds);
    } catch (error) {
      console.error("Error checking sent requests:", error);
    }
  };

  const fetchAllUsers = async () => {
    const auth = getAuth();
    const db = getFirestore();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      navigate('/');
      return;
    }

    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const teachSkills = userData.teachSkills || [];
        const learnSkills = userData.learnSkills || [];
        
        setCurrentUserSkills({ teach: teachSkills, learn: learnSkills });
        
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "!=", currentUser.email));
        const querySnapshot = await getDocs(q);
        
        const usersList = [];
        const matchedList = [];
        
        querySnapshot.forEach((doc) => {
          const user = doc.data();
          const userTeachSkills = user.teachSkills || [];
          const userLearnSkills = user.learnSkills || [];
          
          const matchingTeachToLearn = userTeachSkills.filter(skill => learnSkills.includes(skill));
          const matchingLearnToTeach = userLearnSkills.filter(skill => teachSkills.includes(skill));
          const matchScore = matchingTeachToLearn.length + matchingLearnToTeach.length;
          
          const userObj = {
            id: doc.id,
            name: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL || '',
            bio: user.bio || '',
            teachSkills: userTeachSkills,
            learnSkills: userLearnSkills,
            matchingTeachToLearn,
            matchingLearnToTeach,
            matchScore
          };
          
          usersList.push(userObj);
          
          if (matchScore > 0) {
            matchedList.push(userObj);
          }
        });
        
        usersList.sort((a, b) => b.matchScore - a.matchScore);
        matchedList.sort((a, b) => b.matchScore - a.matchScore);
        
        setAllUsers(usersList);
        setMatchedUsers(matchedList);
        setDisplayedUsers(matchedList);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (!searchTerm.trim()) {
      setDisplayedUsers(matchedUsers);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    
    const filtered = allUsers.filter(user => {
      const matchesName = user.name.toLowerCase().includes(term);
      const allSkills = [...user.teachSkills, ...user.learnSkills];
      const matchesSkill = allSkills.some(skill => skill.toLowerCase().includes(term));
      return matchesName || matchesSkill;
    });
    
    setDisplayedUsers(filtered);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const goToProfile = (userId) => {
    navigate(`/user/${userId}`);
  };

  const goBack = () => {
    navigate('/');
  };

 
  const sendConnectionRequest = async (receiverId, receiverName, matchingTeachToLearn, matchingLearnToTeach) => {
    const auth = getAuth();
    const db = getFirestore();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      alert('Please login first!');
      return;
    }

    try {
      console.log("Sending request to:", receiverId);
      console.log("Current user:", currentUser.uid);
      
     
      const existingQuery = query(
        collection(db, "connection_requests"),
        where("senderId", "==", currentUser.uid),
        where("receiverId", "==", receiverId),
        where("status", "==", "pending")
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        alert('Connection request already sent! 💌');
        return;
      }

      
      const connectionsQuery = query(
        collection(db, "connections"),
        where("userId1", "in", [currentUser.uid, receiverId]),
        where("userId2", "in", [currentUser.uid, receiverId]),
        where("status", "==", "active")
      );
      const connectionsSnapshot = await getDocs(connectionsQuery);
      
      if (!connectionsSnapshot.empty) {
        alert('You are already connected with this user! 🤝');
        return;
      }

      
      const requestData = {
        senderId: currentUser.uid,
        receiverId: receiverId,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
        matchingSkills: {
          teachToLearn: matchingTeachToLearn,
          learnToTeach: matchingLearnToTeach
        }
      };
      
      console.log("Request data being saved:", requestData);
      
      const requestRef = doc(collection(db, "connection_requests"));
      await setDoc(requestRef, requestData);
      
      console.log("Request saved with ID:", requestRef.id);
      
      
      setSentRequestIds(prev => [...prev, receiverId]);
      
      alert(`Connection request sent to ${receiverName}! 💌`);
    } catch (error) {
      console.error("Error sending request:", error);
      alert('Failed to send request. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-transparent py-10 px-4 md:px-20 font-sans">
      
      
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-serif font-bold text-[#1a3d36] mb-2 flex items-center gap-2">
              Your Matches 🤝
            </h1>
            <p className="text-gray-600 text-lg">
              {searchTerm 
                ? `Search results for "${searchTerm}"` 
                : 'People who share your learning and teaching interests'}
            </p>
          </div>
          
          <div className="flex gap-3">
            <Link 
              to="/requests" 
              className="bg-[#A15D83] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#8B4D6F] transition-colors"
            >
              Requests 💌
            </Link>
            <Link 
  to="/connections" 
  className="bg-[#A15D83] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#8B4D6F] transition-colors"
>
  Connections 🤝
</Link>
            
            <button
              onClick={goBack}
              className="bg-[#A15D83] text-white px-6 py-2 rounded-full font-medium hover:bg-[#8B4D6F] transition-colors shadow-sm"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or skill (e.g., John, React, Python)..."
                  className="w-full border border-gray-300 rounded-full px-5 py-3 focus:outline-none focus:border-[#A15D83] focus:ring-2 focus:ring-[#A15D83] focus:ring-opacity-20 transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="text-sm text-gray-500 whitespace-nowrap">
              Found {displayedUsers.length} user{displayedUsers.length !== 1 ? 's' : ''}
            </div>
          </div>

          {searchTerm && displayedUsers.length === 0 && (
            <div className="mt-4 text-center text-gray-500 text-sm">
              No users found for "{searchTerm}". Try a different search term.
            </div>
          )}
        </div>
      </div>

      
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-[#1a3d36] mb-3">Your Skills Summary</h3>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">📚 You can teach:</p>
              <div className="flex flex-wrap gap-2">
                {currentUserSkills.teach.length > 0 ? (
                  currentUserSkills.teach.map((skill, idx) => (
                    <span key={idx} className="bg-[#f2f4f2] text-[#2c5e50] px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 text-sm">No skills added yet</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">✨ You want to learn:</p>
              <div className="flex flex-wrap gap-2">
                {currentUserSkills.learn.length > 0 ? (
                  currentUserSkills.learn.map((skill, idx) => (
                    <span key={idx} className="bg-[#fff3cd] text-[#856404] px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 text-sm">No skills added yet</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#A15D83]"></div>
            <p className="text-gray-600 mt-4">Loading users...</p>
          </div>
        ) : displayedUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedUsers.map((user) => (
              <div key={user.id} className="match-card h-full">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 match-card-inner h-full flex flex-col">
                 
                  <div className="profile-photo-container flex-shrink-0">
                    <div className="flex justify-center mb-4">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-[#ffcfd3] profile-border">
                        {user.photoURL ? (
                          <img 
                            src={user.photoURL} 
                            alt={user.name} 
                            className="w-full h-full object-cover profile-image"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl bg-[#A15D83] text-white">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                 
                  <h3 className="text-xl font-bold text-[#1a3d36] text-center mb-2 match-name flex-shrink-0">
                    {user.name}
                  </h3>
                  
                  
                  {user.bio && (
                    <p className="text-gray-600 text-sm text-center mb-4 line-clamp-2 match-bio flex-shrink-0" style={{ minHeight: '40px' }}>
                      {user.bio}
                    </p>
                  )}
                  
                  
                  <div className="flex-grow">
                    {user.matchingTeachToLearn.length > 0 && (
                      <div className="mb-3 skill-section skill-section-teach">
                        <p className="text-xs text-[#2c5e50] font-medium mb-1">Can teach you:</p>
                        <div className="flex flex-wrap gap-1">
                          {user.matchingTeachToLearn.map((skill, idx) => (
                            <span key={idx} className="skill-tag-teach">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {user.matchingLearnToTeach.length > 0 && (
                      <div className="mb-3 skill-section skill-section-learn">
                        <p className="text-xs text-[#856404] font-medium mb-1">Wants to learn from you:</p>
                        <div className="flex flex-wrap gap-1">
                          {user.matchingLearnToTeach.map((skill, idx) => (
                            <span key={idx} className="skill-tag-learn">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                   
                    {user.matchScore === 0 && searchTerm && (
                      <>
                        {user.teachSkills.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-[#2c5e50] font-medium mb-1">📚 Teaches:</p>
                            <div className="flex flex-wrap gap-1">
                              {user.teachSkills.map((skill, idx) => (
                                <span key={idx} className="skill-tag-teach">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {user.learnSkills.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-[#856404] font-medium mb-1">✨ Wants to learn:</p>
                            <div className="flex flex-wrap gap-1">
                              {user.learnSkills.map((skill, idx) => (
                                <span key={idx} className="skill-tag-learn">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                 
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100 flex-shrink-0">
                    <span className="text-sm text-gray-500">
                      Match score: <strong className="text-[#A15D83] match-score">{user.matchScore}</strong>
                    </span>
                    <button
                      onClick={() => sendConnectionRequest(
                        user.id, 
                        user.name, 
                        user.matchingTeachToLearn, 
                        user.matchingLearnToTeach
                      )}
                      disabled={sentRequestIds.includes(user.id)}
                      className={`connect-btn ${
                        sentRequestIds.includes(user.id) ? 'opacity-50 cursor-not-allowed bg-gray-400' : ''
                      }`}
                    >
                      {sentRequestIds.includes(user.id) ? '✓ Request Sent' : 'Send Request 💌'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-[#1a3d36] mb-2">
              {searchTerm ? 'No users found' : 'No matches found yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? `No results found for "${searchTerm}". Try a different search term.`
                : 'Update your skills to find people who share your interests!'}
            </p>
            {searchTerm ? (
              <button
                onClick={clearSearch}
                className="bg-[#A15D83] text-white px-6 py-2 rounded-full font-medium hover:bg-[#8B4D6F] transition-colors"
              >
                Clear Search
              </button>
            ) : (
              <button
                onClick={() => navigate('/profile')}
                className="bg-[#A15D83] text-white px-6 py-2 rounded-full font-medium hover:bg-[#8B4D6F] transition-colors"
              >
                Update Skills
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Matches;