import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { ChatMessageData } from "@/types/chat";

export function useRealtimeMessages(channelId: string | null) {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!channelId) return;

    let isMounted = true;

    // Fetch initial messages
    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: true })
        .limit(50);

      if (error) {
        console.error("Error fetching messages:", error);
      } 
      
      if (isMounted) {
        let fetchedMsgs = data as ChatMessageData[] | null;
        if (!fetchedMsgs || fetchedMsgs.length === 0) {
           fetchedMsgs = [
             { id: 'm1', channel_id: channelId, user_id: 'u1', content: 'Hey everyone! Has anyone seen the new Denis Villeneuve movie?', created_at: new Date(Date.now() - 3600000).toISOString(), user: { id: 'u1', user_metadata: { full_name: 'Alice', avatar_url: 'https://i.pravatar.cc/150?u=alice' } }, movie_data: null },
             { id: 'm2', channel_id: channelId, user_id: 'u2', content: 'Yes! It was absolutely mind-blowing. The visuals were stunning.', created_at: new Date(Date.now() - 3500000).toISOString(), user: { id: 'u2', user_metadata: { full_name: 'Bob', avatar_url: 'https://i.pravatar.cc/150?u=bob' } }, movie_data: null },
             { id: 'm3', channel_id: channelId, user_id: 'u1', content: 'I still think about this masterpiece though:', created_at: new Date(Date.now() - 3400000).toISOString(), user: { id: 'u1', user_metadata: { full_name: 'Alice', avatar_url: 'https://i.pravatar.cc/150?u=alice' } }, movie_data: { id: 157336, title: 'Interstellar', poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', release_date: '2014-11-05' } }
           ];
        }
        setMessages(fetchedMsgs);
      }
      if (isMounted) setLoading(false);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`public:messages:channel_id=eq.${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          if (isMounted) {
            setMessages((prev) => [...prev, payload.new as ChatMessageData]);
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [channelId, supabase]);

  const sendMessage = async (content: string, movieData?: any, fileData?: { file: File, previewUrl: string } | null) => {
    if (!channelId) return;
    
    const { data: userData } = await supabase.auth.getUser();
    
    // For demo purposes, if not logged in, we use a mock user
    const user = userData?.user || { 
      id: 'mock-user-1', 
      user_metadata: { full_name: 'You (Demo)', avatar_url: 'https://i.pravatar.cc/150?u=mock' } 
    };

    let attachment_url: string | null = null;
    let attachment_type: 'image' | 'file' | null = null;

    if (fileData) {
      // Mock upload for demonstration purposes
      attachment_url = fileData.previewUrl;
      attachment_type = fileData.file.type.startsWith('image/') ? 'image' : 'file';
    }

    const newMessage: any = {
      channel_id: channelId,
      user_id: user.id,
      content,
      movie_data: movieData || null,
      attachment_url,
      attachment_type,
    };

    // Try inserting into Supabase
    const { error } = await supabase.from("messages").insert([newMessage]);
    
    if (error) {
      console.warn("Supabase insert failed (likely tables missing), falling back to local state mock:", error);
      // Simulate real-time insert locally
      const mockedMsg: ChatMessageData = {
        id: 'mock-msg-' + Date.now(),
        channel_id: channelId,
        user_id: user.id,
        content,
        movie_data: movieData || null,
        attachment_url,
        attachment_type,
        created_at: new Date().toISOString(),
        user: user as any
      };
      setMessages((prev) => [...prev, mockedMsg]);
    }
  };

  return { messages, loading, sendMessage };
}
