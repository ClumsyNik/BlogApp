import { useEffect } from "react";
import { supabase } from "../services/supabase";
import { useDispatch } from "react-redux";
import { setUser, setRestoring } from "../hooks/auth";
import type { AppDispatch } from ".";

export const useAuthRestore = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const restoreUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user?.email) {
          const { data: profile } = await supabase
            .from("tbluser")
            .select("*")
            .eq("email", session.user.email)
            .maybeSingle();

          if (profile) dispatch(setUser(profile));
        }
      } catch (err) {
        console.error("Failed to restore user:", err);
      } finally {
        dispatch(setRestoring(false));
      }
    };

    restoreUser();
  }, [dispatch]);
};