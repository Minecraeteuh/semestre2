import api from "./api";

export const boardService = {
    getUserBoards: async (userId) => {
        const res = await api.get(`/boards?populate=*&sort=createdAt:desc`);
        const allBoards = res.data.data || [];
        return allBoards.filter((b) => {
            const boardAuthorId = b.authorId || b.attributes?.authorId;
            return String(boardAuthorId) === String(userId);
        });
    },

    createBoard: async (title, userId) => {
        const payload = {
            data: {
                title: title,
                authorId: String(userId),
                publishedAt: new Date().toISOString()
            }
        };
        return await api.post("/boards", payload);
    },

    deleteBoard: async (boardId) => {
        return await api.delete(`/boards/${boardId}`);
    },

    getBoardById: async (boardId) => {
        const res = await api.get(`/boards/${boardId}`);
        return res.data.data;
    }
};