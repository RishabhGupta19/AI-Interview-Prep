
import React, { useState, useEffect, useCallback, useMemo } from 'react';

// --- Real API Client for Backend Integration ---
const BASE_URL = 'https://ai-interview-prep-rmgs.onrender.com/api';
const LOCAL_TOKEN_KEY = 'jwt_token';

const getAuthHeaders = () => {
    const token = localStorage.getItem(LOCAL_TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const apiClient = {
    post: async (endpoint, data) => {
        try {
            const response = await fetch(`${BASE_URL}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                // IMPORTANT: Use result.error or result.message from backend
                throw new Error(result.error || result.message || 'Request failed');
            }

            return { status: response.status, json: () => Promise.resolve(result) };
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    },
    
    get: async (endpoint) => {
        try {
            const response = await fetch(`${BASE_URL}/${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                }
            });

            const result = await response.json();

            if (!response.ok) {
                // IMPORTANT: Use result.error or result.message from backend
                throw new Error(result.error || result.message || 'Request failed');
            }

            return { status: response.status, json: () => Promise.resolve(result) };
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }
};

// ⬇️ NEW: Dedicated helper for FormData file uploads 
const uploadFile = async (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const token = localStorage.getItem(LOCAL_TOKEN_KEY);

    const response = await fetch(`${BASE_URL}/documents/upload`, {
        method: 'POST',
        headers: {
            // NOTE: Do NOT set Content-Type for FormData
            ...(token && { Authorization: `Bearer ${token}` })
        },
        body: formData
    });

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || result.message || 'Upload failed');
    }
    // Backend returns { document: doc }
    return result.document; 
};
// --- END Real API Client & Helpers ---

// --- Core Utility Functions ---

// chunkText is now unused since the backend handles it, but kept for minimal change
const chunkText = (text, size = 500) => {
    const words = text.split(/\s+/);
    const chunks = [];
    let currentChunk = [];
    for (const word of words) {
        currentChunk.push(word);
        if (currentChunk.length >= size) {
            chunks.push(currentChunk.join(' '));
            currentChunk = [];
        }
    }
    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
    }
    return chunks;
};

// ... (Icon components are unchanged) ...
const Zap = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const UploadCloud = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a5 5 0 0 1 0 10H5a2 2 0 0 1 0-4"/><path d="M10 13l2-2 2 2"/><path d="M12 21v-10"/></svg>;
const Loader2 = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const CheckCircle = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>;
const Trash2 = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const MessageSquare = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;


// --- Gemini API Handler (Removed - using apiClient instead) ---


// --- Components ---
// --- NEW: Typewriter Effect Component ---
const Typewriter = ({ text, speed = 100 }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (index < text.length) {
            const timer = setTimeout(() => {
                setDisplayedText(prev => prev + text[index]);
                setIndex(prev => prev + 1);
            }, speed);
            return () => clearTimeout(timer);
        }
    }, [index, speed, text]);

    return <span>{displayedText}</span>;
};
// --- END Typewriter Effect Component ---

const Toast = ({ message, type, onClose }) => {
    // ... (unchanged) ...
    let baseClasses = "fixed bottom-4 right-4 p-4 rounded-xl shadow-2xl transition-opacity duration-300 z-50 flex items-center";
    let icon;

    switch (type) {
        case 'success':
            baseClasses += " bg-green-500 text-white";
            icon = <CheckCircle className="w-5 h-5 mr-2"/>;
            break;
        case 'error':
            baseClasses += " bg-red-600 text-white";
            icon = <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
            break;
        case 'loading':
            baseClasses += " bg-blue-500 text-white";
            icon = <Loader2 className="w-5 h-5 mr-2"/>;
            break;
        default:
            baseClasses += " bg-gray-700 text-white";
            icon = <MessageSquare className="w-5 h-5 mr-2"/>;
    }
    

    useEffect(() => {
        if (type !== 'loading') {
            const timer = setTimeout(onClose, 4000);
            return () => clearTimeout(timer);
        }
    }, [message, type, onClose]);

    return (
        <div className={baseClasses}>
            {icon}
            <span>{message}</span>
        </div>
    );
};

const Header = ({ isLoggedIn, user, navigate, handleLogout, status }) => (
    // IMPROVEMENT 1: Added subtle top-border on scroll animation effect (shadow-xl)
    <header className="sticky top-0 z-10 flex justify-between items-center p-5 bg-white shadow-xl transition-shadow duration-300 border-b border-gray-100">
        <h1 
            // IMPROVEMENT 2: Add subtle press animation (scale) on click
            className="text-2xl font-extrabold text-indigo-700 cursor-pointer transition-all duration-150 hover:text-indigo-600 hover:scale-[1.01] active:scale-[0.98]" 
            onClick={() => navigate('landing')}
        >
            AI Interview Prep
        </h1>
        <nav className="space-x-6 flex items-center">
            {isLoggedIn ? (
                <>
                    {/* User name: No animation needed, keep it static */}
                    <span className="text-sm hidden sm:inline text-gray-700 font-medium pr-3 border-r border-gray-300">
                        {user?.name || 'Guest'}
                    </span>
                    
                    {/* Upload Button: Bounce effect on hover */}
                    <button
                        onClick={() => navigate('upload')}
                        // Added transform and hover:translate-y-[-1px] for a slight lift
                        className={`text-sm font-semibold transition-all duration-200 p-1 rounded-md transform hover:-translate-y-[1px] ${
                            status.documentsReady 
                                ? 'text-green-600 hover:bg-green-50' 
                                : 'text-indigo-600 hover:bg-indigo-50'
                        }`}
                    >
                        {status.documentsReady ? 'Docs Ready (Go)' : 'Upload Documents'}
                    </button>
                    
                    {/* Chat Button: Primary action gets a pulse/shadow animation */}
                    <button
                        onClick={() => navigate('chat')}
                        // Added shadow, hover:shadow-lg, and slightly more pronounced hover state
                        className={`text-sm font-semibold transition-all duration-300 py-1 px-3 rounded-lg transform ${
                            status.documentsReady 
                                ? ' text-indigo-600  hover:shadow-md' 
                                : 'text-gray-400 cursor-not-allowed bg-gray-100'
                        }`}
                        disabled={!status.documentsReady}
                    >
                        Start Chat
                    </button>
                    
                    {/* Logout Button: Clear indication of being clickable */}
                    <button
                        onClick={handleLogout}
                        // Added ring on active/focus state
                        className="text-sm font-medium text-red-500 hover:text-red-700 transition-all p-1 rounded-md hover:bg-red-50 focus:ring-2 focus:ring-red-300 active:bg-red-100"
                    >
                        Logout
                    </button>
                </>
            ) : (
                null 
            )}
        </nav>
    </header>
);
const AuthForm = ({ type, navigate, setIsLoggedIn, setUser, setToast, setDocuments }) => {
    // ⬇️ ADD setDocuments to destructuring ⬆️
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');

    const fetchUserDocuments = async (token) => {
        try {
            const response = await fetch(`${BASE_URL}/documents/list`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || result.message || 'Failed to fetch documents');
            }
            return result.documents;
        } catch (error) {
            console.error('Fetch Docs Error:', error);
            return [];
        }
    };


    const handleSubmit = async (e) => {
      
        e.preventDefault();
        setLoading(true);
        setToast({ message: `${type === 'login' ? 'Signing in' : 'Creating account'}...`, type: 'loading' });

        try {
            const endpoint = type === 'login' ? 'auth/login' : 'auth/signup';
            const payload = type === 'login' ? { email, password } : { name, email, password };
            const response = await apiClient.post(endpoint, payload);


            const data = await response.json();

           if (type === 'login') {
            localStorage.setItem(LOCAL_TOKEN_KEY, data.token);
            setIsLoggedIn(true);
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            console.log(data.user.name);
            setToast({ message: 'Login successful!', type: 'success' });
            
            // ⬇️ CRITICAL FIX: Fetch and set documents on login
            const docs = await fetchUserDocuments(data.token);
            setDocuments(docs);
            // ---------------------------------------------------

            navigate('upload'); 
        } else {
            setToast({ message: 'Registration successful! Please login.', type: 'success' });
            navigate('login'); 
        }
        } catch (error) {
            console.error('Auth Error:', error);
            setToast({ 
                message: error.message || `${type} failed. Please try again.`, 
                type: 'error' 
            });
        } finally {
            setLoading(false);
        }
    };

    // ... (rest of AuthForm is unchanged) ...

    return (
        <div className="max-w-md w-full mx-auto my-12 p-8 bg-white shadow-2xl rounded-2xl border border-gray-100">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center capitalize">{type}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                {type === 'signup' && (
                            <div>
                              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                              <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                                disabled={loading}
                              />
                            </div>
                          )}

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                        disabled={loading}
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                        disabled={loading}
                    />
                </div>
                <button
                    type="submit"
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? <><Loader2 className="w-5 h-5 mr-2" /> Processing...</> : `Sign ${type === 'login' ? 'In' : 'Up'}`}
                </button>
            </form>
            <div className="mt-6 text-center">
                <button
                    onClick={() => navigate(type === 'login' ? 'signup' : 'login')}
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                    disabled={loading}
                >
                    {type === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </button>
            </div>
        </div>
    );
};

const DocumentManager = ({ documents, setDocuments, setToast, user, navigate }) => {
    // We use the documents state passed down from App.js now
    const [resumeFile, setResumeFile] = useState(null);
    const [jdFile, setJdFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];

        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            setToast({ message: `${file.name} is too large. Max size is 2MB.`, type: 'error' });
            if (type === 'resume') setResumeFile(null);
            if (type === 'jd') setJdFile(null);
            return;
        }

        if (file.type !== 'application/pdf') {
            setToast({ message: `Only PDF files are allowed.`, type: 'error' });
            if (type === 'resume') setResumeFile(null);
            if (type === 'jd') setJdFile(null);
            return;
        }

        if (type === 'resume') setResumeFile(file);
        if (type === 'jd') setJdFile(file);
    };

    // ⬇️ REFACTORED: Use backend for upload
    const handleUpload = async () => {
        if (!resumeFile || !jdFile) {
            setToast({ message: 'Please upload both a Resume and a Job Description.', type: 'error' });
            return;
        }

        setLoading(true);
        setUploadProgress(10);
        setToast({ message: 'Uploading and processing documents...', type: 'loading' });

        try {
            // 1. Upload Resume
            setUploadProgress(20);
            const resumeDoc = await uploadFile(resumeFile, 'resume');
            setUploadProgress(50);

            // 2. Upload Job Description
            const jdDoc = await uploadFile(jdFile, 'jd');
            setUploadProgress(80);

            // Update local documents state
            setDocuments([...documents.filter(d => d.type !== 'resume' && d.type !== 'jd'), resumeDoc, jdDoc]);
            
            setResumeFile(null);
            setJdFile(null);
            setUploadProgress(100);
            setToast({ message: 'Documents uploaded and ready for interview!', type: 'success' });
            navigate('chat');

        } catch (error) {
            console.error('Upload Error:', error);
            setToast({ message: `Upload failed: ${error.message || 'Please check your backend status and keys.'}`, type: 'error' });
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    // ⬇️ REFACTORED: Use backend for delete
    const handleDelete = async (id) => {
        try {
            // Call backend DELETE endpoint
            const response = await fetch(`${BASE_URL}/documents/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || result.message || 'Deletion failed');
            }

            setDocuments(documents.filter(doc => doc._id !== id)); 
            setToast({ message: 'Document deleted.', type: 'success' });
        } catch (error) {
            console.error('Delete Error:', error);
            setToast({ message: `Deletion failed: ${error.message}`, type: 'error' });
        }
    };
    // --------------------------------------

    const uploadedResume = documents.find(d => d.type === 'resume');
    const uploadedJd = documents.find(d => d.type === 'jd');

    return (
        <div className="max-w-4xl w-full mx-auto my-8 p-6 bg-white shadow-2xl rounded-2xl border border-gray-100">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Document Upload</h2>
            <p className="text-gray-500 mb-8">Upload your Resume and Job Description (PDF, max 2MB each) to start the interview simulation.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="border-2 border-dashed border-indigo-300 rounded-xl p-6 text-center hover:border-indigo-500 transition duration-300">
                    <label className="cursor-pointer block">
                        <UploadCloud className="w-10 h-10 mx-auto text-indigo-400 mb-2" />
                        <p className="font-semibold text-gray-700">Upload Resume (PDF)</p>
                        <p className="text-sm text-gray-500 mt-1">Drag and drop or click to select.</p>
                        <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={(e) => handleFileChange(e, 'resume')}
                            disabled={loading}
                        />
                    </label>
                    {(resumeFile || uploadedResume) && (
                        <p className="mt-3 text-sm font-medium text-indigo-600 truncate">
                            File: {resumeFile ? resumeFile.name : uploadedResume.fileName}
                        </p>
                    )}
                </div>

                <div className="border-2 border-dashed border-purple-300 rounded-xl p-6 text-center hover:border-purple-500 transition duration-300">
                    <label className="cursor-pointer block">
                        <UploadCloud className="w-10 h-10 mx-auto text-purple-400 mb-2" />
                        <p className="font-semibold text-gray-700">Upload Job Description (PDF)</p>
                        <p className="text-sm text-gray-500 mt-1">Drag and drop or click to select.</p>
                        <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={(e) => handleFileChange(e, 'jd')}
                            disabled={loading}
                        />
                    </label>
                    {(jdFile || uploadedJd) && (
                        <p className="mt-3 text-sm font-medium text-purple-600 truncate">
                            File: {jdFile ? jdFile.name : uploadedJd.fileName}
                        </p>
                    )}
                </div>
            </div>

            {loading && (
                <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${uploadProgress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            <button
                onClick={handleUpload}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 disabled:opacity-50"
                disabled={loading || (uploadedResume && uploadedJd)}
            >
                {loading ? <><Loader2 className="w-5 h-5 mr-2" /> Processing Files...</> : 'Process & Start Interview Prep'}
            </button>

            {documents.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Uploaded Documents</h3>
                    <ul className="space-y-3">
                        {documents.map(doc => (
                            <li key={doc._id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <span className={`font-medium ${doc.type === 'resume' ? 'text-indigo-600' : 'text-purple-600'}`}>
                                    {doc.type === 'resume' ? 'Resume' : 'Job Description'} ({doc.fileName})
                                </span>
                                <div className="text-sm text-gray-500">
                                    <span className="mr-3 hidden sm:inline">Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}</span>
                                    <button
                                        onClick={() => handleDelete(doc._id)}
                                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition"
                                        title="Delete Document"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const CitationModal = ({ isOpen, onClose, citationText, type }) => {
    // ... (unchanged) ...
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-3xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
                <h3 className={`text-xl font-bold mb-4 ${type === 'resume' ? 'text-indigo-600' : 'text-purple-600'}`}>
                    {type === 'resume' ? 'Resume Snippet' : 'JD Snippet'} (RAG Context)
                </h3>
                <div className="max-h-80 overflow-y-auto p-4 border rounded-lg bg-gray-50 text-gray-700 text-sm">
                    {citationText}
                </div>
                <button
                    onClick={onClose}
                    className="mt-6 w-full py-2 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
                >
                    Close
                </button>
            </div>
        </div>
    );
};


const AIChat = ({ documents, setToast, navigate }) => {
    // ⬇️ CRITICAL FIX: Add chatId state
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [interviewStarted, setInterviewStarted] = useState(false);
    const [citationModal, setCitationModal] = useState({ isOpen: false, text: '', type: '' });
    const [chatId, setChatId] = useState(null); // <-- Added
    // -------------------

    const resumeDoc = documents.find(d => d.type === 'resume');
    const jdDoc = documents.find(d => d.type === 'jd');

    // ⬇️ REFACTORED: Use apiClient and save chatId
    const handleStartInterview = async () => {
        setLoading(true);
        setToast({ message: 'Generating initial questions...', type: 'loading' });

        try {
            const response = await apiClient.post('chat/start', {}); 
            const data = await response.json();
            
            setChatId(data.chatId); // CRITICAL FIX: Save the ID for subsequent queries
            
            // The backend sends questions as a single string (questions.join('\n'))
            const initialMessageContent = data.questions.join('\n');

            setMessages([
                { role: 'ai', content: `Welcome! Interview started (Session: ${data.chatId}).`, score: null, feedback: null, citations: [] },
                { role: 'ai', content: initialMessageContent, score: null, feedback: null, citations: [] }
            ]);
            setInterviewStarted(true);
            setToast({ message: 'Interview started! Your first questions are ready.', type: 'success' });
        } catch (error) {
            setToast({ message: `Failed to start interview: ${error.message}`, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // ⬇️ REFACTORED: Use chatId and userMessage
    const handleSend = async (e) => {
        e.preventDefault();
        
        // CRITICAL CHECK: Ensure chat is initialized
        if (!chatId || !inputMessage.trim() || loading || !interviewStarted) {
            if (!chatId) {
                setToast({ message: 'Please click "Start Interview" first.', type: 'error' });
            }
            return;
        }
        // ----------------------------------------

        const userMessage = inputMessage.trim();
        const newMessage = { role: 'user', content: userMessage, score: null, feedback: null, citations: [] };
        const updatedMessages = [...messages, newMessage];
        setMessages(updatedMessages);
        setInputMessage('');
        setLoading(true);
        setToast({ message: 'Evaluating response and generating feedback...', type: 'loading' });

        // Find the last AI question in the messages array
        const lastQuestion = messages.slice().reverse().find(m => m.role === 'ai')?.content || "Initial Question";
        
        try {
            // Use the stored chatId and the user's actual message
            const response = await apiClient.post('chat/query', { 
                chatId: chatId, // CRITICAL FIX: Use the state variable
                question: lastQuestion, 
                answer: userMessage // CRITICAL FIX: Use the current user input string
            });
            const evaluation = await response.json();
            
            const evaluationMessage = {
                role: 'ai',
                content: evaluation.nextQuestion || 'Thank you for your response. Do you have any questions for me?', 
                score: evaluation.score,
                feedback: evaluation.feedback,
                citations: evaluation.citationIndices
            };
            
            setMessages([...updatedMessages, evaluationMessage]);
            setToast({ message: 'Feedback received! Next question asked.', type: 'success' });

        } catch (error) {
            console.error('API Error (chat/query):', error);
            setToast({ message: `Evaluation failed: ${error.message || 'Server error'}`, type: 'error' });
            setMessages(updatedMessages.slice(0, -1)); // Remove user message on failure
        } finally {
            setLoading(false);
        }
    }; 
    // --------------------------------------

    const citations = useMemo(() => ([
        { type: 'resume', text: resumeDoc?.fullText || "Resume content not available." },
        { type: 'jd', text: jdDoc?.fullText || "JD content not available." }
    ]), [resumeDoc, jdDoc]);

    const openCitationModal = (index) => {
        if (index === 0) {
            setCitationModal({ isOpen: true, text: citations[0].text, type: 'resume' });
        } else if (index === 1) {
            setCitationModal({ isOpen: true, text: citations[1].text, type: 'jd' });
        }
    };

    if (!resumeDoc || !jdDoc) {
        return (
            <div className="max-w-4xl w-full mx-auto my-8 p-8 bg-yellow-50 rounded-xl shadow-lg text-center">
                <p className="text-xl font-semibold text-yellow-800">
                    Please upload both your Resume and the Job Description in the Upload section before starting the chat.
                </p>
                <button
                    onClick={() => navigate('upload')}
                    className="mt-4 py-2 px-4 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 transition"
                >
                    Go to Upload
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] w-full max-w-4xl mx-auto p-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">AI Interview Session</h2>

            {!interviewStarted && (
                <div className="flex flex-col items-center justify-center flex-1">
                    <Zap className="w-12 h-12 text-indigo-500 mb-4" />
                    <p className="text-lg text-gray-600 mb-6">Your documents are ready. Start the simulation!</p>
                    <button
                        onClick={handleStartInterview}
                        className="py-3 px-8 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 transition disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? <><Loader2 className="w-5 h-5 mr-2 inline" /> Preparing...</> : 'Start Interview'}
                    </button>
                </div>
            )}

            {interviewStarted && (
                <>
                    <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-xl shadow-inner mb-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-xs sm:max-w-md p-4 rounded-xl shadow-md ${
                                        msg.role === 'user'
                                            ? 'bg-indigo-500 text-white rounded-br-none'
                                            : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
                                    }`}
                                >
                                    <p className="whitespace-pre-wrap">{msg.content}</p>

                                    {msg.feedback && (
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                            <p className="text-xs font-semibold text-green-600">
                                                Score: <span className="text-base font-bold">{msg.score}/10</span>
                                            </p>
                                            <p className="text-xs mt-1 text-gray-700 italic">
                                                Feedback: {msg.feedback}
                                            </p>
                                            {msg.citations && msg.citations.map((index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => openCitationModal(index)}
                                                    className={`mt-2 text-xs font-medium px-2 py-0.5 rounded-full transition ${index === 0 ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
                                                >
                                                    {index === 0 ? 'See Resume Context' : 'See JD Context'}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleSend} className="flex space-x-3">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder={loading ? "Please wait for AI response..." : "Type your answer here..."}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 disabled:bg-gray-100"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            className="bg-indigo-600 text-white p-3 rounded-xl shadow-md hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center"
                            disabled={loading || !inputMessage.trim()}
                        >
                            {loading ? <Loader2 className="w-6 h-6" /> : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9"/></svg>}
                        </button>
                    </form>
                </>
            )}

            <CitationModal
                isOpen={citationModal.isOpen}
                onClose={() => setCitationModal({ isOpen: false, text: '', type: '' })}
                citationText={citationModal.text}
                type={citationModal.type}
            />
        </div>
    );
};

const App = () => {
    const [route, setRoute] = useState('landing');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState({});
    const [documents, setDocuments] = useState([]);
    const [toast, setToast] = useState(null);

    // ⬇️ NEW: Helper function to fetch docs 
    const fetchUserDocuments = useCallback(async () => {
        if (localStorage.getItem(LOCAL_TOKEN_KEY)) {
            try {
                const response = await apiClient.get('documents/list');
                const data = await response.json();
                setDocuments(data.documents);
            } catch (error) {
                console.error("Failed to load user documents:", error);
                setToast({ message: 'Failed to load uploaded documents.', type: 'error' });
            }
        }
    }, [setDocuments, setToast]);
    // -------------------

    useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            setIsLoggedIn(true);
            setUser(JSON.parse(storedUser));
            fetchUserDocuments(); // Fetch docs immediately if logged in
        }
    }, [fetchUserDocuments]); // Added fetchUserDocuments as dependency
    // -------------------


    const handleLogout = () => {
        localStorage.removeItem(LOCAL_TOKEN_KEY);
        setIsLoggedIn(false);
        setUser({});
        setDocuments([]);
        setToast({ message: 'Logged out successfully.', type: 'success' });
        setRoute('landing');
    };

    const navigate = useCallback((newRoute) => {
        const loggedIn = !!localStorage.getItem(LOCAL_TOKEN_KEY);
        if (!loggedIn  && (newRoute === 'upload' || newRoute === 'chat')) {
            setToast({ message: 'Please log in first.', type: 'error' });
            setRoute('login');
        } else {
            setRoute(newRoute);
        }
    }, [isLoggedIn]);

    const documentsReady = documents.length === 2;

    const renderPage = () => {
        if (!isLoggedIn) {
            switch (route) {
                case 'login':
                    // ⬇️ Passed setDocuments to AuthForm 
                    return <AuthForm type="login" navigate={navigate} setIsLoggedIn={setIsLoggedIn} setUser={setUser} setToast={setToast} setDocuments={setDocuments} />;
                case 'signup':
                    return <AuthForm type="signup" navigate={navigate} setIsLoggedIn={setIsLoggedIn} setUser={setUser} setToast={setToast} />;
                default:
                    // ... (Landing Page)
                    return (
                        <div className="flex flex-col md:flex-row items-center justify-center my-8 md:my-20 px-4 md:px-0">
                            <div className="max-w-xl text-center md:text-left md:pr-12 mb-12 md:mb-0">
                                <h2 className="text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
                                    Ace Your Interview with {/* IMPROVEMENT 2: Use Typewriter component for animation */}
                                        <span className="text-indigo-600 block sm:inline">
                                            <Typewriter text="AI-Grounded Prep" speed={80} />
                                        </span>
                                </h2>
                                <p className="text-xl text-gray-600 mb-8">
                                    Stop generic practice. We analyze your Resume and the Job Description to give you personalized questions and instant, score-based feedback.
                                </p>
                                <div className="flex flex-col sm:flex-row justify-center md:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
                                    <button onClick={() => navigate('login')} className="py-3 px-8 bg-indigo-600 text-white font-bold text-lg rounded-xl shadow-lg hover:bg-indigo-700 transition transform hover:scale-105">
                                        Start Preparing Now
                                    </button>
                                    <button onClick={() => navigate('signup')} className="py-3 px-8 border-2 border-indigo-600 text-indigo-600 font-bold text-lg rounded-xl hover:bg-indigo-50 transition transform hover:scale-105">
                                        Sign Up
                                    </button>
                                </div>
                            </div>

                            <div className="mt-8 md:mt-0 p-8 bg-white shadow-2xl rounded-2xl border border-gray-100 max-w-sm w-full">
                                <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">How It Works:</h3>
                                <ul className="space-y-4">
                                    <li className="flex items-start">
                                        <UploadCloud className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                                        <span className="ml-3 text-gray-700">Step 1: Upload your Resume & JD (PDF) to build your interview context.</span>
                                    </li>
                                    <li className="flex items-start">
                                        <MessageSquare className="w-6 h-6 text-indigo-600 mt-1 flex-shrink-0" />
                                        <span className="ml-3 text-gray-700">Step 2: AI generates specific questions matching the JD requirements and your experience.</span>
                                    </li>
                                    <li className="flex items-start">
                                        <Zap className="w-6 h-6 text-yellow-500 mt-1 flex-shrink-0" />
                                        <span className="ml-3 text-gray-700">Step 3: Get an objective score (1-10) and targeted advice with citations.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    );
            }
        }

        switch (route) {
            case 'upload':
                return <DocumentManager documents={documents} setDocuments={setDocuments} setToast={setToast} user={user} navigate={navigate} />;
            case 'chat':
                return <AIChat documents={documents} setToast={setToast} navigate={navigate} />;
            default:
                return <DocumentManager documents={documents} setDocuments={setDocuments} setToast={setToast} user={user} navigate={navigate} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header
                isLoggedIn={isLoggedIn}
                user={user}
                navigate={navigate}
                handleLogout={handleLogout}
                status={{ documentsReady }}
            />
            <main className="flex-grow container mx-auto px-4 pb-8">
                {renderPage()}
            </main>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default App;
