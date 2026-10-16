import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

export type Conversation = Tables<"conversations"> & {
  last_message?: Tables<"messages"> | null;
  members?: (Tables<"conversation_members"> & { profile?: Tables<"profiles"> | null })[];
  unread_count?: number;
};

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    if (!user) return;

    const { data: memberships } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (!memberships?.length) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const convIds = memberships.map((m) => m.conversation_id);

    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .in("id", convIds)
      .order("updated_at", { ascending: false });

    if (!convos) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Fetch members with profiles for each conversation
    const { data: allMembers } = await supabase
      .from("conversation_members")
      .select("*, profiles:user_id(id, display_name, avatar_url, is_online, last_seen)")
      .in("conversation_id", convIds);

    // Fetch last message for each conversation
    const enriched: Conversation[] = await Promise.all(
      convos.map(async (conv) => {
        const { data: msgs } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1);

        const members = (allMembers ?? [])
          .filter((m) => m.conversation_id === conv.id)
          .map((m) => ({
            ...m,
            profile: (m as any).profiles as Tables<"profiles"> | null,
          }));

        return {
          ...conv,
          last_message: msgs?.[0] ?? null,
          members,
          unread_count: 0,
        };
      })
    );

    setConversations(enriched);
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  // Realtime subscription for new messages to update conversation list
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("conversations-updates")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        fetchConversations();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversation_members" }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { conversations, loading, refetch: fetchConversations };
}
