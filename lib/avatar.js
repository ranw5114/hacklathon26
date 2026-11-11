// Your avatar: either a starter chick (profile.avatar, e.g. "mint") or one of your hatched
// chicks from the Henhouse (profile.avatarChickId), shown with its own color and outfit.
// <Chick variant={avatar} /> accepts either form.

import { useStored } from "@/lib/storage";

export function avatarLook(profile, flock) {
  const chick = profile?.avatarChickId && flock?.chicks?.find((c) => c.id === profile.avatarChickId);
  if (chick) return { variant: chick.color, color: chick.paint, wear: chick.wear };
  // No Henhouse chick picked (or it was fried into a drumstick): the starter avatar.
  return profile?.avatar ?? "sunny";
}

// React hook: the avatar to draw right now.
export function useAvatar() {
  return avatarLook(useStored("profile"), useStored("flock"));
}
