import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom'; // Import useNavigate


const Profile = () => {
  const navigate = useNavigate(); // Initialize navigate
  
  // Basic States
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Image States
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);

  // Skill States
  const [teachInput, setTeachInput] = useState('');
  const [teachSkills, setTeachSkills] = useState([]);
  const [learnInput, setLearnInput] = useState('');
  const [learnSkills, setLearnSkills] = useState([]);

  // Fetch user data with auto display name from email handle
  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            
            // Auto set display name: Firestore name > Auth name > Email handle
            setDisplayName(
              data.displayName || 
              currentUser.displayName || 
              (currentUser.email ? currentUser.email.split('@')[0] : '')
            );

            setBio(data.bio || '');
            setTeachSkills(data.teachSkills || []);
            setLearnSkills(data.learnSkills || []);
            
            const photo = data.photoURL || currentUser.photoURL || '';
            setPreviewUrl(photo);
            setAvatarUrl(photo);
          } else {
            // If no Firestore data, use email handle or Auth displayName
            const emailHandle = currentUser.email ? currentUser.email.split('@')[0] : '';
            setDisplayName(currentUser.displayName || emailHandle);
            if (currentUser.photoURL) {
              setPreviewUrl(currentUser.photoURL);
              setAvatarUrl(currentUser.photoURL);
            }
          }
        } catch (error) {
          console.error("Fetch Error:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle image selection and preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
    }
  };

  // Save profile to Firebase Auth and Firestore
  const handleSaveProfile = async () => {
    const auth = getAuth();
    const db = getFirestore();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      alert('Please login first!');
      return;
    }

    try {
      let finalPhotoUrl = avatarUrl;

      // Upload to ImgBB if a new image was selected
      if (imageFile) {
        alert("Uploading image... ⏳");
        const formData = new FormData();
        formData.append('image', imageFile);
        const imgbbApiKey = '99a585e5d9467a23fc433c4f916a97bd';

        const response = await fetch(
          `https://api.imgbb.com/1/upload?key=${imgbbApiKey}`,
          { method: 'POST', body: formData }
        );

        const data = await response.json();
        if (data.success) {
          finalPhotoUrl = data.data.display_url;
        } else {
          throw new Error('Image upload failed');
        }
      }

      // Update Firebase Auth profile
      await updateProfile(currentUser, {
        displayName: displayName,
        photoURL: finalPhotoUrl
      });

      // Update Firestore
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(userRef, {
        displayName,
        photoURL: finalPhotoUrl,
        bio,
        teachSkills,
        learnSkills,
        email: currentUser.email,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setPreviewUrl(finalPhotoUrl);
      setAvatarUrl(finalPhotoUrl);
      setImageFile(null); // Clear image file after upload
      alert('Profile saved successfully! 🌸');

    } catch (error) {
      console.error("Save Error:", error);
      alert('Failed to save profile: ' + error.message);
    }
  };

  // Add skill functions
  const handleAddTeachSkill = (e) => {
    e.preventDefault();
    if (teachInput.trim() !== '') {
      setTeachSkills([...teachSkills, teachInput.trim()]);
      setTeachInput('');
    }
  };

  const handleAddLearnSkill = (e) => {
    e.preventDefault();
    if (learnInput.trim() !== '') {
      setLearnSkills([...learnSkills, learnInput.trim()]);
      setLearnInput('');
    }
  };

  const removeTeachSkill = (index) => {
    setTeachSkills(teachSkills.filter((_, i) => i !== index));
  };

  const removeLearnSkill = (index) => {
    setLearnSkills(learnSkills.filter((_, i) => i !== index));
  };

  // Navigate to Home page
  const goToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-transparent py-10 px-4 md:px-20 font-sans">
      
      {/* Page Header with Dashboard Button */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-serif font-bold text-[#1a3d36] mb-2 flex items-center gap-2">
              Your nest <span className="text-3xl"></span>
            </h1>
            <p className="text-gray-600 text-lg">
              Tell the nest what you can teach and what you'd love to learn.
            </p>
          </div>
          
          {/* Dashboard Button */}
          <button
            onClick={goToHome}
            className="bg-[#A15D83] text-white px-8 py-3 rounded-full font-medium hover:bg-[#A15D83] transition-colors shadow-sm"
          >
            <span></span>
           Back to Dashboard
          </button>
        </div>
      </div>

      {/* Profile Form Card */}
      <div className="max-w-3xl mx-auto bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-gray-100">
        
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 border-4 border-[#ffcfd3] shadow-sm mb-3">
            {previewUrl ? (
              <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">👤</div>
            )}
          </div>
          
          {/* Photo Upload Button */}
          <label className="cursor-pointer bg-[#e9ecef] hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-full text-sm font-medium transition-colors">
            Change Photo
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange} 
              className="hidden" 
            />
          </label>
        </div>

        <form className="space-y-8">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Display name</label>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:border-[#e76f51] focus:ring-1 focus:ring-[#e76f51] transition-colors"
              placeholder="Your display name"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            <textarea 
              rows="4"
              placeholder="A few words about you..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:border-[#e76f51] focus:ring-1 focus:ring-[#e76f51] transition-colors resize-none"
            ></textarea>
          </div>

          {/* Skills you can teach */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Skills you can teach 🌱</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="e.g. React.js, UI Design"
                value={teachInput}
                onChange={(e) => setTeachInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTeachSkill(e)}
                className="flex-1 border border-gray-300 rounded-xl p-3 focus:outline-none focus:border-[#e76f51] focus:ring-1 focus:ring-[#e76f51] transition-colors"
              />
              <button 
                type="button"
                onClick={handleAddTeachSkill}
                className="bg-[#e9ecef] text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {teachSkills.map((skill, index) => (
                <span key={index} className="bg-[#f2f4f2] text-[#2c5e50] px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                  {skill}
                  <button type="button" onClick={() => removeTeachSkill(index)} className="text-gray-400 hover:text-red-500 text-xl">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Skills you want to learn */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Skills you want to learn ✨</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="e.g. Node.js, MERN Stack"
                value={learnInput}
                onChange={(e) => setLearnInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddLearnSkill(e)}
                className="flex-1 border border-gray-300 rounded-xl p-3 focus:outline-none focus:border-[#e76f51] focus:ring-1 focus:ring-[#e76f51] transition-colors"
              />
              <button 
                type="button"
                onClick={handleAddLearnSkill}
                className="bg-[#e9ecef] text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {learnSkills.map((skill, index) => (
                <span key={index} className="bg-[#fff3cd] text-[#856404] px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                  {skill}
                  <button type="button" onClick={() => removeLearnSkill(index)} className="text-gray-400 hover:text-red-500 text-xl">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={handleSaveProfile}
              className="bg-[#A15D83] text-white px-8 py-3 rounded-full font-medium hover:bg-[#A15D83] transition-colors shadow-sm"
            >
              Save profile
            </button>
            
            {/* Optional: Cancel/Back button */}
            <button
              type="button"
              onClick={goToHome}
              className="bg-gray-200 text-gray-700 px-8 py-3 rounded-full font-medium hover:bg-gray-300 transition-colors shadow-sm"
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Profile;