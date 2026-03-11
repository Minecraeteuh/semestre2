import api from "./api";

export const cardService = {
    createCard: async (title, listId, order) => {
        return await api.post("/cards", {
            data: { title, list: listId, order, publishedAt: new Date() }
        });
    },

    updateCard: async (cardId, data) => {
        return await api.put(`/cards/${cardId}`, { data });
    },

    deleteCard: async (cardId) => {
        return await api.delete(`/cards/${cardId}`);
    }
};