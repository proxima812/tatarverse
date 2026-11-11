import { gaze, type Gaze } from "blobatar/gaze";
import "blobatar/motion.css";
import "blobatar/gaze.css";

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

class CenterAvatar extends HTMLElement {
 private eyes?: Gaze;

 connectedCallback() {
  observer.observe(this);
 }

 disconnectedCallback() {
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
