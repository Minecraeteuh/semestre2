import { useParams } from "react-router-dom";
import "./Board.css";
import { DndContext, closestCorners, DragOverlay, defaultDropAnimationSideEffects } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";

import BoardList from "../components/BoardList";
import TaskModal from "../components/TaskModal";
import CustomPrompt from "../components/CustomPrompt";
import Navbar from "../components/Navbar";
import { useBoard } from "../hooks/useBoard";

const dropAnimationConfig = {
  duration: 250,
  easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.2" } } }),
};

export default function Board() {
  const { id: boardId } = useParams();

  const {
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
  } = useBoard(boardId);

  if (!board) return <div className="board-loader">Chargement du tableau...</div>;

  const sortedLists = [...lists].sort((a, b) => {
    const orderA = a.attributes?.order ?? a.order ?? 0;
    const orderB = b.attributes?.order ?? b.order ?? 0;
    return orderA - orderB;
  });

  return (
      <div className="board-page">
        <Navbar user={user} onLogout={handleLogout} />

        <header className="board-nav">
          <div className="board-nav-left">
            <button onClick={() => navigate("/dashboard")} className="board-back-btn">Retour</button>
            <h1 className="board-title">{board.title || board.attributes?.title}</h1>
          </div>
        </header>

        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
          <main className="board-container">
            <SortableContext items={sortedLists.map(l => `col-${l.documentId || l.id}`)} strategy={horizontalListSortingStrategy}>
              {sortedLists.map((list) => (
                  <BoardList
                      key={list.id}
                      list={list}
                      onAddCard={onAddCard}
                      onEditCard={setEditingCard}
                      onDeleteList={onDeleteList}
                      onRenameList={onRenameList}
                  />
              ))}
            </SortableContext>
            <button onClick={onAddList} className="board-new-column">+ Nouvelle liste</button>
          </main>

          <DragOverlay dropAnimation={dropAnimationConfig} zIndex={9999}>
            {activeColumn && (
                <div className="board-list" style={{ opacity: 0.9, boxShadow: "0px 10px 20px rgba(0,0,0,0.15)", cursor: "grabbing" }}>
                  <div className="board-list-head" style={{ borderBottom: "1px solid #ddd", paddingBottom: "10px", fontWeight: "bold" }}>
                    <span style={{ color: "#7f8c8d", fontSize: "16px", marginRight: "8px", fontWeight: "bold" }}>::</span>
                    {activeColumn.name || activeColumn.attributes?.name}
                  </div>
                </div>
            )}
            {activeCard && (
                <div className="board-card" style={{ opacity: 0.95, borderLeft: "5px solid gray", boxShadow: "0px 8px 16px rgba(0,0,0,0.15)", cursor: "grabbing" }}>
                  <div className="board-card-title">{activeCard.title || activeCard.attributes?.title}</div>
                </div>
            )}
          </DragOverlay>
        </DndContext>

        <TaskModal
            editingCard={editingCard}
            isUpdating={isUpdating}
            onClose={() => setEditingCard(null)}
            onUpdate={onUpdateCard}
            onDelete={onDeleteCard}
        />

        <CustomPrompt
            isOpen={promptConfig.isOpen}
            title={promptConfig.title}
            defaultValue={promptConfig.defaultValue}
            isConfirm={promptConfig.isConfirm}
            onConfirm={promptConfig.onConfirm}
            onCancel={closePrompt}
        />
      </div>
  );
}