import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

export function useProfiles() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Tables<"profiles">[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", user.id);
      setProfiles(data ?? []);
    };

    fetch();
  }, [user]);

  return profiles;
}
