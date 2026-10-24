import React from 'react';
import { X, CheckCircle, FileText, Shuffle, Users, Award, Dices } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#111726] border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>도움말 및 빠른 사용 안내</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
          <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800/80 space-y-1">
            <div className="font-semibold text-amber-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>1. 목록 랜덤 추첨기 (Random Picker)</span>
            </div>
            <p className="text-slate-400">
              추첨할 항목들을 줄바꿈(엔터)으로 구분해 입력창에 적어주세요. 중복 제거 버튼으로 중복 텍스트를 정리할 수 있으며, &apos;비복원 추출&apos; 옵션을 켜면 당첨된 항목을 제외하고 다음 추첨을 진행할 수 있습니다.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800/80 space-y-1">
            <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
              <Shuffle className="w-3.5 h-3.5" />
              <span>2. 룰렛 돌림판 (Roulette Wheel)</span>
            </div>
            <p className="text-slate-400">
              부채꼴 조각에 맞게 항목이 실시간 배치됩니다. 클릭 또는 돌리기 버튼을 누르면 물리 감속 효과와 함께 바늘 틱 소리가 나며 당첨 조각을 판정합니다.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800/80 space-y-1">
            <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>3. 사다리 타기 게임 (Ghost Leg)</span>
            </div>
            <p className="text-slate-400">
              인원 수를 선택하고 각 참가자 이름과 아래 벌칙/결과를 입력하세요. 상단의 참가자 버튼을 누르면 실시간으로 다리를 타고 내려가는 애니메이션이 재생됩니다. &apos;가림막 ON&apos;으로 결과를 숨길 수도 있습니다.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800/80 space-y-1">
            <div className="font-semibold text-amber-300 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>4. 로또 6/45 번호 추첨</span>
            </div>
            <p className="text-slate-400">
              동행복권 1~45 공식 색상 체계가 적용된 물리 볼 추출기입니다. 반드시 포함할 고정수와 제외할 번호를 지정하여 1~5게임 복권 슬립을 자동으로 생성할 수 있습니다.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800/80 space-y-1">
            <div className="font-semibold text-violet-400 flex items-center gap-1.5">
              <Dices className="w-3.5 h-3.5" />
              <span>5. 범위 난수 & 주사위 / 동전</span>
            </div>
            <p className="text-slate-400">
              최솟값~최댓값 사이의 숫자를 무작위로 뽑거나, 일상에서 빠른 결정이 필요할 때 동전 앞뒤 튕기기 및 6면체 주사위를 즉석에서 던져보세요.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
