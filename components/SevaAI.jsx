





import React, { useEffect, useRef, useState } from 'react'
import { Send, Mic, Paperclip, Globe, ChevronUp, ChevronDown } from "lucide-react";

const LANGUAGES = [
  { code: 'en-IN', label: 'English' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'mr-IN', label: 'Marathi' }
]

export default function Chatbot() {
  const [message, setMessage] = useState('')
  const [chat, setChat] = useState([])
  const [imageFile, setImageFile] = useState(null)
  const messagesEndRef = useRef(null)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)
  const [extended, setExtended] = useState(false);
  useEffect(() => { scrollToBottom() }, [chat])
   const [selectedLang, setSelectedLang] = useState("en-IN");
  const [speaking, setSpeaking] = useState(false);


  function scrollToBottom() {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }

  async function handleSend() {
    const text = message.trim()
    if (!text && !imageFile) return

    if (text) setChat(prev => [...prev, { sender: 'user', text }])
    if (imageFile) setChat(prev => [...prev, { sender: 'user', text: `📎 Sent image: ${imageFile.name}` }])

    setMessage('')

    try {
      const form = new FormData()
      if (text) form.append('message', text)
      if (imageFile) form.append('image', imageFile)
      form.append('lang', selectedLang)

      const res = await fetch('/api/chat', { method: 'POST', body: form })

      if (!res.ok) throw new Error('Network error')
      const data = await res.json()
      const reply = data.reply || data.answer || 'No reply'
      setChat(prev => [...prev, { sender: 'bot', text: reply }])
      speakText(reply)
    } catch (err) {
      console.error(err)
      setChat(prev => [...prev, { sender: 'bot', text: 'Error: could not reach server.' }])
    } finally {
      setImageFile(null)
    }
  }

 function speakText(text) {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = selectedLang;

    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(
      (v) =>
        v.lang.startsWith(selectedLang.split("-")[0]) &&
        v.name.toLowerCase().includes("female")
    );
    if (femaleVoice) utter.voice = femaleVoice;

    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);

    window.speechSynthesis.speak(utter);
  }

  function stopSpeaking() {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition not supported')
      return
    }
    if (recognitionRef.current) {
      if (listening) {
        recognitionRef.current.stop()
        setListening(false)
        return
      }
    } else {
      const rec = new SpeechRecognition()
      rec.lang = selectedLang || 'en-IN'
      rec.interimResults = false
      rec.maxAlternatives = 1
      rec.onresult = (evt) => {
        const t = evt.results[0][0].transcript
        setMessage(prev => prev ? prev + ' ' + t : t)
      }
      rec.onerror = (e) => console.error('rec error', e)
      rec.onend = () => setListening(false)
      recognitionRef.current = rec
    }
    try {
      recognitionRef.current.start()
      setListening(true)
    } catch (e) { console.error(e) }
  }

  return (
 <div
      style={{
        maxWidth: "100%",
        width: "100%",
        maxWidth: 480,
        margin: "20px auto",
        fontFamily: "sans-serif",
        background: "#f3f4f6",
        borderRadius: 20,
        padding: 12,
        boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
        height: "90vh",
      }}
    >
      
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
       
        {chat.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: m.sender === "user" ? "flex-end" : "flex-start",
              animation: "fadeIn 0.3s ease",
            }}
          >
            <div
              style={{
                background: m.sender === "user" ? "#8b5cf6" : "#ffffff",
                color: m.sender === "user" ? "white" : "#111827",
                padding: "10px 14px",
                borderRadius: 16,
                borderTopRightRadius: m.sender === "user" ? 0 : 16,
                borderTopLeftRadius: m.sender === "user" ? 16 : 0,
                maxWidth: "80%",
                wordBreak: "break-word",
                fontSize: 14,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: 12,
          borderTop: "1px solid #d1d5db",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          background: "#f9fafb",
          borderRadius: 12,
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        }}
      >
        
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 16,
              border: "1px solid #d1d5db",
              outline: "none",
              fontSize: 14,
              background: "white",
              minWidth: 0,
            }}
          />

         
          <button
            onClick={() => setExtended(!extended)}
            style={{
              padding: "8px 10px",
              background: "#e5e7eb",
              borderRadius: 12,
              border: "1px solid #d1d5db",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {extended ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>

         
          <button
            onClick={handleSend}
            style={{
              padding: "8px 14px",
              background: "#22c55e",
              color: "white",
              borderRadius: 16,
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Send size={16} /> Send
          </button>
        </div>

       
        {extended && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
              animation: "fadeIn 0.3s ease-in",
            }}
          >
            
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Globe size={18} />
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 12,
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

           
            <label
              style={{
                padding: "8px 12px",
                borderRadius: 12,
                border: "1px solid #d1d5db",
                background: "#ffffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Paperclip size={18} />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                style={{ display: "none" }}
              />
            </label>

             <button
          onClick={stopSpeaking}
          style={{
            padding: "8px 14px",
            background: "#ef4444",
            color: "white",
            borderRadius: 16,
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Stop
        </button>
            <button
              onClick={startListening}
              style={{
                padding: "8px 12px",
                background: listening ? "#ef4444" : "#10b981",
                color: "white",
                borderRadius: 16,
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Mic size={16} />
              {listening ? "Stop" : "Speak"}
            </button>
          </div>
        )}

       
        {imageFile && (
          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              color: "#4b5563",
              padding: "6px 12px",
              borderRadius: 12,
              background: "#e5e7eb",
              animation: "fadeIn 0.3s ease-in",
            }}
          >
            Selected: {imageFile.name}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {opacity: 0; transform: translateY(5px);}
          to {opacity: 1; transform: translateY(0);}
        }
      `}</style>
    </div>



  )
}