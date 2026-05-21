window.LandScopeChat = (() => {
  const STORAGE_KEY = "landscope.chat.v1";

  function loadChats() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveChats(chats) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  }

  function getThread(chats, property) {
    if (!chats[property.id]) {
      chats[property.id] = [
        {
          sender: "owner",
          text: `Hello, this is ${property.owner}. Ask me anything about ${property.society}.`,
          timestamp: new Date().toISOString()
        }
      ];
    }
    return chats[property.id];
  }

  return {
    getThread,
    loadChats,
    saveChats
  };
})();
