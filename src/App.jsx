import React, { useState, useEffect, useRef } from "react";
import { FaPaperPlane } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import userIcon from "./assets/user.png";
import aiIcon from "./assets/logo.png";
import logo from "./assets/logo.png"; // ✅ Add your logo here

const App = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(true); // ✅ Controls visibility of intro section
  const chatBoxRef = useRef(null);

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

  const handleQuickQuestion = (question) => {
    setInput(question);
    handleSubmit({ preventDefault: () => {} }); // ✅ Trigger chat
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setShowIntro(false); // ✅ Hide intro and quick questions when chat starts

    const userMessage = { sender: "user", text: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

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
      setMessages((prevMessages) => [...prevMessages, botMessage]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        botMessage.text += decoder.decode(value, { stream: true });

        setMessages((prevMessages) =>
          prevMessages.map((msg, index) =>
            index === prevMessages.length - 1 ? { ...botMessage } : msg
          )
        );
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
    <div className={`container ${!showIntro ? "chat-active" : ""}`}>
      {/* ✅ Centered Welcome Message & Quick Questions (Hidden on Chat Start) */}
      {showIntro && (
        <div className="intro">
          <img src={logo} alt="App Logo" className="logo" />
          <h1>South African Visa Advisor</h1>
          <p>Ask me anything about South African visas and immigration.</p>
          <div className="quick-questions">
            {quickQuestions.map((q, index) => (
              <button key={index} onClick={() => handleQuickQuestion(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="chat-box" ref={chatBoxRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <img
              src={msg.sender === "user" ? userIcon : aiIcon}
              alt={msg.sender}
            />
            {msg.sender === "ai" ? (
              <ReactMarkdown className="markdown">{msg.text}</ReactMarkdown>
            ) : (
              <p>{msg.text}</p>
            )}
          </div>
        ))}
        {loading && <p className="loading">Loading...</p>}
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
