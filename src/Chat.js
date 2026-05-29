import React, { useState, useEffect, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, addDoc, orderBy, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';

const Chat = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const [chatId, setChatId] = useState(null);

  useEffect(() => {
    initChat();
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initChat = async () => {
    const auth = getAuth();
    const db = getFirestore();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      navigate('/');
      return;
    }

    try {
      
      const connectionsQuery = query(
        collection(db, "connections"),
        where("status", "==", "active")
      );
      const connectionsSnapshot = await getDocs(connectionsQuery);
      
      let isConnected = false;
      connectionsSnapshot.forEach((doc) => {
        const data = doc.data();
        if ((data.userId1 === currentUser.uid && data.userId2 === userId) ||
            (data.userId1 === userId && data.userId2 === currentUser.uid)) {
          isConnected = true;
        }
      });

      if (!isConnected) {
        alert("You are not connected with this user anymore.");
        navigate('/connections');
        return;
      }

      
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setOtherUser({
          id: userId,
          name: userSnap.data().displayName || userSnap.data().email?.split('@')[0],
          photoURL: userSnap.data().photoURL || ''
        });
      }

      
      const chatRoomId = [currentUser.uid, userId].sort().join('_');
      setChatId(chatRoomId);
      console.log("Chat ID:", chatRoomId);

      
      const chatRef = doc(db, "chats", chatRoomId);
      const chatSnap = await getDoc(chatRef);
      
      if (!chatSnap.exists()) {
        console.log("Creating new chat document for:", chatRoomId);
        await setDoc(chatRef, {
          participants: {
            [currentUser.uid]: true,
            [userId]: true
          },
          createdAt: new Date(),
          lastMessage: "",
          lastMessageTime: new Date(),
          createdBy: currentUser.uid,
          deletedBy: {} 
        });
        console.log("Chat document created!");
      } else {
        
        const chatData = chatSnap.data();
        if (!chatData.participants || !chatData.participants[currentUser.uid]) {
          await updateDoc(chatRef, {
            [`participants.${currentUser.uid}`]: true
          });
        }
      }

      
      const messagesRef = collection(db, "chats", chatRoomId, "messages");
      const q = query(messagesRef, orderBy("timestamp", "asc"));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messagesList = [];
        snapshot.forEach((doc) => {
          messagesList.push({ id: doc.id, ...doc.data() });
        });
        console.log("Messages loaded:", messagesList.length);
        setMessages(messagesList);
      });

      setLoading(false);
      return () => unsubscribe();
      
    } catch (error) {
      console.error("Error initializing chat:", error);
      setLoading(false);
    }
  };

  
const sendMessage = async (e) => {
  e.preventDefault();
  if (!newMessage.trim()) return;

  const auth = getAuth();
  const db = getFirestore();
  const currentUser = auth.currentUser;

  setSending(true);

  try {
    const messageText = newMessage.trim();
    
    
    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);
    if (chatSnap.exists()) {
      const chatData = chatSnap.data();
      if (chatData.hiddenFor && chatData.hiddenFor[currentUser.uid] === true) {
        
        const updatedHiddenFor = {
          ...(chatData.hiddenFor || {}),
          [currentUser.uid]: false
        };
        await updateDoc(chatRef, {
          hiddenFor: updatedHiddenFor
        });
        console.log("Chat unhidden for user");
      }
    }
    
   
    const messagesRef = collection(db, "chats", chatId, "messages");
    const messageDoc = await addDoc(messagesRef, {
      text: messageText,
      senderId: currentUser.uid,
      receiverId: userId,
      timestamp: new Date(),
      read: false
    });
    
    console.log("Message saved with ID:", messageDoc.id);

    
    await updateDoc(chatRef, {
      lastMessage: messageText,
      lastMessageTime: new Date()
    });

    setNewMessage('');
  } catch (error) {
    console.error("Error sending message:", error);
    alert("Failed to send message: " + error.message);
  } finally {
    setSending(false);
  }
};

  const goBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#A15D83]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      
      <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={goBack} className="text-gray-600 hover:text-gray-800">
            ← Back
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
              {otherUser?.photoURL ? (
                <img src={otherUser.photoURL} alt={otherUser.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#A15D83] text-white">
                  {otherUser?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h2 className="font-semibold text-[#1a3d36]">{otherUser?.name}</h2>
              <p className="text-xs text-green-600">● Connected</p>
            </div>
          </div>
        </div>
      </div>

      
      <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full">
        <div className="space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-400">No messages yet. Start the conversation!</p>
            </div>
          )}
          {messages.map((message) => {
            const isCurrentUser = message.senderId === getAuth().currentUser?.uid;
            return (
              <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                  isCurrentUser ? 'bg-[#A15D83] text-white' : 'bg-white text-gray-800 border border-gray-200'
                }`}>
                  <p className="text-sm break-words">{message.text}</p>
                  <p className={`text-xs mt-1 ${isCurrentUser ? 'text-pink-100' : 'text-gray-400'}`}>
                    {message.timestamp?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-full px-5 py-3 focus:outline-none focus:border-[#A15D83] focus:ring-2 focus:ring-[#A15D83] focus:ring-opacity-20"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="bg-[#A15D83] text-white px-6 py-3 rounded-full font-medium hover:bg-[#8B4D6F] disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;