import { useState, useRef, useEffect } from 'react';

const EMOJI_CATEGORIES: { name: string; icon: string; emojis: string[] }[] = [
    {
        name: 'Rostos',
        icon: '😀',
        emojis: [
            '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
            '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
            '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫',
            '🤔', '🫡', '🤐', '🤨', '😐', '😑', '😶', '🫥', '😏', '😒',
            '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒',
            '🤕', '🤢', '🤮', '🥴', '😵', '🤯', '🥳', '🥸', '😎', '🤓',
            '🧐', '😕', '🫤', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺',
            '🥹', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖',
            '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬',
            '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽',
        ],
    },
    {
        name: 'Mãos',
        icon: '👋',
        emojis: [
            '👋', '🤚', '🖐️', '✋', '🖖', '🫱', '🫲', '🫳', '🫴', '👌',
            '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉',
            '👆', '🖕', '👇', '☝️', '🫵', '👍', '👎', '✊', '👊', '🤛',
            '🤜', '👏', '🙌', '🫶', '👐', '🤲', '🤝', '🙏', '✍️', '💅',
            '🤳', '💪', '🦾', '🦿',
        ],
    },
    {
        name: 'Coração',
        icon: '❤️',
        emojis: [
            '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
            '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝',
            '💟', '♥️', '💋', '💌', '💐', '🌹', '🥀', '🌺', '🌸', '🌼',
        ],
    },
    {
        name: 'Objetos',
        icon: '🎉',
        emojis: [
            '🎉', '🎊', '🎈', '🎀', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽',
            '🏀', '🎯', '🎮', '🎲', '🎵', '🎶', '🎤', '🎧', '📱', '💻',
            '⌨️', '📷', '📹', '🎬', '📺', '📻', '⏰', '💡', '🔔', '📣',
            '💰', '💳', '📦', '✉️', '📩', '📄', '📊', '📈', '📉', '🔒',
            '🔑', '🔧', '🔨', '⚙️', '🧲', '🧪', '💊', '🩺', '🚀', '✈️',
        ],
    },
    {
        name: 'Comida',
        icon: '🍕',
        emojis: [
            '🍕', '🍔', '🍟', '🌭', '🍿', '🧀', '🥚', '🍳', '🥞', '🧇',
            '🥓', '🥩', '🍗', '🍖', '🌮', '🌯', '🫔', '🥙', '🧆', '🥗',
            '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦐', '🍩', '🍪',
            '🎂', '🍰', '🧁', '🍫', '🍬', '🍭', '🍮', '☕', '🍵', '🧃',
            '🥤', '🍺', '🍻', '🥂', '🍷', '🍸', '🍹', '🧊', '🍉', '🍊',
        ],
    },
];

interface EmojiPickerProps {
    onEmojiSelect: (emoji: string) => void;
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState(0);
    const pickerRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative" ref={pickerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-xl"
                title="Inserir emoji"
            >
                😊
            </button>

            {isOpen && (
                <div className="absolute bottom-12 left-0 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 w-80">
                    {/* Category tabs */}
                    <div className="flex border-b border-gray-200 px-2 pt-2">
                        {EMOJI_CATEGORIES.map((cat, index) => (
                            <button
                                key={cat.name}
                                onClick={() => setActiveCategory(index)}
                                className={`flex-1 p-2 text-lg rounded-t-lg transition-colors ${activeCategory === index
                                    ? 'bg-blue-50 border-b-2 border-blue-500'
                                    : 'hover:bg-gray-50'
                                    }`}
                                title={cat.name}
                            >
                                {cat.icon}
                            </button>
                        ))}
                    </div>

                    {/* Emoji grid */}
                    <div className="p-2 max-h-52 overflow-y-auto">
                        <div className="grid grid-cols-8 gap-1">
                            {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji, index) => (
                                <button
                                    key={`${emoji}-${index}`}
                                    onClick={() => {
                                        onEmojiSelect(emoji);
                                    }}
                                    className="p-1.5 text-xl hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                    title={emoji}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Category label */}
                    <div className="px-3 py-1.5 text-xs text-gray-400 border-t border-gray-100">
                        {EMOJI_CATEGORIES[activeCategory].name}
                    </div>
                </div>
            )}
        </div>
    );
}
