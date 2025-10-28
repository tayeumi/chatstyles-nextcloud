console.log("[ChatStyle] Loaded custom chat style");

const currentUser = OC.getCurrentUser()?.uid || "";

//console.log("currentUser", currentUser);

function markOwnMessages() {
  if (!currentUser) return;
  const theme=getCurrentTheme();

  document.querySelectorAll(".wrapper.messages-group").forEach((group) => {
    const avatarImg = group.querySelector(".messages__avatar img");
    if (!avatarImg) return;

    const match = avatarImg.src.match(/\/avatar\/([^/]+)\//);
    const sender = match ? match[1] : null;

    if (sender === currentUser) {
      if (!group.classList.contains("own")) {
        group.classList.add("own");
        group.classList.add(`owntext_${theme}`);
        group.classList.add(`message_own`);

        // console.log(`[ChatStyle] Marked own message group: ${sender}`);
      }
    } else {

      group.classList.remove("own");
      group.classList.remove(`owntext_${theme}`);
      group.classList.remove("message_own");

    }
    
  });
}

function getCurrentTheme() {
  const theme = document.body.getAttribute("data-themes");
  if (theme && theme=='dark') return theme; // 'dark' hoặc 'light' 
  return "light"; // fallback
}


// Gọi ngay và theo dõi thay đổi DOM
markOwnMessages();
const observer = new MutationObserver(markOwnMessages);
observer.observe(document.body, { childList: true, subtree: true });
