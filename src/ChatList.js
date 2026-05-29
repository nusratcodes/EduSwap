import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const ChatList = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    const auth = getAuth();
    const db = getFirestore();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      navigate('/');
      return;
    }

    try {
      console.log("Loading chats for user:", currentUser.uid);
      
      const chatsRef = collection(db, "chats");
      const chatsSnapshot = await getDocs(chatsRef);
      
      console.log("Total chats found:", chatsSnapshot.size);
      
      const chatList = [];
      
      for (const chatDoc of chatsSnapshot.docs) {
        const chatData = chatDoc.data();
        
       
        if (chatData.participants && chatData.participants[currentUser.uid]) {
          
          const isHiddenForUser = chatData.hiddenFor && chatData.hiddenFor[currentUser.uid] === true;
          
         
          if (!isHiddenForUser) {
            const otherUserId = Object.keys(chatData.participants).find(id => id !== currentUser.uid);
            
            if (otherUserId) {
              const userRef = doc(db, "users", otherUserId);
              const userSnap = await getDoc(userRef);
              
              if (userSnap.exists()) {
                const userData = userSnap.data();
                chatList.push({
                  chatId: chatDoc.id,
                  userId: otherUserId,
                  name: userData.displayName || userData.email?.split('@')[0],
                  photoURL: userData.photoURL || '',
                  lastMessage: chatData.lastMessage || 'No messages yet',
                  lastMessageTime: chatData.lastMessageTime
                });
              }
            }
          }
        }
      }
      
      chatList.sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return b.lastMessageTime.toDate() - a.lastMessageTime.toDate();
      });
      
      console.log("Chats loaded:", chatList.length);
      setChats(chatList);
      
    } catch (error) {
      console.error("Error loading chats:", error);
    } finally {
      setLoading(false);
    }
  };

  
  const hideChat = async (chatId, chatName, e) => {
    e.stopPropagation();
    
    const confirmed = window.confirm(`Hide conversation with ${chatName}? It will reappear when you send a new message.`);
    
    if (!confirmed) return;
    
    const auth = getAuth();
    const db = getFirestore();
    const currentUser = auth.currentUser;
    
    setDeleting(chatId);
    
    try {
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);
      const chatData = chatSnap.data();
      
      
      const updatedHiddenFor = {
        ...(chatData.hiddenFor || {}),
        [currentUser.uid]: true
      };
      
      await updateDoc(chatRef, {
        hiddenFor: updatedHiddenFor
      });
      
      console.log(`Chat ${chatId} hidden for user ${currentUser.uid}`);
      alert(`Conversation with ${chatName} has been hidden. It will reappear when you send a new message.`);
      
      
      await loadChats();
      
    } catch (error) {
      console.error("Error hiding chat:", error);
      alert("Failed to hide chat. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  const openChat = (userId) => {
    navigate(`/chat/${userId}`);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate();
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#A15D83]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-10 px-4 md:px-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-serif font-bold text-[#1a3d36] mb-2">
              Messages 💬
            </h1>
            <p className="text-gray-600">
              Your conversations ({chats.length})
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="bg-[#A15D83] text-white px-6 py-2 rounded-full font-medium hover:bg-[#8B4D6F] transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        {chats.length > 0 ? (
          <div className="space-y-3">
            {chats.map((chat) => (
              <div
                key={chat.chatId}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group"
              >
                <div className="flex items-center p-4">
                  <div 
                    onClick={() => openChat(chat.userId)}
                    className="flex-1 flex items-center gap-4 cursor-pointer min-w-0"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      {chat.photoURL ? (
                        <img src={chat.photoURL} alt={chat.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl bg-[#A15D83] text-white">
                          {chat.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-[#1a3d36]">{chat.name}</h3>
                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                          {formatDate(chat.lastMessageTime)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => hideChat(chat.chatId, chat.name, e)}
                    disabled={deleting === chat.chatId}
                    className="ml-2 p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                    title="Hide this conversation (will reappear when you send a message)"
                  >
                    {deleting === chat.chatId ? (
                      <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-[#1a3d36] mb-2">No messages yet</h3>
            <p className="text-gray-600 mb-4">
              Connect with users and start a conversation!
            </p>
            <button
              onClick={() => navigate('/connections')}
              className="bg-[#A15D83] text-white px-6 py-2 rounded-full font-medium hover:bg-[#8B4D6F] transition-colors"
            >
              View Connections
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;