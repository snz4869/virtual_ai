import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import {
  AVAILABLE_MODELS,
  CORE_AGENT_IDS,
  DEFAULT_AGENTS,
  EXTRA_AGENT_SLOTS,
} from '../constants/officeConfig';

const MAX_TOTAL_AGENTS = DEFAULT_AGENTS.length + EXTRA_AGENT_SLOTS.length;

export default function TeamSopModal({ initialAgents, onClose, onSave, onNotify }) {
  const [draftAgents, setDraftAgents] = useState(() => JSON.parse(JSON.stringify(initialAgents)));

  const handleAddDraftAgent = () => {
    if (draftAgents.length >= MAX_TOTAL_AGENTS) {
      onNotify?.(`Maksimal ${MAX_TOTAL_AGENTS} agen di kantor saat ini.`, 'info');
      return;
    }
    const usedDesks = new Set(draftAgents.map((a) => `${a.deskSpot?.x},${a.deskSpot?.y}`));
    const slot =
      EXTRA_AGENT_SLOTS.find((s) => !usedDesks.has(`${s.deskSpot.x},${s.deskSpot.y}`)) ||
      EXTRA_AGENT_SLOTS[(draftAgents.length - DEFAULT_AGENTS.length) % EXTRA_AGENT_SLOTS.length];

    const newAgent = {
      id: `agent-${Date.now().toString(36)}`,
      name: slot.defaultName,
      role: slot.defaultRole,
      preferredModel: 'auto',
      accentHex: slot.accentHex,
      accentLight: slot.accentLight,
      badgeClass: slot.badgeClass,
      avatarBg: slot.avatarBg,
      shirtColor: slot.shirtColor,
      hairColor: slot.hairColor,
      skinColor: slot.skinColor,
      homeSpot: slot.homeSpot,
      deskSpot: slot.deskSpot,
      deskRect: slot.deskRect,
      sop: slot.defaultSop,
    };
    setDraftAgents((prev) => [...prev, newAgent]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Manajemen Tim, Model &amp; SOP Agen</h3>
            <p className="text-[11px] text-slate-400">
              Agen tambahan otomatis menempati meja kosong &amp; berpartisipasi sebagai Spesialis di Full Relay.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {draftAgents.map((ag, idx) => {
          const isCore = CORE_AGENT_IDS.includes(ag.id);
          return (
            <div
              key={ag.id}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: ag.accentHex }}
                  />
                  <span className="text-[11px] font-semibold text-slate-300">
                    {isCore ? 'Agen Inti' : 'Agen Spesialis Tambahan'}
                  </span>
                </div>
                {!isCore && (
                  <button
                    type="button"
                    onClick={() =>
                      setDraftAgents((prev) => prev.filter((item) => item.id !== ag.id))
                    }
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Hapus</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  value={ag.name}
                  onChange={(e) => {
                    const next = [...draftAgents];
                    next[idx] = { ...next[idx], name: e.target.value };
                    setDraftAgents(next);
                  }}
                  placeholder="Nama agen"
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
                <input
                  value={ag.role}
                  onChange={(e) => {
                    const next = [...draftAgents];
                    next[idx] = { ...next[idx], role: e.target.value };
                    setDraftAgents(next);
                  }}
                  placeholder="Peran / Jabatan"
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
                <select
                  value={ag.preferredModel || 'auto'}
                  onChange={(e) => {
                    const next = [...draftAgents];
                    next[idx] = { ...next[idx], preferredModel: e.target.value };
                    setDraftAgents(next);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-indigo-200 focus:outline-none focus:border-indigo-500"
                >
                  {AVAILABLE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                rows={3}
                value={ag.sop}
                onChange={(e) => {
                  const next = [...draftAgents];
                  next[idx] = { ...next[idx], sop: e.target.value };
                  setDraftAgents(next);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
              />
            </div>
          );
        })}

        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            disabled={draftAgents.length >= MAX_TOTAL_AGENTS}
            onClick={handleAddDraftAgent}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-300 border border-indigo-500/40 disabled:opacity-40 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>
              Tambah Agen ({draftAgents.length}/{MAX_TOTAL_AGENTS})
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              onClick={() => onSave(draftAgents)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Simpan Tim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
