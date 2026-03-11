import { useState, useEffect } from "react";
import "./CustomPrompt.css";

export default function CustomPrompt({ isOpen, title, defaultValue = "", onConfirm, onCancel, isConfirm = false }) {
    const [inputValue, setInputValue] = useState(defaultValue);

    useEffect(() => {
        setInputValue(defaultValue);
    }, [defaultValue, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(isConfirm ? true : inputValue);
        if (!isConfirm) setInputValue("");
    };

    return (
        <div className="custom-modal-overlay">
            <div className="custom-modal-content">
                <h3>{title}</h3>
                <form onSubmit={handleSubmit}>
                    {!isConfirm && (
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            autoFocus
                        />
                    )}
                    <div className="custom-modal-actions">
                        <button type="button" className="custom-btn-cancel" onClick={onCancel}>
                            Annuler
                        </button>
                        <button type="submit" className="custom-btn-confirm">
                            Confirmer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}