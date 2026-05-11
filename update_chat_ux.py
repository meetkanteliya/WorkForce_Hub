import re

with open("frontend/src/pages/chat/CompanyChat.jsx", "r", encoding="utf-8") as f:
    chat_code = f.read()

# Fix input area for Shift+Enter and Paste
input_replace = """              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                    onInputChange(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = (e.target.scrollHeight < 120 ? e.target.scrollHeight : 120) + 'px';
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                    }
                }}
                onPaste={handlePaste}
                placeholder="Type a message... (Shift+Enter for newline, @ to mention)"
                rows={1}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl
                  text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium resize-none overflow-y-auto"
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />"""

chat_code = re.sub(r'              <input\n                ref=\{inputRef\}(?:.|\n)*?/>', input_replace, chat_code)

old_render = """  const renderContent = (text) => {
    if (!text) return null;
    const parts = text.split(/(@\\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} className="font-bold text-emerald-300 dark:text-emerald-400 bg-emerald-500/10 px-0.5 rounded">{part}</span>;
      }
      return part;
    });
  };"""

new_render = """  const renderContent = (text) => {
    if (!text) return null;
    const lines = text.split('\\n');
    return lines.map((line, l_idx) => {
      const parts = line.split(/(@\\w+)/g);
      return (
        <React.Fragment key={l_idx}>
          {parts.map((part, i) => {
            if (part.startsWith('@')) {
              return <span key={i} className="font-bold text-emerald-300 dark:text-emerald-400 bg-emerald-500/10 px-0.5 rounded">{part}</span>;
            }
            return part;
          })}
          {l_idx < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };"""

chat_code = chat_code.replace(old_render, new_render)
chat_code = chat_code.replace("const parts = text.split(/(@\w+)/g);", "const parts = text.split(/(@\\w+)/g);")

with open("frontend/src/pages/chat/CompanyChat.jsx", "w", encoding="utf-8") as f:
    f.write(chat_code)
