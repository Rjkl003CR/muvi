export type ChannelType = "general" | "genre" | "dm";

export interface Channel {
  id: string;
  name: string | null;
  type: ChannelType;
  created_at: string;
}

export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    avatar_url?: string;
    full_name?: string;
    name?: string;
  };
}

export interface ChatMessageData {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  movie_data: any | null;
  attachment_url?: string | null;
  attachment_type?: 'image' | 'file' | null;
  created_at: string;
  user?: User; // We will populate this manually if joining is hard, or fetch via a view
}
