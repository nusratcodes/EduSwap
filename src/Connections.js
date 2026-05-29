// Connections.js - Fixed to show connections for both users with delete functionality
import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Connections = () => {
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    const auth = getAuth();
    const db = getFirestore();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.log("No user logged in");
      setLoading(false);
      return;
    }

    console.log("Fetching connections for user:", currentUser.uid);

    try {
      // Query ALL active connections (not just where userId1 matches)
      const connectionsQuery = query(
        collection(db, "connections"),
        where("status", "==", "active")
      );
      const snapshot = await getDocs(connectionsQuery);
      
      console.log("Total connections found:", snapshot.size);
      
      const connectionsList = [];
      
      for (const docSnapshot of snapshot.docs) {
        const connectionData = docSnapshot.data();
        
        // Check if current user is involved in this connection (either as userId1 OR userId2)
        const isUserInConnection = connectionData.userId1 === currentUser.uid || connectionData.userId2 === currentUser.uid;
        
        if (isUserInConnection) {
          // Find the other user's ID
          const otherUserId = connectionData.userId1 === currentUser.uid 
            ? connectionData.userId2 
            : connectionData.userId1;
          
          console.log("Found connection with user:", otherUserId);
          
          // Fetch other user's details
          const userRef = doc(db, "users", otherUserId);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            connectionsList.push({
              id: otherUserId,
              name: userData.displayName || userData.email?.split('@')[0] || 'Unknown User',
              photoURL: userData.photoURL || '',
              bio: userData.bio || '',
              teachSkills: userData.teachSkills || [],
              learnSkills: userData.learnSkills || [],
              connectedAt: connectionData.createdAt,
              connectionId: docSnapshot.id,
              userId1: connectionData.userId1,
              userId2: connectionData.userId2
            });
            console.log("Added connection:", userData.displayName);
          } else {
            console.log("User document not found for:", otherUserId);
          }
        }
      }
      
      console.log("Total connections for user:", connectionsList.length);
      setConnections(connectionsList);
    } catch (error) {
      console.error("Error fetching connections:", error);
    } finally {
      setLoading(false);
    }
  };

  // Delete connection function
  const deleteConnection = async (connectionId, connectionName, userId1, userId2, e) => {
    e.stopPropagation();
    
    const confirmed = window.confirm(`Are you sure you want to remove ${connectionName} from your connections? This will also delete your chat history with this user.`);
    
    if (!confirmed) return;
    
    const auth = getAuth();
    const db = getFirestore();
    const currentUser = auth.currentUser;
    
    setDeleting(connectionId);
    
    try {
      const batch = writeBatch(db);
      
      // Delete the connection document
      const connectionRef = doc(db, "connections", connectionId);
      batch.delete(connectionRef);
      
      // Find the chat ID and delete it
      const chatId = [currentUser.uid, (userId1 === currentUser.uid ? userId2 : userId1)].sort().join('_');
      const chatRef = doc(db, "chats", chatId);
      batch.delete(chatRef);
      
      await batch.commit();
      
      console.log(`Connection and chat deleted for ${connectionName}`);
      alert(`Removed ${connectionName} from your connections.`);
      
      // Refresh the connections list
      await fetchConnections();
      
    } catch (error) {
      console.error("Error deleting connection:", error);
      alert("Failed to remove connection. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  const viewProfile = (userId) => {
    navigate(`/user/${userId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent py-10 px-4 md:px-20">
        <div className="flex justify-center items-center h-64">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#A15D83]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-10 px-4 md:px-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-serif font-bold text-[#1a3d36] mb-2">
              Your Connections 🤝
            </h1>
            <p className="text-gray-600">
              People you've successfully connected with
            </p>
          </div>
          <button
            onClick={() => navigate('/matches')}
            className="bg-[#A15D83] text-white px-6 py-2 rounded-full font-medium hover:bg-[#8B4D6F] transition-colors"
          >
            Find More People
          </button>
        </div>
        
        {connections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connections.map((connection) => (
              <div key={connection.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all hover:transform hover:-translate-y-1 group">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                    {connection.photoURL ? (
                      <img src={connection.photoURL} alt={connection.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl bg-[#A15D83] text-white">
                        {connection.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-[#1a3d36]">{connection.name}</h3>
                    {connection.bio && (
                      <p className="text-sm text-gray-500 line-clamp-1">{connection.bio}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Connected {connection.connectedAt?.toDate?.().toLocaleDateString() || 'Recently'}
                    </p>
                  </div>
                </div>
                
                {/* Show matching skills if any */}
                {connection.teachSkills.length > 0 && (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1">
                      {connection.teachSkills.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="bg-[#f2f4f2] text-[#2c5e50] px-2 py-0.5 rounded-full text-xs">
                          📚 {skill}
                        </span>
                      ))}
                      {connection.teachSkills.length > 3 && (
                        <span className="text-xs text-gray-400">+{connection.teachSkills.length - 3} more</span>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3 mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => viewProfile(connection.id)}
                    className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={(e) => deleteConnection(
                      connection.connectionId, 
                      connection.name, 
                      connection.userId1, 
                      connection.userId2, 
                      e
                    )}
                    disabled={deleting === connection.connectionId}
                    className="px-3 py-2 rounded-full text-sm font-medium transition-colors bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                  >
                    {deleting === connection.connectionId ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    ) : (
                      'Remove'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl">
            <div className="text-6xl mb-4">🤝</div>
            <h3 className="text-xl font-semibold text-[#1a3d36] mb-2">No connections yet</h3>
            <p className="text-gray-600 mb-4">
              Send connection requests to people with matching skills and start swapping!
            </p>
            <button
              onClick={() => navigate('/matches')}
              className="bg-[#A15D83] text-white px-6 py-2 rounded-full font-medium hover:bg-[#8B4D6F] transition-colors"
            >
              Find Matches
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Connections;