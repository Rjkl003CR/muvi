import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export interface PresenceState {
  [key: string]: { user_id: string; online_at: string }[];
}

export function usePresence(channelId: string) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (!channelId) return;

    let isMounted = true;
    let presenceChannel: ReturnType<typeof supabase.channel>;

    const setupPresence = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!isMounted) return;
      if (!userData.user) return;

      presenceChannel = supabase.channel(`presence:${channelId}`);

      presenceChannel
        .on("presence", { event: "sync" }, () => {
          if (isMounted) {
            const state = presenceChannel.presenceState();
            const users = Object.keys(state).map((key) => {
               // Extract user_id from the state
               return (state[key] as any)[0]?.user_id;
            }).filter(Boolean);
            
            // Remove duplicates
            setOnlineUsers(Array.from(new Set(users)));
          }
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await presenceChannel.track({
              user_id: userData.user.id,
              online_at: new Date().toISOString(),
            });
          }
        });
    };

    setupPresence();

    return () => {
      isMounted = false;
      if (presenceChannel) {
        supabase.removeChannel(presenceChannel);
      }
    };
  }, [channelId, supabase]);

  return { onlineUsers };
}
