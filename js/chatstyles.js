console.log("[ChatStyle] Loaded custom chat style");

const currentUser = OC.getCurrentUser()?.uid || "";

/// Custom navigation handling cho trang tin tức dùng iframe. inside url to url outside - ho tro ca /news/
window.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "external-site-navigate") return;

  const slug = event.data.path.replace("/news/", "");

  //console.log("[ChatStyle] Received navigation message:", slug);

  const matches = window.location.pathname.match(/\/apps\/external\/(\d+)/);
  const externalId = matches ? matches[1] : null;
  //console.log("externalId", externalId);
  if (externalId) {
    if (externalId == 14) {
      window.history.replaceState({}, "", `/news/${slug}`);
    } else {
      window.history.replaceState(
        {},
        "",
        `/apps/external/${externalId}/${slug}`,
      );
    }
  } else {
    // console.log(window.location.pathname);
    // Cập nhật URL Nextcloud
    if (slug != "") window.history.replaceState({}, "", `/news/${slug}`);
    else window.history.replaceState({}, "", `/news/`);
  }
});

window.addEventListener("message", async (event) => {
  const data = event.data;

  if (data?.type === "REQUEST_SHARE") {
    const realURL = window.location.href;

    const shareData = {
      title: data.title || "Chia sẻ",
      text: data.text || "",
      url: realURL,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        console.error("Share failed", e);
      }
    } else {
      await navigator.clipboard.writeText(realURL);
      //alert("Đã copy vào clipboard!");
    }
  }
});

const matches_ = window.location.pathname.match(/\/apps\/external\/(\d+)/);
const externalId_ = matches_ ? matches_[1] : null;
//console.log("externalId", externalId);
if (externalId_) {
  if (externalId_ == 14) {
    window.history.replaceState({}, "/apps/external/14/", `/news/`);
  }
}

//console.log("currentUser", currentUser);

function markOwnMessages() {
  if (!currentUser) return;
  const theme = getCurrentTheme();

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
  if (theme && theme == "dark") return theme; // 'dark' hoặc 'light'
  return "light"; // fallback
}

// Gọi ngay và theo dõi thay đổi DOM
markOwnMessages();
const observer = new MutationObserver(markOwnMessages);
observer.observe(document.body, { childList: true, subtree: true });
