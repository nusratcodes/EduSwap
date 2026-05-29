// ConnectionRequests.js - Fixed version
import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc, writeBatch, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './ConnectionRequests.css';


const ConnectionRequests = () => {
  const navigate = useNavigate();
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');

  useEffect(() => {
    fetchRequests();
  }, []);

  // Fixed fetchRequests function
  const fetchRequests = async () => {
    const auth = getAuth();
    const db = getFirestore();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      navigate('/');
      return;
    }

    setLoading(true);
    
    try {
      console.log("Fetching requests for user:", currentUser.uid);
      
      // Fetch received requests (where current user is the receiver)
      const receivedQuery = query(
        collection(db, "connection_requests"),
        where("receiverId", "==", currentUser.uid),
        where("status", "==", "pending")
      );
      const receivedSnapshot = await getDocs(receivedQuery);
      
      console.log("Received requests count:", receivedSnapshot.size);
      
      const receivedList = [];
      for (const requestDoc of receivedSnapshot.docs) {
        const requestData = requestDoc.data();
        console.log("Received request data:", requestData);
        
        // Fetch sender details
        const senderRef = doc(db, "users", requestData.senderId);
        const senderSnap = await getDoc(senderRef);
        
        if (senderSnap.exists()) {
          receivedList.push({
            id: requestDoc.id,
            ...requestData,
            sender: {
              id: requestData.senderId,
              name: senderSnap.data().displayName || senderSnap.data().email?.split('@')[0],
              photoURL: senderSnap.data().photoURL || '',
              bio: senderSnap.data().bio || '',
              teachSkills: senderSnap.data().teachSkills || [],
              learnSkills: senderSnap.data().learnSkills || []
            }
          });
        }
      }

      // Fetch sent requests (where current user is the sender)
      const sentQuery = query(
        collection(db, "connection_requests"),
        where("senderId", "==", currentUser.uid),
        where("status", "==", "pending")
      );
      const sentSnapshot = await getDocs(sentQuery);
      
      console.log("Sent requests count:", sentSnapshot.size);
      
      const sentList = [];
      for (const requestDoc of sentSnapshot.docs) {
        const requestData = requestDoc.data();
        console.log("Sent request data:", requestData);
        
        // Fetch receiver details
        const receiverRef = doc(db, "users", requestData.receiverId);
        const receiverSnap = await getDoc(receiverRef);
        
        if (receiverSnap.exists()) {
          sentList.push({
            id: requestDoc.id,
            ...requestData,
            receiver: {
              id: requestData.receiverId,
              name: receiverSnap.data().displayName || receiverSnap.data().email?.split('@')[0],
              photoURL: receiverSnap.data().photoURL || '',
              bio: receiverSnap.data().bio || ''
            }
          });
        }
      }

      setReceivedRequests(receivedList);
      setSentRequests(sentList);
      
      console.log("Final received list:", receivedList.length);
      console.log("Final sent list:", sentList.length);
      
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  // Updated acceptRequest function with connection check
  const acceptRequest = async (requestId, senderId) => {
    const db = getFirestore();
    const auth = getAuth();
    const currentUser = auth.currentUser;

    try {
      // First, check if a connection already exists
      const existingConnectionQuery = query(
        collection(db, "connections"),
        where("userId1", "in", [currentUser.uid, senderId]),
        where("userId2", "in", [currentUser.uid, senderId]),
        where("status", "==", "active")
      );
      const existingConnection = await getDocs(existingConnectionQuery);
      
      if (!existingConnection.empty) {
        alert("You are already connected with this user! 🤝");
        return;
      }
      
      const batch = writeBatch(db);
      
      // Update request status
      const requestRef = doc(db, "connection_requests", requestId);
      batch.update(requestRef, { status: "accepted", updatedAt: new Date() });
      
      // Create new connection document
      const connectionRef = doc(collection(db, "connections"));
      batch.set(connectionRef, {
        userId1: currentUser.uid,
        userId2: senderId,
        createdAt: new Date(),
        status: "active",
        startedAt: new Date()
      });
      
      await batch.commit();
      await fetchRequests();
      alert("Connection request accepted! 🤝");
    } catch (error) {
      console.error("Error accepting request:", error);
      alert("Failed to accept request. Please try again.");
    }
  };

  // Updated rejectRequest function with connection deletion
  const rejectRequest = async (requestId, senderId) => {
    const db = getFirestore();
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    try {
      const batch = writeBatch(db);
      
      // Update request status to rejected
      const requestRef = doc(db, "connection_requests", requestId);
      batch.update(requestRef, { 
        status: "rejected", 
        updatedAt: new Date() 
      });
      
      // ALSO DELETE any existing connection document between these users
      const connectionsQuery = query(
        collection(db, "connections"),
        where("userId1", "in", [currentUser.uid, senderId]),
        where("userId2", "in", [currentUser.uid, senderId]),
        where("status", "==", "active")
      );
      const connectionsSnapshot = await getDocs(connectionsQuery);
      
      connectionsSnapshot.forEach((connectionDoc) => {
        batch.delete(connectionDoc.ref);
      });
      
      await batch.commit();
      await fetchRequests();
      alert("Request rejected and connection removed.");
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Failed to reject request. Please try again.");
    }
  };

  // Updated cancelRequest function with connection deletion
  const cancelRequest = async (requestId, receiverId) => {
    const db = getFirestore();
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    try {
      const batch = writeBatch(db);
      
      // Delete the request document
      const requestRef = doc(db, "connection_requests", requestId);
      batch.delete(requestRef);
      
      // ALSO DELETE any existing connection document between these users
      const connectionsQuery = query(
        collection(db, "connections"),
        where("userId1", "in", [currentUser.uid, receiverId]),
        where("userId2", "in", [currentUser.uid, receiverId]),
        where("status", "==", "active")
      );
      const connectionsSnapshot = await getDocs(connectionsQuery);
      
      connectionsSnapshot.forEach((connectionDoc) => {
        batch.delete(connectionDoc.ref);
      });
      
      await batch.commit();
      await fetchRequests();
      alert("Request cancelled and connection removed.");
    } catch (error) {
      console.error("Error cancelling request:", error);
      alert("Failed to cancel request. Please try again.");
    }
  };

  const goBack = () => {
    navigate('/');
  };

  const viewProfile = (userId) => {
    navigate(`/user/${userId}`);
  };

  // Debug function to test Firestore connection (for reference)
  const testFirestoreConnection = async () => {
    const auth = getAuth();
    const db = getFirestore();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.log("No user logged in");
      return;
    }
    
    try {
      console.log("Testing Firestore connection...");
      const testRef = doc(collection(db, "test_collection"));
      await setDoc(testRef, {
        test: true,
        userId: currentUser.uid,
        timestamp: new Date()
      });
      console.log("Firestore write successful!");
      return true;
    } catch (error) {
      console.error("Firestore write failed:", error);
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-transparent py-10 px-4 md:px-20 font-sans">
      
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-serif font-bold text-[#1a3d36] mb-2 flex items-center gap-2">
              Connection Requests 💌
            </h1>
            <p className="text-gray-600 text-lg">
              Manage your pending connection requests
            </p>
          </div>
          
          <button
            onClick={goBack}
            className="bg-[#A15D83] text-white px-6 py-2 rounded-full font-medium hover:bg-[#8B4D6F] transition-colors shadow-sm"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('received')}
            className={`px-6 py-3 text-sm font-medium transition-all ${
              activeTab === 'received'
                ? 'text-[#A15D83] border-b-2 border-[#A15D83]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Received Requests ({receivedRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-6 py-3 text-sm font-medium transition-all ${
              activeTab === 'sent'
                ? 'text-[#A15D83] border-b-2 border-[#A15D83]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sent Requests ({sentRequests.length})
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#A15D83]"></div>
            <p className="text-gray-600 mt-4">Loading requests...</p>
          </div>
        ) : activeTab === 'received' ? (
          receivedRequests.length > 0 ? (
            <div className="space-y-4">
              {receivedRequests.map((request) => (
                <div key={request.id} className="request-card">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                          {request.sender.photoURL ? (
                            <img 
                              src={request.sender.photoURL} 
                              alt={request.sender.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl bg-[#A15D83] text-white">
                              {request.sender.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-bold text-[#1a3d36]">
                              {request.sender.name}
                            </h3>
                            {request.sender.bio && (
                              <p className="text-gray-600 text-sm mt-1">{request.sender.bio}</p>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {request.createdAt?.toDate?.().toLocaleDateString() || 'Just now'}
                          </span>
                        </div>
                        
                        {request.matchingSkills && (
                          <div className="mt-3">
                            <p className="text-xs text-[#2c5e50] font-medium mb-1">
                              They want to swap:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {request.matchingSkills.teachToLearn?.map((skill, idx) => (
                                <span key={idx} className="skill-badge teach">
                                  Can teach you: {skill}
                                </span>
                              ))}
                              {request.matchingSkills.learnToTeach?.map((skill, idx) => (
                                <span key={idx} className="skill-badge learn">
                                  Wants to learn: {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={() => acceptRequest(request.id, request.sender.id)}
                            className="bg-[#A15D83] text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-[#8B4D6F] transition-all transform hover:scale-105"
                          >
                            Accept 🤝
                          </button>
                          <button
                            onClick={() => rejectRequest(request.id, request.sender.id)}
                            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-300 transition-all"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => viewProfile(request.sender.id)}
                            className="text-[#A15D83] px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-50 transition-all"
                          >
                            View Profile
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl">
              <div className="text-6xl mb-4">💌</div>
              <h3 className="text-xl font-semibold text-[#1a3d36] mb-2">No pending requests</h3>
              <p className="text-gray-600">
                When someone sends you a connection request, it will appear here.
              </p>
            </div>
          )
        ) : (
          sentRequests.length > 0 ? (
            <div className="space-y-4">
              {sentRequests.map((request) => (
                <div key={request.id} className="request-card">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                          {request.receiver.photoURL ? (
                            <img 
                              src={request.receiver.photoURL} 
                              alt={request.receiver.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl bg-[#A15D83] text-white">
                              {request.receiver.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-bold text-[#1a3d36]">
                              {request.receiver.name}
                            </h3>
                            {request.receiver.bio && (
                              <p className="text-gray-600 text-sm mt-1">{request.receiver.bio}</p>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {request.createdAt?.toDate?.().toLocaleDateString() || 'Just now'}
                          </span>
                        </div>
                        
                        <div className="mt-3">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            ⏳ Pending
                          </span>
                        </div>
                        
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={() => cancelRequest(request.id, request.receiver.id)}
                            className="bg-red-50 text-red-600 px-6 py-2 rounded-full text-sm font-medium hover:bg-red-100 transition-all"
                          >
                            Cancel Request
                          </button>
                          <button
                            onClick={() => viewProfile(request.receiver.id)}
                            className="text-[#A15D83] px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-50 transition-all"
                          >
                            View Profile
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl">
              <div className="text-6xl mb-4">📤</div>
              <h3 className="text-xl font-semibold text-[#1a3d36] mb-2">No sent requests</h3>
              <p className="text-gray-600">
                You haven't sent any connection requests yet.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ConnectionRequests;