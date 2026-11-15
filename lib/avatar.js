// Your avatar: one of the chicks in your Henhouse (profile.avatarChickId), shown with its own
// color and outfit. The chick picked at setup (profile.avatar, e.g. "mint") joins the flock as
// its first chick, and is the avatar until another is picked. <Chick variant={avatar} /> accepts
// either form.

import { useEffect } from "react";
import { STARTER_CHICK_ID, withStarterChick } from "@/lib/flock";
import { load, save, useStored } from "@/lib/storage";

export function avatarLook(profile, flock) {
  const chick = profile?.avatarChickId && flock?.chicks?.find((c) => c.id === profile.avatarChickId);
  if (chick) return { variant: chick.color, color: chick.paint, wear: chick.wear };
  // No Henhouse chick picked (or it was fried into a drumstick): the starter avatar.
  return profile?.avatar ?? "sunny";
}

// React hook: profiles made before starter chicks joined the flock get theirs (once), and it
// becomes the avatar if no Henhouse chick was picked. Runs in the app layout.
export function useStarterChick() {
  const profile = useStored("profile");
  const flock = useStored("flock");
  const hasStarter = flock?.chicks?.some((c) => c.id === STARTER_CHICK_ID);
  useEffect(() => {
    if (!profile || flock === undefined || hasStarter) return;
    save("flock", withStarterChick(load("flock"), profile.avatar));
    if (!profile.avatarChickId) save("profile", { ...load("profile"), avatarChickId: STARTER_CHICK_ID });
  }, [profile, flock, hasStarter]);
}

// React hook: the avatar to draw right now.
export function useAvatar() {
  return avatarLook(useStored("profile"), useStored("flock"));
}
