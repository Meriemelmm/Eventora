import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3002',
    headers: {
        'Content-Type': 'application/json',
    },
});

// export const eventApi = {
//     getAll: async () => {
//         const response = await api.get('/events/public');
//         console.log("response data",response.data);
//         return response.data.data;
//     },
    
// };

export default api;
