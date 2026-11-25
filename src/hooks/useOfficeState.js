import { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_AGENTS,
  DEFAULT_BRIEF,
  EXTRA_AGENT_SLOTS,
  MEETING_SEATS,
} from '../constants/officeConfig';

const STORAGE_KEY = 'virtual_office_ai_v2_1';
const SESSION_KEYS_STORAGE = 'virtual_office_ai_keys_session';

export function createSession(title = 'Sesi Baru', initialLogs = []) {
  return {
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    logs: initialLogs,
  };
}

export function createNpcEntity(agent, idx = 0) {
  const defaultX = [815, 865, 895][idx] ?? 850;
  const defaultY = [185, 205, 165][idx] ?? 185;
  const deskX = [470, 605, 850][idx] ?? 500;
  const deskY = [235, 235, 650][idx] ?? 235;

  const resolvedHome =
    typeof agent.homeSpot === 'object' && agent.homeSpot !== null
      ? agent.homeSpot
      : { x: defaultX, y: defaultY };

  const resolvedDesk =
    typeof agent.deskSpot === 'object' && agent.deskSpot !== null
      ? agent.deskSpot
      : { x: deskX, y: deskY };

  return {
    ...agent,
    x: resolvedHome.x,
    y: resolvedHome.y,
    homeSpot: resolvedHome,
    deskSpot: resolvedDesk,
    state: 'IDLE',
    statusBubble: '',
    carryingDoc: false,
    hasReportExclamation: false,
    pathQueue: [],
    onArriveCallback: null,
    walkPhase: Math.random() * 6,
    facing: 'down',
    roamTarget: null,
    roamPath: [],
    pendingIdleBubble: '',
    roamCooldown: 1 + Math.random() * 2,
  };
}

export function useOfficeState() {
  const initialSession = useRef(createSession('Sesi 1')).current;

  const [aiProvider, setAiProvider] = useState('auto');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [deepseekApiKey, setDeepseekApiKey] = useState('');
  const [rememberKeys, setRememberKeys] = useState(false);
  const [projectBrief, setProjectBrief] = useState(DEFAULT_BRIEF);
  const [apiMode, setApiMode] = useState('demo');
  const [maxRevisions, setMaxRevisions] = useState(2);

  const [workflowMode, setWorkflowMode] = useState('relay');
  const [fastAgentId, setFastAgentId] = useState('raka');

  const [agents, setAgents] = useState(DEFAULT_AGENTS);
  const [sessions, setSessions] = useState([initialSession]);
  const [activeSessionId, setActiveSessionId] = useState(initialSession.id);
  const [hydrated, setHydrated] = useState(false);

  const directorRef = useRef({
    name: 'Director (You)',
    accentHex: '#ec4899',
    hairColor: '#f8fafc',
    skinColor: '#fde68a',
    x: MEETING_SEATS.director.x,
    y: MEETING_SEATS.director.y,
    facing: MEETING_SEATS.director.facing,
    isSitting: true,
    walkPhase: 0,
    isMoving: false,
    pathQueue: [],
    onArriveCallback: null,
    targetMarker: null,
  });

  const npcRef = useRef((DEFAULT_AGENTS || []).map((a, idx) => createNpcEntity(a, idx)));

  const syncNpcsWithAgents = (nextAgents) => {
    const existingById = new Map(npcRef.current.map((n) => [n.id, n]));
    npcRef.current = nextAgents.map((ag, idx) => {
      const prev = existingById.get(ag.id);
      if (prev) {
        return {
          ...prev,
          name: ag.name,
          role: ag.role,
          sop: ag.sop,
          preferredModel: ag.preferredModel || 'auto',
          homeSpot: ag.homeSpot,
          deskSpot: ag.deskSpot,
          deskRect: ag.deskRect,
          accentHex: ag.accentHex,
          shirtColor: ag.shirtColor,
        };
      }
      return createNpcEntity(ag, idx);
    });
  };

  // Load saved state + secure key storage migration
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      const sessionKeys = JSON.parse(sessionStorage.getItem(SESSION_KEYS_STORAGE) || 'null');

      if (saved) {
        if (saved.projectBrief) setProjectBrief(saved.projectBrief);
        if (saved.apiMode) setApiMode(saved.apiMode);
        if (saved.aiProvider) setAiProvider(saved.aiProvider);
        if (typeof saved.maxRevisions === 'number') {
          setMaxRevisions(Math.max(0, Math.min(3, saved.maxRevisions)));
        }
        if (saved.workflowMode === 'relay' || saved.workflowMode === 'fast') {
          setWorkflowMode(saved.workflowMode);
        }
        if (saved.fastAgentId) setFastAgentId(saved.fastAgentId);

        const hasLegacyLocalKeys = Boolean(saved.geminiApiKey || saved.deepseekApiKey);
        const shouldRemember =
          typeof saved.rememberKeys === 'boolean' ? saved.rememberKeys : hasLegacyLocalKeys;
        setRememberKeys(shouldRemember);

        if (shouldRemember) {
          if (saved.geminiApiKey) setGeminiApiKey(saved.geminiApiKey);
          if (saved.deepseekApiKey) setDeepseekApiKey(saved.deepseekApiKey);
        } else if (sessionKeys) {
          if (sessionKeys.geminiApiKey) setGeminiApiKey(sessionKeys.geminiApiKey);
          if (sessionKeys.deepseekApiKey) setDeepseekApiKey(sessionKeys.deepseekApiKey);
        }

        if (Array.isArray(saved.sessions) && saved.sessions.length > 0) {
          const cleaned = saved.sessions.map((s) => ({
            ...s,
            logs: Array.isArray(s.logs) ? s.logs.map((l) => ({ ...l, isStreaming: false })) : [],
          }));
          setSessions(cleaned);
          const validActive = cleaned.some((s) => s.id === saved.activeSessionId)
            ? saved.activeSessionId
            : cleaned[0].id;
          setActiveSessionId(validActive);
        } else if (Array.isArray(saved.logs) && saved.logs.length > 0) {
          const firstDir = saved.logs.find((l) => l.agentId === 'director');
          const title = firstDir?.content ? firstDir.content.slice(0, 40) : 'Sesi Sebelumnya';
          const migrated = createSession(title, saved.logs);
          setSessions([migrated]);
          setActiveSessionId(migrated.id);
        }

        if (Array.isArray(saved.agents) && saved.agents.length >= 3) {
          const mergedAgents = saved.agents.map((savedAg, idx) => {
            const coreDef = DEFAULT_AGENTS.find((d) => d.id === savedAg.id);
            if (coreDef) {
              return {
                ...coreDef,
                name: savedAg.name || coreDef.name,
                role: savedAg.role || coreDef.role,
                sop: savedAg.sop || coreDef.sop,
                preferredModel: savedAg.preferredModel || 'auto',
              };
            }
            const slot =
              EXTRA_AGENT_SLOTS[(idx - 3) % EXTRA_AGENT_SLOTS.length] || EXTRA_AGENT_SLOTS[0];
            return {
              ...slot,
              ...savedAg,
              preferredModel: savedAg.preferredModel || 'auto',
              homeSpot: savedAg.homeSpot || slot.homeSpot,
              deskSpot: savedAg.deskSpot || slot.deskSpot,
              deskRect: savedAg.deskRect || slot.deskRect,
            };
          });
          setAgents(mergedAgents);
          syncNpcsWithAgents(mergedAgents);
        }
      } else if (sessionKeys) {
        if (sessionKeys.geminiApiKey) setGeminiApiKey(sessionKeys.geminiApiKey);
        if (sessionKeys.deepseekApiKey) setDeepseekApiKey(sessionKeys.deepseekApiKey);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Persist state — API key hanya masuk localStorage jika rememberKeys === true
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          projectBrief,
          apiMode,
          aiProvider,
          rememberKeys,
          geminiApiKey: rememberKeys ? geminiApiKey : '',
          deepseekApiKey: rememberKeys ? deepseekApiKey : '',
          maxRevisions,
          workflowMode,
          fastAgentId,
          agents,
          sessions,
          activeSessionId,
        })
      );

      if (!rememberKeys) {
        sessionStorage.setItem(
          SESSION_KEYS_STORAGE,
          JSON.stringify({ geminiApiKey, deepseekApiKey })
        );
      } else {
        sessionStorage.removeItem(SESSION_KEYS_STORAGE);
      }
    } catch {
      // ignore storage quota errors
    }
  }, [
    hydrated,
    projectBrief,
    apiMode,
    aiProvider,
    rememberKeys,
    geminiApiKey,
    deepseekApiKey,
    maxRevisions,
    workflowMode,
    fastAgentId,
    agents,
    sessions,
    activeSessionId,
  ]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const logs = activeSession?.logs || [];

  const appendLogToSession = (sessionId, entry, autoTitleFromText = '') => {
    const id = `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newEntry = {
      id,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      ...entry,
    };
    setSessions((prev) =>
      prev.map((sess) => {
        if (sess.id !== sessionId) return sess;
        const shouldAutoTitle =
          autoTitleFromText &&
          sess.logs.length === 0 &&
          /^Sesi(\s+\d+|\s+Baru)$/i.test(sess.title);
        const nextTitle = shouldAutoTitle
          ? autoTitleFromText.replace(/\s+/g, ' ').trim().slice(0, 42)
          : sess.title;
        return {
          ...sess,
          title: nextTitle,
          logs: [...sess.logs, newEntry],
        };
      })
    );
    return newEntry;
  };

  const updateLogInSession = (sessionId, logId, updater) => {
    setSessions((prev) =>
      prev.map((sess) => {
        if (sess.id !== sessionId) return sess;
        return {
          ...sess,
          logs: sess.logs.map((item) =>
            item.id === logId
              ? typeof updater === 'function'
                ? updater(item)
                : { ...item, ...updater }
              : item
          ),
        };
      })
    );
  };

  const removeLogFromSession = (sessionId, logId) => {
    setSessions((prev) =>
      prev.map((sess) =>
        sess.id === sessionId ? { ...sess, logs: sess.logs.filter((l) => l.id !== logId) } : sess
      )
    );
  };

  return {
    aiProvider,
    setAiProvider,
    geminiApiKey,
    setGeminiApiKey,
    deepseekApiKey,
    setDeepseekApiKey,
    rememberKeys,
    setRememberKeys,
    projectBrief,
    setProjectBrief,
    apiMode,
    setApiMode,
    maxRevisions,
    setMaxRevisions,
    workflowMode,
    setWorkflowMode,
    fastAgentId,
    setFastAgentId,
    agents,
    setAgents,
    sessions,
    setSessions,
    activeSessionId,
    setActiveSessionId,
    activeSession,
    logs,
    directorRef,
    npcRef,
    syncNpcsWithAgents,
    appendLogToSession,
    updateLogInSession,
    removeLogFromSession,
  };
}
