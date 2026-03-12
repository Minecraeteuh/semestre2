import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSensors, useSensor, PointerSensor, KeyboardSensor } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { boardService } from "../services/boardService";
import { listService } from "../services/listService";
import { cardService } from "../services/cardService";

export function useBoard(boardId) {
    const navigate = useNavigate();
    const [board, setBoard] = useState(null);
    const [lists, setLists] = useState([]);
    const [editingCard, setEditingCard] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [activeColumn, setActiveColumn] = useState(null);
    const [activeCard, setActiveCard] = useState(null);
    const [user, setUser] = useState(null);

    const [promptConfig, setPromptConfig] = useState({
        isOpen: false,
        title: "",
        defaultValue: "",
        isConfirm: false,
        onConfirm: () => {}
    });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor)
    );

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            navigate("/", { replace: true });
        }

        if (boardId) fetchAll();
    }, [boardId, navigate]);

    const fetchAll = async () => {
        try {
            const b = await boardService.getBoardById(boardId);
            setBoard(b);
            const l = await listService.getListsByBoard(boardId);
            setLists(l);
        } catch (e) { console.error(e); }
    };

    const closePrompt = () => {
        setPromptConfig(prev => ({ ...prev, isOpen: false }));
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/", { replace: true });
    };

    const onDeleteList = (listId) => {
        setPromptConfig({
            isOpen: true,
            title: "Voulez-vous vraiment supprimer cette colonne ET toutes les tâches à l'intérieur ?",
            defaultValue: "",
            isConfirm: true,
            onConfirm: async () => {
                try {
                    const listToDelete = lists.find(l => String(l.documentId || l.id) === String(listId));
                    const cards = listToDelete?.cards || listToDelete?.attributes?.cards?.data || [];

                    await Promise.all(cards.map(c => cardService.deleteCard(c.documentId || c.id)));
                    await listService.deleteList(listId);

                    fetchAll();
                } catch (err) { console.error(err); }
                closePrompt();
            }
        });
    };

    const onRenameList = (listId, currentName) => {
        setPromptConfig({
            isOpen: true,
            title: "Nouveau nom de la colonne :",
            defaultValue: currentName,
            isConfirm: false,
            onConfirm: async (newName) => {
                if (!newName || newName === currentName) {
                    closePrompt();
                    return;
                }
                try {
                    await listService.updateList(listId, { name: newName });
                    fetchAll();
                } catch (err) { console.error(err); }
                closePrompt();
            }
        });
    };

    const onUpdateCard = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        const formData = new FormData(e.target);
        const rawDate = formData.get("duedate");

        const data = {
            title: formData.get("title"),
            description: formData.get("description") || "",
            label: formData.get("label") || "#cccccc",
            duedate: rawDate ? `${rawDate}T12:00:00.000Z` : null,
            order: parseInt(formData.get("order"), 10) || 1
        };

        try {
            const docId = editingCard.documentId || editingCard.id;
            await cardService.updateCard(docId, data);
            setEditingCard(null);
            fetchAll();
        } catch (err) { console.error(err); }
        finally { setIsUpdating(false); }
    };

    const onAddList = () => {
        setPromptConfig({
            isOpen: true,
            title: "Saisissez le nom de la nouvelle liste :",
            defaultValue: "",
            isConfirm: false,
            onConfirm: async (name) => {
                if (!name) {
                    closePrompt();
                    return;
                }
                const newOrder = lists.length > 0 ? Math.max(...lists.map(l => l.attributes?.order ?? l.order ?? 0)) + 1 : 1;
                try {
                    await listService.createList(name, board.id, newOrder);
                    fetchAll();
                } catch (err) { console.error(err); }
                closePrompt();
            }
        });
    };

    const onAddCard = (listId) => {
        setPromptConfig({
            isOpen: true,
            title: "Saisissez le titre de la nouvelle tâche :",
            defaultValue: "",
            isConfirm: false,
            onConfirm: async (title) => {
                if (!title) {
                    closePrompt();
                    return;
                }
                const targetList = lists.find(l => String(l.documentId || l.id) === String(listId));
                const cards = targetList?.cards || targetList?.attributes?.cards?.data || [];
                const newOrder = cards.length > 0 ? Math.max(...cards.map(c => c.attributes?.order ?? c.order ?? 0)) + 1 : 1;
                try {
                    await cardService.createCard(title, listId, newOrder);
                    fetchAll();
                } catch (err) { console.error(err); }
                closePrompt();
            }
        });
    };

    const onDeleteCard = () => {
        setPromptConfig({
            isOpen: true,
            title: "Supprimer cette tâche ?",
            defaultValue: "",
            isConfirm: true,
            onConfirm: async () => {
                try {
                    const docId = editingCard.documentId || editingCard.id;
                    await cardService.deleteCard(docId);
                    setEditingCard(null);
                    fetchAll();
                } catch (err) { console.error(err); }
                closePrompt();
            }
        });
    };

    const handleDragStart = (event) => {
        const { active } = event;
        const id = String(active.id);
        if (id.startsWith("col-")) {
            setActiveColumn(lists.find(l => String(l.documentId || l.id) === id.replace("col-", "")));
        } else if (id.startsWith("card-")) {
            const realId = id.replace("card-", "");
            let foundCard = null;
            for (const list of lists) {
                const cards = list.cards || list.attributes?.cards?.data || [];
                foundCard = cards.find(c => String(c.documentId || c.id) === realId);
                if (foundCard) break;
            }
            setActiveCard(foundCard);
        }
    };

    const handleDragCancel = () => {
        setActiveColumn(null);
        setActiveCard(null);
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = String(active.id);
        const overId = String(over.id);
        if (activeId === overId) return;

        if (activeId.startsWith("card-")) {
            setLists((prev) => {
                const newLists = prev.map(l => ({ ...l }));

                const sourceIdx = newLists.findIndex(l => (l.cards || l.attributes?.cards?.data || []).some(c => `card-${c.documentId || c.id}` === activeId));
                let targetIdx = -1;

                if (overId.startsWith("col-")) targetIdx = newLists.findIndex(l => `col-${l.documentId || l.id}` === overId);
                else if (overId.startsWith("card-")) targetIdx = newLists.findIndex(l => (l.cards || l.attributes?.cards?.data || []).some(c => `card-${c.documentId || c.id}` === overId));

                if (sourceIdx === -1 || targetIdx === -1) return prev;
                if (sourceIdx === targetIdx) return prev;

                const sCards = [...(newLists[sourceIdx].cards || newLists[sourceIdx].attributes?.cards?.data || [])].sort((a,b) => (a.attributes?.order??a.order??0) - (b.attributes?.order??b.order??0));
                const tCards = [...(newLists[targetIdx].cards || newLists[targetIdx].attributes?.cards?.data || [])].sort((a,b) => (a.attributes?.order??a.order??0) - (b.attributes?.order??b.order??0));

                const activeCardIdx = sCards.findIndex(c => `card-${c.documentId || c.id}` === activeId);
                if (activeCardIdx === -1) return prev;

                const [draggedCard] = sCards.splice(activeCardIdx, 1);

                let dropIndex = tCards.length;
                if (overId.startsWith("card-")) {
                    const overCardIdx = tCards.findIndex(c => `card-${c.documentId || c.id}` === overId);
                    if (overCardIdx !== -1) dropIndex = overCardIdx;
                }

                tCards.splice(dropIndex, 0, draggedCard);

                sCards.forEach((c, i) => { if (c.attributes) c.attributes.order = i + 1; else c.order = i + 1; });
                tCards.forEach((c, i) => { if (c.attributes) c.attributes.order = i + 1; else c.order = i + 1; });

                if (newLists[sourceIdx].attributes) newLists[sourceIdx].attributes.cards.data = sCards; else newLists[sourceIdx].cards = sCards;
                if (newLists[targetIdx].attributes) newLists[targetIdx].attributes.cards.data = tCards; else newLists[targetIdx].cards = tCards;

                return newLists;
            });
        }
    };

    const handleDragEnd = async (event) => {
        setActiveColumn(null);
        setActiveCard(null);

        const { active, over } = event;
        if (!over) return;

        try {
            if (String(active.id).startsWith("col-")) {
                let overColumnId = String(over.id);
                if (overColumnId.startsWith("card-")) {
                    const targetList = lists.find(l => (l.cards || l.attributes?.cards?.data || []).some(card => `card-${card.documentId || card.id}` === overColumnId));
                    if (targetList) overColumnId = `col-${targetList.documentId || targetList.id}`;
                }
                if (active.id === overColumnId) return;

                const sortedLists = [...lists].sort((a, b) => (a.attributes?.order ?? a.order ?? 0) - (b.attributes?.order ?? b.order ?? 0));
                const oldIndex = sortedLists.findIndex(l => `col-${l.documentId || l.id}` === active.id);
                const newIndex = sortedLists.findIndex(l => `col-${l.documentId || l.id}` === overColumnId);

                if (oldIndex !== -1 && newIndex !== -1) {
                    const newLists = arrayMove(sortedLists, oldIndex, newIndex);
                    newLists.forEach((l, i) => { if (l.attributes) l.attributes.order = i + 1; else l.order = i + 1; });
                    setLists(newLists);

                    await Promise.all(newLists.map((l, index) => listService.updateList(l.documentId || l.id, { order: index + 1 })));
                    fetchAll();
                }
                return;
            }

            if (String(active.id).startsWith("card-")) {
                const activeId = String(active.id);
                const overId = String(over.id);

                let targetList = lists.find(l => (l.cards || l.attributes?.cards?.data || []).some(c => `card-${c.documentId || c.id}` === activeId));
                if (!targetList) return;

                let cards = [...(targetList.cards || targetList.attributes?.cards?.data || [])].sort((a,b) => (a.attributes?.order??a.order??0) - (b.attributes?.order??b.order??0));
                const oldIndex = cards.findIndex(c => `card-${c.documentId || c.id}` === activeId);

                let newIndex = oldIndex;
                if (overId.startsWith("card-")) {
                    newIndex = cards.findIndex(c => `card-${c.documentId || c.id}` === overId);
                }

                if (oldIndex !== newIndex && newIndex !== -1) {
                    cards = arrayMove(cards, oldIndex, newIndex);
                }

                cards.forEach((c, i) => { if (c.attributes) c.attributes.order = i + 1; else c.order = i + 1; });

                setLists(prev => {
                    const newLists = prev.map(l => ({...l}));
                    const idx = newLists.findIndex(l => l.id === targetList.id);
                    if (newLists[idx].attributes) newLists[idx].attributes.cards.data = cards; else newLists[idx].cards = cards;
                    return newLists;
                });

                const targetListDocId = String(targetList.documentId || targetList.id);

                const promises = cards.map((card, index) => {
                    return cardService.updateCard(card.documentId || card.id, { order: index + 1, list: targetListDocId });
                });

                await Promise.all(promises);
                fetchAll();
            }
        } catch (err) {
            console.error(err);
            fetchAll();
        }
    };

    return {
        board,
        lists,
        editingCard,
        setEditingCard,
        isUpdating,
        activeColumn,
        activeCard,
        user,
        promptConfig,
        closePrompt,
        handleLogout,
        onDeleteList,
        onRenameList,
        onUpdateCard,
        onAddList,
        onAddCard,
        onDeleteCard,
        handleDragStart,
        handleDragCancel,
        handleDragOver,
        handleDragEnd,
        sensors,
        navigate
    };
}