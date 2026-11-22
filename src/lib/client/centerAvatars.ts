import { gaze, type Gaze } from "blobatar/gaze";
import "blobatar/motion.css";
import "blobatar/gaze.css";
import { centerAvatarMarkup } from "@/lib/center/avatar";

const visible = new Set<CenterAvatar>();
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
const observer = new IntersectionObserver((entries) => {
 for (const entry of entries) {
  const avatar = entry.target as CenterAvatar;
  if (entry.isIntersecting) visible.add(avatar);
  else visible.delete(avatar);
  avatar.sync();
 }
});

// Каталог отдаёт аватар пустым, с `data-avatar-seed`: 411 уникальных SVG
// весили ~530 КБ HTML. Рисуем лицо заранее, за пару экранов до карточки.
const painter = new IntersectionObserver(
 (entries) => {
  for (const entry of entries) {
   if (!entry.isIntersecting) continue;
   const avatar = entry.target as CenterAvatar;
   painter.unobserve(avatar);
   avatar.paint();
  }
 },
 { rootMargin: "800px 0px" },
);

class CenterAvatar extends HTMLElement {
 private eyes?: Gaze;

 connectedCallback() {
  if (this.dataset.avatarSeed && !this.firstElementChild) painter.observe(this);
  observer.observe(this);
 }

 paint() {
  const seed = this.dataset.avatarSeed;
  if (!seed || this.firstElementChild) return;
  this.innerHTML = centerAvatarMarkup(seed);
  this.sync();
 }

 disconnectedCallback() {
  painter.unobserve(this);
  observer.unobserve(this);
  visible.delete(this);
  this.sync();
 }

 sync() {
  const active = this.isConnected && visible.has(this) && !document.hidden && !reducedMotion.matches;
  this.toggleAttribute("data-active", active);
  if (!active || !finePointer.matches) {
   this.eyes?.stop();
   this.eyes = undefined;
   return;
  }
  const svg = this.querySelector("svg");
  if (svg && !this.eyes) {
   svg.style.setProperty("--mo-track-travel", "4px");
   this.eyes = gaze(svg, { target: "pointer" });
  }
 }
}

const syncVisible = () => visible.forEach((avatar) => avatar.sync());
document.addEventListener("visibilitychange", syncVisible);
reducedMotion.addEventListener("change", syncVisible);
finePointer.addEventListener("change", syncVisible);
if (!customElements.get("center-avatar")) customElements.define("center-avatar", CenterAvatar);
