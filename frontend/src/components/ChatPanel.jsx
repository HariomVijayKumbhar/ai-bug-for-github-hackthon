import React from 'react';
import { Zap } from 'lucide-react';

const ChatPanel = ({ chatHistory, chatMessage, setChatMessage, handleChat }) => (
  <>
    <div className="chat-messages">
      {chatHistory.map((chat, i) => (
        <div key={i} className={`chat-bubble-wrap ${chat.role}`}>
          <div className={`chat-bubble ${chat.role}`}>{chat.text}</div>
        </div>
      ))}
    </div>
    <form className="chat-input-row" onSubmit={handleChat}>
      <input
        className="chat-input"
        type="text"
        placeholder="Ask about gravity, risk, or how to fix..."
        value={chatMessage}
        onChange={e => setChatMessage(e.target.value)}
      />
      <button className="chat-send-btn" type="submit">
        <Zap size={16} color="#000" fill="#000" />
      </button>
    </form>
  </>
);

export default ChatPanel;
