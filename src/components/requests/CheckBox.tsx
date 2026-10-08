import { CheckIcon } from './icons';

interface CheckBoxProps {
  checked: boolean;
  disabled?: boolean;
  onClick: (e: React.MouseEvent) => void;
  'aria-label'?: string;
  className?: string;
}

export function CheckBox({ checked, disabled, onClick, className = '', ...props }: CheckBoxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={onClick}
      className={`shrink-0 flex items-center justify-center w-[22px] h-[22px] rounded-lg border-[1.6px] transition-colors duration-[180ms]
        ${disabled
          ? 'bg-[#d9d8d1] border-[#d9d8d1] text-white cursor-default'
          : checked
            ? 'bg-[#111] border-[#111] text-white'
            : 'bg-white border-[#c9c8c0] text-transparent hover:border-[#111]'
        } ${className}`}
      {...props}
    >
      <CheckIcon size={12} strokeWidth={3.2} />
    </button>
  );
}
