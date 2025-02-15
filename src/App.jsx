import React, { useState, useEffect, useRef } from "react";
import { FaPaperPlane } from "react-icons/fa";
import userIcon from "./assets/react.svg"; // Make sure you have these images
import aiIcon from "./assets/react.svg";

const App = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDemoQuestions, setShowDemoQuestions] = useState(true);
  const chatBoxRef = useRef(null); // ✅ Ref for auto-scrolling

  const quickQuestions = [
    "How to apply for a work permit in South Africa?",
    "How to apply for a PR in South Africa?",
  ];

  // ✅ Scroll to bottom whenever messages update
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setShowDemoQuestions(false); // Hide demo questions after first message

    const userMessage = { sender: "user", text: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]); // ✅ Keep previous messages

    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input }),
      });

      if (!response.body) throw new Error("No response body");

      let botMessage = { sender: "ai", text: "" };

      // ✅ Add empty AI message first (so it doesn’t break UI)
      setMessages((prevMessages) => [...prevMessages, botMessage]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        botMessage.text += decoder.decode(value, { stream: true });

        // ✅ Correctly update the last AI message without overwriting past messages
        setMessages((prevMessages) => {
          return prevMessages.map((msg, index) =>
            index === prevMessages.length - 1 ? { ...botMessage } : msg
          );
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "ai", text: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      {showDemoQuestions && (
        <div className="quick-questions">
          {quickQuestions.map((q, index) => (
            <button key={index} onClick={() => setInput(q)}>
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="chat-box" ref={chatBoxRef}>
        {" "}
        {/* ✅ Attach ref here */}
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <img
              src={msg.sender === "user" ? userIcon : aiIcon}
              alt={msg.sender}
            />
            <p>{msg.text}</p>
          </div>
        ))}
        {loading && <p className="loading">AI is typing...</p>}
      </div>

      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          placeholder="Ask anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit">
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
};

export default App;
