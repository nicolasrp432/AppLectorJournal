import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { enqueueMutation } from '../lib/taskQueue';

interface NodeState {
  completed: string[];
  newlyCompletedNodeId: string | null;
  completeNode: (nodeId: string) => Promise<void>;
  clearNewlyCompleted: () => void;
  fetchCompleted: (userId: string) => Promise<void>;
  reset: () => void;
}

export const useNodeStore = create<NodeState>()(
  persist(
    (set, get) => ({
      completed: [],
      newlyCompletedNodeId: null,
      reset: () => set({ completed: [], newlyCompletedNodeId: null }),

      clearNewlyCompleted: () => set({ newlyCompletedNodeId: null }),

      completeNode: async (nodeId: string) => {
        const current = get().completed;
        if (current.includes(nodeId)) return;
        const updated = [...current, nodeId];
        set({ completed: updated, newlyCompletedNodeId: nodeId });

        const { data } = await supabase.auth.getSession();
        if (data.session) {
          await enqueueMutation({
            table: 'node_completions',
            type: 'upsert',
            payload: {
              user_id: data.session.user.id,
              node_id: nodeId,
              completed_at: new Date().toISOString(),
            },
          });
        }
      },

      fetchCompleted: async (userId: string) => {
        const { data } = await supabase
          .from('node_completions')
          .select('node_id')
          .eq('user_id', userId);
        if (data) {
          // Merge server state with locally-persisted completions instead of
          // overwriting. A node completed offline lives only in the mutation
          // queue until it syncs; replacing would drop it and re-lock the next
          // node (e.g. tapping it "does nothing"). Union keeps local progress.
          const serverIds = data.map((r: { node_id: string }) => r.node_id);
          const merged = Array.from(new Set([...get().completed, ...serverIds]));
          set({ completed: merged });
        }
      },
    }),
    { name: 'lectorapp-nodes', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
