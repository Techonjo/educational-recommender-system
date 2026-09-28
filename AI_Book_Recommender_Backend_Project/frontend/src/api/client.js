import axios from 'axios';

// In production (Render), VITE_API_URL is injected at build time.
// The hardcoded URL below acts as a reliable production fallback.
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'https://ai-book-recommender-api.onrender.com/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach JWT token to all requests if it exists
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getCourses = async () => {
  const response = await apiClient.get('/courses?limit=100');
  return response.data;
};

export const getRecommendations = async (courseId, topN = 10) => {
  const response = await apiClient.post('/recommendations', {
    course_id: courseId,
    top_n: topN
  });
  return response.data;
};

export const getPersonalizedRecommendations = async () => {
  const response = await apiClient.get('/recommendations/personalized');
  return response.data;
};

export const logInteraction = async (bookId, interactionType = 'click', courseId = null) => {
  const response = await apiClient.post('/interactions', {
    user_id: "ignored", // overridden by JWT token on the backend
    book_id: bookId,
    interaction_type: interactionType,
    course_id: courseId,
  });
  return response.data;
};

export const logInterests = async (topics) => {
  if (!topics || topics.length === 0) return true;
  
  // To avoid backend schema migrations, we map topics to real books
  // by doing a quick search for each topic and logging an "interest" interaction
  // against the top result.
  const promises = topics.map(async (topic) => {
    try {
      const searchRes = await apiClient.post('/recommendations/search', {
        query: topic,
        top_n: 1
      });
      if (searchRes.data?.recommendations?.length > 0) {
        const bookId = searchRes.data.recommendations[0].book_id;
        await logInteraction(bookId, 'interest', topic);
      }
    } catch (e) {
      console.warn("Could not log interest for topic:", topic, e);
    }
  });
  
  await Promise.all(promises);
  return true;
};

export const searchBooks = async (query, topN = 10) => {
  const response = await apiClient.post('/recommendations/search', {
    query,
    top_n: topN
  });
  return response.data;
};

export const getVideoRecommendations = async (query, topN = 10) => {
  const response = await apiClient.post('/recommendations/videos', {
    query,
    top_n: topN
  });
  return response.data;
};

// --- Auth API Calls ---

export const registerUser = async (name, email, password) => {
  const response = await apiClient.post('/auth/register', { name, email, password });
  return response.data;
};

export const loginUser = async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data;
};

export const getMe = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};
