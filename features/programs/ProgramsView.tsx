import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { SectionCard } from '../../components/ui/SectionCard';
import { Icons } from '../../components/icons/Icons';
import { triggerHaptic } from '../../core/utils';
import { useConfirm } from '../../hooks/useConfirm';
import { EmptyState } from '../../components/ui/EmptyState';
import { Program, ProgramSession } from '../../core/types';

interface ProgramsViewProps {
  onStartPreview: (progName: string, sess: ProgramSession) => void;
}

export const ProgramsView: React.FC<ProgramsViewProps> = ({ onStartPreview }) => {
  const navigate = useNavigate();
  const programs = useStore((s) => s.programs);
  const setPrograms = useStore((s) => s.setPrograms);
  const confirm = useConfirm();

  const onDuplicateProgram = (id: string) => {
    const prog = programs.find((p) => p.id === id);
    if (!prog) return;

    confirm({
      title: 'DUPLIQUER ?',
      message: `Créer une copie de "${prog.name}" ?`,
      confirmLabel: 'Copier',
      variant: 'primary',
      onConfirm: () => {
        const newProgram: Program = JSON.parse(JSON.stringify(prog));
        newProgram.id = `prog_${crypto.randomUUID()}`;
        newProgram.name = `${prog.name} (Copie)`;
        newProgram.sessions.forEach((s) => {
          s.id = `sess_${crypto.randomUUID()}`;
        });

        setPrograms((prev) => [...prev, newProgram]);
        triggerHaptic('success');
      },
    });
  };

  const onDeleteProgram = (id: string) => {
    confirm({
      title: 'SUPPRIMER ?',
      message: 'Voulez-vous supprimer ce programme ?',
      subMessage: 'Cette action est irréversible.',
      variant: 'danger',
      onConfirm: () => {
        setPrograms((prev) => prev.filter((p) => p.id !== id));
        triggerHaptic('success');
      },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-24 h-full flex flex-col">
      <div className="flex-shrink-0 space-y-6">
        <h2 className="text-2xl font-black italic uppercase px-1">Programmes</h2>

        <button
          onClick={() => {
            triggerHaptic('click');
            navigate('/programs/edit/new');
          }}
          className="w-full py-4 bg-primary text-background font-black uppercase rounded-[2rem] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-primary/20"
        >
          <Icons.Plus size={18} strokeWidth={3} />
          <span>Nouveau Programme</span>
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-4">
        {programs.length > 0 ? (
          programs.map((prog) => (
            <SectionCard key={prog.id} className="overflow-hidden">
              <div className="p-4 bg-surface2/30 border-b border-border flex justify-between items-center">
                <h3 className="font-black italic text-lg uppercase truncate pr-2">{prog.name}</h3>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => {
                      triggerHaptic('click');
                      onDuplicateProgram(prog.id);
                    }}
                    className="p-2 text-secondary hover:text-white transition-colors rounded-lg"
                    aria-label="Dupliquer"
                  >
                    <Icons.Copy size={18} />
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic('click');
                      navigate(`/programs/edit/${prog.id}`);
                    }}
                    className="p-2 text-secondary hover:text-primary transition-colors rounded-lg"
                  >
                    <Icons.Edit size={18} />
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic('click');
                      onDeleteProgram(prog.id);
                    }}
                    className="p-2 text-secondary/50 hover:text-danger transition-colors rounded-lg"
                  >
                    <Icons.Trash size={18} />
                  </button>
                </div>
              </div>
              <div className="p-2 space-y-2">
                {prog.sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="bg-surface2/20 p-3 rounded-xl flex justify-between items-center group hover:bg-surface2/50 transition-all cursor-pointer"
                    onClick={() => {
                      triggerHaptic('click');
                      onStartPreview(prog.name, sess);
                    }}
                  >
                    <div>
                      <div className="font-bold text-sm">{sess.name}</div>
                      <div className="text-[10px] text-secondary">{sess.exos.length} exercices</div>
                    </div>
                    <button className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all border border-primary/20 group-hover:border-transparent">
                      <Icons.ChevronRight size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </SectionCard>
          ))
        ) : (
          <EmptyState
            icon={<Icons.Programs />}
            title="Aucun Programme"
            subtitle="Créez votre première routine pour commencer l'entraînement."
          />
        )}
      </div>
    </div>
  );
};
