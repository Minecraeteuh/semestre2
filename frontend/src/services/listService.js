import api from "./api";

export const listService = {
    getListsByBoard: async (boardId) => {
        const res = await api.get(`/lists?filters[board][documentId][$eq]=${boardId}&populate=*`);
        return res.data.data || [];
    },

    createList: async (name, boardId, order) => {
        return await api.post("/lists", {
            data: { name, board: boardId, order, publishedAt: new Date() }
        });
    },

    updateList: async (listId, data) => {
        return await api.put(`/lists/${listId}`, { data });
    },

    deleteList: async (listId) => {
        return await api.delete(`/lists/${listId}`);
    }
};