// Sound and browser notifications for the Egg Timer.

// A short two-note "ding", made in code so we don't need a sound file.
export function playDing() {
  try {
    const audio = new AudioContext();
    [880, 1320].forEach((frequency, i) => {
      const tone = audio.createOscillator();
      const volume = audio.createGain();
      const start = audio.currentTime + i * 0.25;
      tone.frequency.value = frequency;
      volume.gain.setValueAtTime(0.25, start);
      volume.gain.exponentialRampToValueAtTime(0.001, start + 0.6);
      tone.connect(volume).connect(audio.destination);
      tone.start(start);
      tone.stop(start + 0.6);
    });
  } catch {
    // Some browsers block sound until the user clicks something. Not a problem.
  }
}

export function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

// The browser shows its own "Allow notifications?" prompt. Must be called from a click.
export function askForNotifications() {
  if (notificationsSupported() && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

export function notify(title, body) {
  if (notificationsSupported() && Notification.permission === "granted") {
    new Notification(title, { body });
  }
}
