const sections = document.querySelectorAll(".reveal");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.style.animationPlayState = "running";
      observer.unobserve(entry.target);
    });
  },
  {
    threshold: 0.15,
  }
);

sections.forEach((section) => {
  section.style.animationPlayState = "paused";
  observer.observe(section);
});

const fileInput = document.querySelector("#file");
const fileName = document.querySelector("#file-name");

if (fileInput && fileName) {
  fileInput.addEventListener("change", () => {
    const name = fileInput.files && fileInput.files[0] ? fileInput.files[0].name : "No file selected";
    fileName.textContent = name;
  });
}

const expiryInput = document.querySelector("#expiryAt");
const presetButtons = document.querySelectorAll(".preset-btn");

function setExpiry(hoursAhead) {
  if (!expiryInput) return;
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const target = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
  expiryInput.value = target.toISOString().slice(0, 16);
}

if (expiryInput && presetButtons.length > 0) {
  setExpiry(24);

  presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      presetButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      const custom = button.dataset.custom === "true";
      if (custom) {
        expiryInput.focus();
        return;
      }

      const hours = Number(button.dataset.hours || "24");
      setExpiry(hours);
    });
  });
}
